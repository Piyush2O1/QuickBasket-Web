import mongoose from "mongoose";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { createNotifications } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";

const notificationPopulate = [
  { path: "sender", select: "name email role" },
  { path: "recipient", select: "name email role" },
  { path: "order", select: "status totalAmount" },
];

const recipientRoles = ["user", "deliveryBoy"];
const audienceQueries = {
  users: { role: "user" },
  deliveryBoys: { role: "deliveryBoy" },
  all: { role: { $in: recipientRoles } },
};

const getLimit = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 50;
  }

  return Math.min(Math.floor(parsed), 100);
};

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = getLimit(req.query.limit);
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .populate(notificationPopulate)
      .sort({ createdAt: -1 })
      .limit(limit),
    Notification.countDocuments({ recipient: req.user._id, readAt: null }),
  ]);

  res.json({ notifications, unreadCount });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    readAt: null,
  });

  res.json({ unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id).populate(notificationPopulate);

  if (!notification) {
    throw notFound("Notification not found");
  }

  if (String(notification.recipient?._id || notification.recipient) !== String(req.user._id)) {
    throw forbidden("You cannot update this notification");
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
    await notification.populate(notificationPopulate);
  }

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    readAt: null,
  });

  res.json({ notification, unreadCount });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
  );

  res.json({ success: true, unreadCount: 0 });
});

export const listNotificationRecipients = asyncHandler(async (req, res) => {
  const requestedRole = String(req.query.role || "all");
  const search = String(req.query.search || "").trim();
  const query = {
    role:
      requestedRole === "user" || requestedRole === "deliveryBoy"
        ? requestedRole
        : { $in: recipientRoles },
  };

  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: pattern }, { email: pattern }, { mobile: pattern }];
  }

  const recipients = await User.find(query)
    .select("name email mobile role")
    .sort({ name: 1 })
    .limit(50);

  res.json({ recipients });
});

export const sendAdminNotification = asyncHandler(async (req, res) => {
  const { audience = "users", targetUserId, title, message } = req.body;
  const normalizedTitle = String(title || "").trim();
  const normalizedMessage = String(message || "").trim();

  if (!normalizedTitle || !normalizedMessage) {
    throw badRequest("Title and message are required");
  }

  if (!["users", "deliveryBoys", "all", "targetUser"].includes(audience)) {
    throw badRequest("Invalid notification audience");
  }

  const query =
    audience === "targetUser"
      ? { _id: targetUserId, role: { $in: recipientRoles } }
      : audienceQueries[audience];

  if (audience === "targetUser" && !targetUserId) {
    throw badRequest("Select a recipient for targeted notification");
  }

  if (audience === "targetUser" && !mongoose.isValidObjectId(targetUserId)) {
    throw badRequest("Select a valid recipient");
  }

  const recipients = await User.find(query).select("_id socketId role");

  if (!recipients.length) {
    throw badRequest("No recipients found for this notification");
  }

  const notifications = await createNotifications({
    recipients,
    sender: req.user._id,
    title: normalizedTitle,
    message: normalizedMessage,
    category: "admin",
    audience,
    io: req.app.get("io"),
  });

  res.status(201).json({
    success: true,
    count: notifications.length,
    notifications,
  });
});

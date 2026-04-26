import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { emitToUser } from "../socket/emit.js";

const notificationPopulate = [
  { path: "sender", select: "name email role" },
  { path: "recipient", select: "name email role" },
  { path: "order", select: "status totalAmount" },
];

const normalizeRecipientId = (recipient) => {
  const value = recipient?._id || recipient;
  return value ? String(value) : null;
};

export const createNotifications = async ({
  recipients,
  sender = null,
  order = null,
  title,
  message,
  category = "admin",
  audience = "targetUser",
  metadata = {},
  io = null,
}) => {
  const recipientIds = [
    ...new Set((recipients || []).map(normalizeRecipientId).filter(Boolean)),
  ];

  if (!recipientIds.length) {
    return [];
  }

  const created = await Notification.insertMany(
    recipientIds.map((recipient) => ({
      recipient,
      sender,
      order,
      title,
      message,
      category,
      audience,
      metadata,
    })),
  );

  const notifications = await Notification.find({
    _id: { $in: created.map((notification) => notification._id) },
  })
    .populate(notificationPopulate)
    .sort({ createdAt: -1 });

  const users = await User.find({ _id: { $in: recipientIds } }).select("socketId isOnline");
  const notificationsByRecipient = notifications.reduce((map, notification) => {
    const key = normalizeRecipientId(notification.recipient);

    if (!key) return map;

    map.set(key, [...(map.get(key) || []), notification]);
    return map;
  }, new Map());

  await Promise.all(
    users.map(async (user) => {
      const unreadCount = await Notification.countDocuments({
        recipient: user._id,
        readAt: null,
      });

      (notificationsByRecipient.get(String(user._id)) || []).forEach((notification) => {
        emitToUser(io, user, "notification-created", {
          notification,
          unreadCount,
        });
      });
    }),
  );

  return notifications;
};

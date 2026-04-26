import crypto from "crypto";
import { DeliveryAssignment } from "../models/deliveryAssignment.model.js";
import { Order } from "../models/order.model.js";
import { createNotifications } from "../services/notification.service.js";
import {
  deliveryBaseFee,
  getCurrentStoreLocation,
  deliveryPerKmFee,
  getDeliveryFee,
  storeLocation,
} from "../services/pricing.service.js";
import { emitToRoles, emitToUser } from "../socket/emit.js";
import { sendMail } from "../services/mail.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";

const deliveryOtpExpiryMs = 2 * 60 * 1000;

const populateOrder = [
  { path: "order", populate: [{ path: "user", select: "name email mobile location socketId" }] },
  { path: "assignedTo", select: "name email mobile location socketId" },
];

const isValidLatLng = (location) =>
  location &&
  Number.isFinite(location.latitude) &&
  Number.isFinite(location.longitude) &&
  !(location.latitude === 0 && location.longitude === 0);

const toOrderLatLng = (order) => {
  const latitude = Number(order?.address?.latitude);
  const longitude = Number(order?.address?.longitude);

  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
};

const getDistanceKm = (from, to) => {
  if (!isValidLatLng(from) || !isValidLatLng(to)) return 0;

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const roundAmount = (value) => Math.round(Number(value || 0) * 100) / 100;

const calculateDeliveryEarning = async ({ order }) => {
  const currentStoreLocation = await getCurrentStoreLocation();
  const to = toOrderLatLng(order);
  const distanceKm = roundAmount(getDistanceKm(currentStoreLocation || storeLocation, to));
  const chargedDeliveryFee = Number(order?.deliveryFee || 0);
  const fallbackDeliveryFee = chargedDeliveryFee ? chargedDeliveryFee : await getDeliveryFee(0, order?.address);
  const amount = roundAmount(chargedDeliveryFee || fallbackDeliveryFee);

  return {
    amount,
    distanceKm,
    baseAmount: deliveryBaseFee,
    perKmRate: deliveryPerKmFee,
    distanceAmount: roundAmount(Math.max(0, amount - deliveryBaseFee)),
    currency: "INR",
    calculatedAt: new Date(),
  };
};

export const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await DeliveryAssignment.find({
    status: "broadcasted",
    broadcastedTo: req.user._id,
  })
    .populate(populateOrder)
    .sort({ createdAt: -1 });

  res.json({ assignments });
});

export const acceptAssignment = asyncHandler(async (req, res) => {
  const assignment = await DeliveryAssignment.findById(req.params.id);

  if (!assignment) {
    throw notFound("Assignment not found");
  }
  if (assignment.status !== "broadcasted") {
    throw badRequest("Assignment is no longer open");
  }
  if (!assignment.broadcastedTo.some((id) => id.toString() === req.user._id.toString())) {
    throw forbidden("This assignment was not sent to you");
  }

  assignment.status = "assigned";
  assignment.assignedTo = req.user._id;
  assignment.acceptedAt = new Date();
  await assignment.save();

  const order = await Order.findByIdAndUpdate(
    assignment.order,
    {
      status: "out of delivery",
      assignedDeliveryBoy: req.user._id,
      assignment: assignment._id,
    },
    { new: true },
  ).populate("user assignedDeliveryBoy assignment");

  const io = req.app.get("io");
  emitToUser(io, order?.user, "delivery-assigned", order);
  emitToUser(io, order?.user, "order-updated", order);
  await emitToRoles(io, ["admin"], "order-assigned", {
    orderId: order?._id?.toString(),
    assignedDeliveryBoy: order?.assignedDeliveryBoy,
  });
  await emitToRoles(io, ["admin"], "assignment-updated", {
    assignmentId: assignment._id.toString(),
    orderId: order?._id?.toString(),
    status: assignment.status,
    broadcastedTo: [],
  });

  res.json({ assignment, order });
});

export const rejectAssignment = asyncHandler(async (req, res) => {
  const assignment = await DeliveryAssignment.findById(req.params.id);

  if (!assignment) {
    throw notFound("Assignment not found");
  }
  if (assignment.status !== "broadcasted") {
    throw badRequest("Assignment is no longer open");
  }

  assignment.broadcastedTo = assignment.broadcastedTo.filter(
    (id) => id.toString() !== req.user._id.toString(),
  );
  const io = req.app.get("io");

  if (!assignment.broadcastedTo.length) {
    const order = await Order.findByIdAndUpdate(
      assignment.order,
      {
        status: "pending",
        assignment: null,
        assignedDeliveryBoy: null,
      },
      { new: true },
    ).populate("user assignedDeliveryBoy assignment");

    await DeliveryAssignment.findByIdAndDelete(assignment._id);

    emitToUser(io, order?.user, "order-updated", order);
    await emitToRoles(io, ["admin"], "order-status-update", {
      orderId: order?._id?.toString(),
      status: "pending",
    });
    await emitToRoles(io, ["admin"], "assignment-updated", {
      assignmentId: assignment._id.toString(),
      orderId: assignment.order.toString(),
      status: "completed",
      broadcastedTo: [],
    });

    return res.json({ success: true, order });
  }

  await assignment.save();
  const refreshedAssignment = await DeliveryAssignment.findById(assignment._id).populate(
    "broadcastedTo",
    "name email mobile socketId",
  );

  await emitToRoles(io, ["admin"], "assignment-updated", {
    assignmentId: assignment._id.toString(),
    orderId: assignment.order.toString(),
    status: assignment.status,
    broadcastedTo:
      refreshedAssignment?.broadcastedTo?.map((deliveryBoy) => ({
        _id: deliveryBoy._id.toString(),
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        mobile: deliveryBoy.mobile,
      })) || [],
  });

  res.json({ success: true, assignment: refreshedAssignment });
});

export const currentDeliveryOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    assignedDeliveryBoy: req.user._id,
    status: "out of delivery",
  }).populate("user assignedDeliveryBoy assignment");

  res.json({ order });
});

export const deliveryEarnings = asyncHandler(async (req, res) => {
  const deliveryBoyId =
    req.user.role === "admin" && req.query.deliveryBoyId ? req.query.deliveryBoyId : req.user._id;
  const orders = await Order.find({
    assignedDeliveryBoy: deliveryBoyId,
    status: "delivered",
  })
    .populate("user", "name email mobile")
    .sort({ deliveredAt: -1, updatedAt: -1 });

  const history = orders.map((order) => {
    const earning = order.deliveryEarning || {};
    const deliveredAt = order.deliveredAt || order.updatedAt || order.createdAt;

    return {
      orderId: order._id.toString(),
      shortOrderId: String(order._id).slice(-6),
      customerName: order.address?.fullName || order.user?.name || "Customer",
      address: order.address?.fullAddress || "",
      totalAmount: Number(order.totalAmount || 0),
      deliveredAt,
      earningAmount: Number(earning.amount || 0),
      distanceKm: Number(earning.distanceKm || 0),
      baseAmount: Number(earning.baseAmount || 0),
      distanceAmount: Number(earning.distanceAmount || 0),
      perKmRate: Number(earning.perKmRate || 0),
    };
  });

  const summary = history.reduce(
    (totals, item) => ({
      totalEarning: totals.totalEarning + item.earningAmount,
      totalDistance: totals.totalDistance + item.distanceKm,
      completedOrders: totals.completedOrders + 1,
    }),
    { totalEarning: 0, totalDistance: 0, completedOrders: 0 },
  );

  const chartByDate = history.reduce((map, item) => {
    const key = new Date(item.deliveredAt).toISOString().slice(0, 10);
    const current = map.get(key) || { date: key, earning: 0, orders: 0 };

    current.earning = roundAmount(current.earning + item.earningAmount);
    current.orders += 1;
    map.set(key, current);

    return map;
  }, new Map());

  const chart = [...chartByDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  res.json({
    summary: {
      totalEarning: roundAmount(summary.totalEarning),
      totalDistance: roundAmount(summary.totalDistance),
      completedOrders: summary.completedOrders,
      averageEarning: summary.completedOrders
        ? roundAmount(summary.totalEarning / summary.completedOrders)
        : 0,
    },
    chart,
    history,
  });
});

export const sendDeliveryOtp = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate("user assignedDeliveryBoy");

  if (!order) {
    throw notFound("Order not found");
  }
  if (order.assignedDeliveryBoy?._id?.toString() !== req.user._id.toString()) {
    throw forbidden("You are not assigned to this order");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + deliveryOtpExpiryMs);
  order.deliveryOtp = otp;
  order.deliveryOtpExpiresAt = expiresAt;
  order.deliveryOtpVerification = false;
  await order.save();

  const deliveryChannels = [];
  const deliveryWarnings = [];

  try {
    await sendMail({
      to: order.user.email,
      subject: "Quick Basket delivery OTP",
      html: `<p>Your delivery OTP is <strong>${otp}</strong>. It expires in 2 minutes.</p>`,
    });

    deliveryChannels.push({
      type: "email",
      label: "Customer email",
      detail: order.user.email,
    });
  } catch {
    deliveryWarnings.push("Email could not be sent, so the OTP was delivered by notification only.");
  }

  const notifications = await createNotifications({
    recipients: [order.user],
    order: order._id,
    title: `Delivery OTP for order #${String(order._id).slice(-6)}`,
    message: `Your Quick Basket delivery OTP is ${otp}. It is valid for 2 minutes.`,
    category: "deliveryOtp",
    audience: "targetUser",
    metadata: {
      orderId: order._id.toString(),
      expiresAt,
    },
    io: req.app.get("io"),
  });

  if (notifications.length) {
    deliveryChannels.push({
      type: "notification",
      label: "User notification",
      detail: "Quick Basket notification center",
    });
  }

  if (!deliveryChannels.length) {
    throw badRequest("Could not send the OTP right now. Please try again.");
  }

  res.json({ success: true, expiresAt, deliveryChannels, deliveryWarnings });
});

export const verifyDeliveryOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const order = await Order.findById(req.params.orderId).populate("user assignedDeliveryBoy");

  if (!order) {
    throw notFound("Order not found");
  }
  if (order.assignedDeliveryBoy?._id?.toString() !== req.user._id.toString()) {
    throw forbidden("You are not assigned to this order");
  }
  if (!otp || otp !== order.deliveryOtp) {
    throw badRequest("Invalid OTP");
  }
  if (!order.deliveryOtpExpiresAt || order.deliveryOtpExpiresAt < new Date()) {
    throw badRequest("OTP expired");
  }
  if (
    order.paymentMethod === "online" &&
    Number(order.locationExtraCharge?.amountDue || 0) > Number(order.locationExtraCharge?.paidAmount || 0) &&
    !order.locationExtraCharge?.isPaid
  ) {
    throw badRequest("Customer must pay the location change extra charge before delivery");
  }

  order.deliveryOtpVerification = true;
  order.deliveryOtp = null;
  order.deliveryOtpExpiresAt = null;
  order.status = "delivered";
  order.deliveredAt = new Date();
  if (
    order.paymentMethod === "cod" &&
    Number(order.locationExtraCharge?.amountDue || 0) > Number(order.locationExtraCharge?.paidAmount || 0)
  ) {
    const amountDue = Number(order.locationExtraCharge.amountDue || 0);

    order.locationExtraCharge = {
      amountDue,
      paidAmount: amountDue,
      isPaid: true,
      updatedAt: new Date(),
    };
  }
  order.deliveryEarning = await calculateDeliveryEarning({ order });
  await order.save();

  if (order.assignment) {
    await DeliveryAssignment.findByIdAndUpdate(order.assignment, {
      status: "completed",
      completedAt: order.deliveredAt,
    });
  }

  const io = req.app.get("io");
  await createNotifications({
    recipients: [order.user],
    order: order._id,
    title: `Order #${String(order._id).slice(-6)} delivered`,
    message: "Your Quick Basket order has been delivered successfully after OTP verification.",
    category: "order",
    audience: "targetUser",
    metadata: {
      orderId: order._id.toString(),
      deliveredAt: order.deliveredAt,
    },
    io,
  });
  await createNotifications({
    recipients: [order.assignedDeliveryBoy],
    order: order._id,
    title: `Earning added for order #${String(order._id).slice(-6)}`,
    message: `Order delivered successfully. Rs. ${order.deliveryEarning.amount} has been added to your delivery earnings.`,
    category: "order",
    audience: "targetUser",
    metadata: {
      orderId: order._id.toString(),
      earningAmount: order.deliveryEarning.amount,
      deliveredAt: order.deliveredAt,
    },
    io,
  });
  emitToUser(io, order.user, "order-delivered", order);
  emitToUser(io, order.user, "order-updated", order);
  emitToUser(io, order.assignedDeliveryBoy, "order-updated", order);
  await emitToRoles(io, ["admin"], "order-status-update", {
    orderId: order._id.toString(),
    status: order.status,
  });

  res.json({ order, deliveryEarning: order.deliveryEarning });
});

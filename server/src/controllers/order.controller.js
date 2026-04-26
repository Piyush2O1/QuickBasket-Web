import crypto from "crypto";
import { DeliveryAssignment } from "../models/deliveryAssignment.model.js";
import { Grocery } from "../models/grocery.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { createNotifications } from "../services/notification.service.js";
import { sendMail } from "../services/mail.service.js";
import { calculateOrderPricing, getDeliveryFee } from "../services/pricing.service.js";
import { emitToRoles, emitToUser } from "../socket/emit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";
import { canAccessOrder } from "../utils/orderAccess.js";
import { buildPagination, getPagination } from "../utils/pagination.js";
import { track } from "../utils/pulseiq.js";

const locationChangeOtpExpiryMs = 10 * 60 * 1000;

const orderPopulate = [
  { path: "user", select: "name email mobile location socketId" },
  { path: "assignedDeliveryBoy", select: "name email mobile location socketId" },
  {
    path: "assignment",
    populate: [
      { path: "broadcastedTo", select: "name email mobile socketId" },
      { path: "assignedTo", select: "name email mobile socketId" },
    ],
  },
];

const roundAmount = (value) => Math.round(Number(value || 0) * 100) / 100;

const isOrderOwner = (order, user) =>
  String(order.user?._id || order.user) === String(user?._id || user?.id);

const normalizeAddressUpdate = (currentAddress = {}, nextAddress = {}) => {
  const latitude = Number(nextAddress.latitude);
  const longitude = Number(nextAddress.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw badRequest("Please select a valid delivery location");
  }
  if (!String(nextAddress.fullAddress || currentAddress.fullAddress || "").trim()) {
    throw badRequest("Full delivery address is required");
  }

  return {
    fullName: String(nextAddress.fullName || currentAddress.fullName || "").trim(),
    mobile: String(nextAddress.mobile || currentAddress.mobile || "").trim(),
    city: String(nextAddress.city || currentAddress.city || "").trim(),
    state: String(nextAddress.state || currentAddress.state || "").trim(),
    pincode: String(nextAddress.pincode || currentAddress.pincode || "").trim(),
    fullAddress: String(nextAddress.fullAddress || currentAddress.fullAddress || "").trim(),
    latitude,
    longitude,
  };
};

const getLocationChangePricing = async (order, address) => {
  const currentDeliveryFee = Number(order.deliveryFee || 0);
  const newDeliveryFee = await getDeliveryFee(Number(order.subtotalAmount || 0), address);

  return {
    currentDeliveryFee,
    newDeliveryFee,
    extraCharge: roundAmount(Math.max(0, newDeliveryFee - currentDeliveryFee)),
  };
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items = [], address, paymentMethod = "cod", couponCode = "" } = req.body;

  if (!items.length) {
    throw badRequest("Cart is empty");
  }
  if (!address) {
    throw badRequest("Delivery address is required");
  }

  const ids = items.map((item) => item.grocery || item._id || item.id);
  const groceries = await Grocery.find({ _id: { $in: ids } });
  const groceryMap = new Map(groceries.map((grocery) => [grocery._id.toString(), grocery]));

  const normalizedItems = items.map((item) => {
    const id = String(item.grocery || item._id || item.id);
    const grocery = groceryMap.get(id);

    if (!grocery) {
      throw badRequest("One or more groceries are invalid");
    }

    const quantity = Number(item.quantity || 1);

    return {
      grocery: grocery._id,
      name: grocery.name,
      price: grocery.price,
      unit: grocery.unit,
      image: grocery.image,
      quantity,
    };
  });

  const subtotalAmount = normalizedItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0,
  );
  const pricing = await calculateOrderPricing({ subtotal: subtotalAmount, couponCode, address });

  const order = await Order.create({
    user: req.user._id,
    items: normalizedItems,
    address,
    paymentMethod,
    subtotalAmount: pricing.subtotalAmount,
    deliveryFee: pricing.deliveryFee,
    discountAmount: pricing.discountAmount,
    coupon: pricing.coupon,
    totalAmount: pricing.totalAmount,
    isPaid: false,
  });

  const populatedOrder = await Order.findById(order._id).populate(orderPopulate);
  const io = req.app.get("io");

  if (paymentMethod === "cod") {
    await emitToRoles(io, ["admin"], "new-order", populatedOrder);
  }

  await track("order_created", req.user._id, {
    orderId: order._id.toString(),
    paymentMethod,
    totalAmount: pricing.totalAmount,
    itemCount: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
    couponCode: pricing.coupon?.code,
  });

  res.status(201).json({ order: populatedOrder });
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
    $or: [{ paymentMethod: "cod" }, { isPaid: true }],
  })
    .populate(orderPopulate)
    .sort({
      createdAt: -1,
    });

  res.json({ orders });
});

export const allOrders = asyncHandler(async (_req, res) => {
  const { page, limit, skip } = getPagination(_req.query);
  const [total, orders] = await Promise.all([
    Order.countDocuments(),
    limit > 0
      ? Order.find().populate(orderPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit)
      : Order.find().populate(orderPopulate).sort({ createdAt: -1 }),
  ]);

  res.json({
    orders,
    pagination: buildPagination({ total, page, limit }),
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(orderPopulate);

  if (!order) {
    throw notFound("Order not found");
  }

  if (!canAccessOrder(order, req.user)) {
    throw forbidden("You cannot view this order");
  }

  res.json({ order });
});

export const sendLocationChangeOtp = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(orderPopulate);

  if (!order) {
    throw notFound("Order not found");
  }
  if (!isOrderOwner(order, req.user)) {
    throw forbidden("You cannot edit this order location");
  }
  if (["delivered", "cancelled"].includes(order.status)) {
    throw badRequest("Delivery location cannot be changed for this order");
  }

  const address = normalizeAddressUpdate(order.address, req.body.address || req.body);
  const pricing = await getLocationChangePricing(order, address);
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + locationChangeOtpExpiryMs);

  order.locationChangeOtp = otp;
  order.locationChangeOtpExpiresAt = expiresAt;
  order.pendingLocationChange = {
    address,
    pricing,
    requestedAt: new Date(),
  };
  await order.save();

  const deliveryChannels = [];
  const deliveryWarnings = [];

  try {
    await sendMail({
      to: order.user.email,
      subject: "Quick Basket location change OTP",
      html: `<p>Your OTP to update delivery location for order #${String(order._id).slice(-6)} is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
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
    title: `Location change OTP for order #${String(order._id).slice(-6)}`,
    message: `Your Quick Basket location change OTP is ${otp}. Extra delivery charge: Rs. ${pricing.extraCharge}.`,
    category: "order",
    audience: "targetUser",
    metadata: {
      orderId: order._id.toString(),
      expiresAt,
      pricing,
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

  res.json({
    success: true,
    expiresAt,
    pricing,
    deliveryChannels,
    deliveryWarnings,
  });
});

export const verifyLocationChangeOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const order = await Order.findById(req.params.id).populate(orderPopulate);

  if (!order) {
    throw notFound("Order not found");
  }
  if (!isOrderOwner(order, req.user)) {
    throw forbidden("You cannot edit this order location");
  }
  if (["delivered", "cancelled"].includes(order.status)) {
    throw badRequest("Delivery location cannot be changed for this order");
  }
  if (!order.pendingLocationChange?.address) {
    throw badRequest("Request a fresh OTP before updating delivery location");
  }
  if (!otp || otp !== order.locationChangeOtp) {
    throw badRequest("Invalid OTP");
  }
  if (!order.locationChangeOtpExpiresAt || order.locationChangeOtpExpiresAt < new Date()) {
    throw badRequest("OTP expired. Request a new OTP");
  }

  const address = normalizeAddressUpdate(order.address, order.pendingLocationChange.address);
  const pricing = await getLocationChangePricing(order, address);
  const extraCharge = pricing.extraCharge;

  order.address = address;
  order.deliveryFee = Math.max(Number(order.deliveryFee || 0), pricing.newDeliveryFee);
  order.totalAmount = roundAmount(Number(order.totalAmount || 0) + extraCharge);
  order.locationChangeOtp = null;
  order.locationChangeOtpExpiresAt = null;
  order.pendingLocationChange = undefined;

  if (extraCharge > 0) {
    const currentDue = Number(order.locationExtraCharge?.amountDue || 0);

    order.locationExtraCharge = {
      amountDue: roundAmount(currentDue + extraCharge),
      paidAmount: Number(order.locationExtraCharge?.paidAmount || 0),
      isPaid: false,
      updatedAt: new Date(),
    };
  }

  await order.save();

  const populatedOrder = await Order.findById(order._id).populate(orderPopulate);
  const io = req.app.get("io");

  await createNotifications({
    recipients: [populatedOrder.user],
    order: populatedOrder._id,
    title: `Delivery location updated for order #${String(populatedOrder._id).slice(-6)}`,
    message:
      extraCharge > 0
        ? `Your delivery location was updated. Extra delivery charge: Rs. ${extraCharge}.`
        : "Your delivery location was updated. No extra delivery charge was added.",
    category: "order",
    audience: "targetUser",
    metadata: {
      orderId: populatedOrder._id.toString(),
      pricing,
    },
    io,
  });

  if (populatedOrder.assignedDeliveryBoy) {
    await createNotifications({
      recipients: [populatedOrder.assignedDeliveryBoy],
      order: populatedOrder._id,
      title: `Customer changed location for order #${String(populatedOrder._id).slice(-6)}`,
      message: "The customer updated the delivery location. Please check the latest route.",
      category: "order",
      audience: "targetUser",
      metadata: {
        orderId: populatedOrder._id.toString(),
      },
      io,
    });
  }

  emitToUser(io, populatedOrder.user, "order-updated", populatedOrder);
  emitToUser(io, populatedOrder.assignedDeliveryBoy, "order-updated", populatedOrder);
  await emitToRoles(io, ["admin"], "order-status-update", {
    orderId: populatedOrder._id.toString(),
    status: populatedOrder.status,
  });

  res.json({ order: populatedOrder, pricing });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["pending", "out of delivery", "cancelled"].includes(status)) {
    throw badRequest("Invalid order status");
  }

  const order = await Order.findById(req.params.id).populate(orderPopulate);

  if (!order) {
    throw notFound("Order not found");
  }
  if (order.status === "delivered") {
    throw badRequest("Delivered orders cannot be changed by admin");
  }
  if (order.status === "cancelled") {
    throw badRequest("Cancelled orders cannot be changed");
  }

  const previousDeliveryBoy = order.assignedDeliveryBoy;
  order.status = status;

  if (status === "cancelled") {
    order.assignedDeliveryBoy = null;
    if (order.assignment) {
      await DeliveryAssignment.findByIdAndUpdate(order.assignment, { status: "completed" });
    }
    order.assignment = null;
  }

  if (status === "out of delivery" && !order.assignment) {
    const deliveryBoys = await User.find({
      role: "deliveryBoy",
      isOnline: true,
      socketId: { $ne: null },
    });

    if (!deliveryBoys.length) {
      throw badRequest("No delivery partners are currently online");
    }

    const broadcastedTo = deliveryBoys.map((user) => user._id);
    const assignment = await DeliveryAssignment.create({
      order: order._id,
      broadcastedTo,
    });

    order.assignment = assignment._id;

    const io = req.app.get("io");
    deliveryBoys.forEach((deliveryBoy) => {
      if (deliveryBoy.socketId) {
        io?.to(deliveryBoy.socketId).emit("new-assignment", {
          assignmentId: assignment._id,
          orderId: order._id,
        });
      }
    });

    await emitToRoles(io, ["admin"], "assignment-updated", {
      assignmentId: assignment._id.toString(),
      orderId: order._id.toString(),
      status: assignment.status,
      broadcastedTo: deliveryBoys.map((deliveryBoy) => ({
        _id: deliveryBoy._id.toString(),
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        mobile: deliveryBoy.mobile,
      })),
    });
  }

  await order.save();
  const populatedOrder = await Order.findById(order._id).populate(orderPopulate);

  const io = req.app.get("io");
  emitToUser(io, populatedOrder.user, "order-updated", populatedOrder);
  if (previousDeliveryBoy) {
    emitToUser(io, previousDeliveryBoy, "order-updated", populatedOrder);
  }
  await emitToRoles(io, ["admin"], "order-status-update", {
    orderId: populatedOrder._id.toString(),
    status: populatedOrder.status,
  });

  res.json({ order: populatedOrder });
});

export const orderStats = asyncHandler(async (_req, res) => {
  const [totalOrders, pendingOrders, deliveredOrders, users, groceries, totalRevenueResult] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "delivered" }),
    User.countDocuments({ role: "user" }),
    Grocery.countDocuments(),
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  res.json({
    stats: {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      users,
      groceries,
      totalRevenue: totalRevenueResult[0]?.totalRevenue || 0,
    },
  });
});

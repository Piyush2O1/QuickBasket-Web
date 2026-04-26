import { env, hasEnvValue, requireEnv } from "../config/env.js";
import { Order } from "../models/order.model.js";
import { emitToRoles, emitToUser } from "../socket/emit.js";
import { getStripe } from "../services/stripe.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";

const getOrderUserId = (order) => order.user?._id?.toString?.() || order.user?.toString?.();
const getUserId = (user) => user?._id?.toString?.() || user?.id?.toString?.();
const ownsOrder = (order, user) => getOrderUserId(order) === getUserId(user);

export const getPaymentConfig = asyncHandler(async (_req, res) => {
  res.json({
    stripeEnabled: hasEnvValue(env.stripeSecretKey),
  });
});

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);

  if (!order) {
    throw notFound("Order not found");
  }
  if (!ownsOrder(order, req.user)) {
    throw forbidden("You cannot pay for this order");
  }
  if (order.isPaid) {
    throw badRequest("Order is already paid");
  }

  const stripe = getStripe();
  const amount = Math.round(Number(order.totalAmount || 0) * 100);

  if (amount < 100) {
    throw badRequest("Online payment amount must be at least Rs. 1");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${env.clientUrl}/user/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
    cancel_url: `${env.clientUrl}/user/order-cancel?order_id=${order._id}`,
    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `Quick Basket order #${String(order._id).slice(-6)}`,
            description: order.coupon?.code
              ? `Includes delivery fee and ${order.coupon.code} discount`
              : "Includes delivery fee",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
  });

  res.json({ url: session.url });
});

export const createLocationExtraCheckoutSession = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);

  if (!order) {
    throw notFound("Order not found");
  }
  if (!ownsOrder(order, req.user)) {
    throw forbidden("You cannot pay for this order");
  }

  const amountDue = Number(order.locationExtraCharge?.amountDue || 0);
  const paidAmount = Number(order.locationExtraCharge?.paidAmount || 0);
  const remainingAmount = Math.max(0, amountDue - paidAmount);

  if (remainingAmount <= 0 || order.locationExtraCharge?.isPaid) {
    throw badRequest("No extra location charge is pending");
  }

  const stripe = getStripe();
  const amount = Math.round(remainingAmount * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${env.clientUrl}/user/order-success?payment_type=location_extra&session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
    cancel_url: `${env.clientUrl}/user/order-cancel?payment_type=location_extra&order_id=${order._id}`,
    metadata: {
      paymentType: "location_extra",
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `Location extra charge for order #${String(order._id).slice(-6)}`,
            description: "Extra delivery charge for updated location",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
  });

  res.json({ url: session.url });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const { sessionId, orderId } = req.body;

  if (!sessionId || !orderId) {
    throw badRequest("sessionId and orderId are required");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.orderId !== String(orderId)) {
    throw badRequest("Payment session does not match this order");
  }
  if (session.payment_status !== "paid") {
    throw badRequest("Payment is not completed");
  }

  const order = await Order.findById(orderId).populate("user assignedDeliveryBoy assignment");

  if (!order) {
    throw notFound("Order not found");
  }
  if (session.metadata?.userId !== getOrderUserId(order)) {
    throw badRequest("Payment session does not match this order");
  }

  const wasUnpaid = !order.isPaid;
  order.isPaid = true;
  order.paymentMethod = "online";
  await order.save();

  if (wasUnpaid) {
    const io = req.app.get("io");
    await emitToRoles(io, ["admin"], "new-order", order);
  }

  res.json({ order });
});

export const confirmLocationExtraPayment = asyncHandler(async (req, res) => {
  const { sessionId, orderId } = req.body;

  if (!sessionId || !orderId) {
    throw badRequest("sessionId and orderId are required");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.paymentType !== "location_extra") {
    throw badRequest("Payment session is not for location extra charge");
  }
  if (session.metadata?.orderId !== String(orderId)) {
    throw badRequest("Payment session does not match this order");
  }
  if (session.payment_status !== "paid") {
    throw badRequest("Payment is not completed");
  }

  const order = await Order.findById(orderId).populate("user assignedDeliveryBoy assignment");

  if (!order) {
    throw notFound("Order not found");
  }
  if (session.metadata?.userId !== getOrderUserId(order)) {
    throw badRequest("Payment session does not match this order");
  }

  const amountDue = Number(order.locationExtraCharge?.amountDue || 0);
  const sessionAmount = Number(session.amount_total || 0) / 100;
  const paidAmount = Math.min(amountDue, Number(order.locationExtraCharge?.paidAmount || 0) + sessionAmount);

  order.locationExtraCharge = {
    amountDue,
    paidAmount,
    isPaid: paidAmount >= amountDue,
    updatedAt: new Date(),
  };
  await order.save();

  const io = req.app.get("io");
  emitToUser(io, order.user, "order-updated", order);
  emitToUser(io, order.assignedDeliveryBoy, "order-updated", order);
  await emitToRoles(io, ["admin"], "order-status-update", {
    orderId: order._id.toString(),
    status: order.status,
  });

  res.json({ order });
});

export const cancelPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    throw badRequest("orderId is required");
  }

  await Order.findOneAndDelete({
    _id: orderId,
    user: req.user._id,
    paymentMethod: "online",
    isPaid: false,
    status: "pending",
  });

  res.json({ success: true });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];
  const secret = requireEnv(env.stripeWebhookSecret, "STRIPE_WEBHOOK_SECRET");

  const event = stripe.webhooks.constructEvent(req.body, signature, secret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId && session.metadata?.paymentType === "location_extra") {
      const order = await Order.findById(orderId).populate("user assignedDeliveryBoy assignment");

      if (order) {
        const amountDue = Number(order.locationExtraCharge?.amountDue || 0);
        const sessionAmount = Number(session.amount_total || 0) / 100;
        const paidAmount = Math.min(
          amountDue,
          Number(order.locationExtraCharge?.paidAmount || 0) + sessionAmount,
        );

        order.locationExtraCharge = {
          amountDue,
          paidAmount,
          isPaid: paidAmount >= amountDue,
          updatedAt: new Date(),
        };
        await order.save();

        const io = req.app.get("io");
        emitToUser(io, order.user, "order-updated", order);
        emitToUser(io, order.assignedDeliveryBoy, "order-updated", order);
      }
    } else if (orderId) {
      const order = await Order.findOneAndUpdate(
        { _id: orderId, isPaid: false },
        {
          isPaid: true,
          paymentMethod: "online",
        },
        { new: true },
      ).populate("user assignedDeliveryBoy assignment");

      if (order) {
        const io = req.app.get("io");
        await emitToRoles(io, ["admin"], "new-order", order);
      }
    }
  }

  res.json({ received: true });
});

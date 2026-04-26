import { Message } from "../models/message.model.js";
import { Order } from "../models/order.model.js";
import { getReplySuggestions } from "../services/gemini.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";
import { canAccessOrder } from "../utils/orderAccess.js";

export const getMessages = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.roomId).select("user assignedDeliveryBoy");

  if (!order) {
    throw notFound("Chat room not found");
  }
  if (!canAccessOrder(order, req.user)) {
    throw forbidden("You cannot access this chat");
  }

  const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
  res.json({ messages });
});

export const saveMessage = asyncHandler(async (req, res) => {
  const { roomId, text, time } = req.body;

  if (!roomId || !text?.trim()) {
    throw badRequest("roomId and text are required");
  }

  const order = await Order.findById(roomId).select("user assignedDeliveryBoy");

  if (!order) {
    throw notFound("Chat room not found");
  }
  if (!canAccessOrder(order, req.user)) {
    throw forbidden("You cannot send messages in this chat");
  }

  const message = await Message.create({
    roomId,
    text: text.trim(),
    senderId: req.user._id,
    time,
  });
  const io = req.app.get("io");
  io?.to(String(roomId)).emit("send-message", message);

  res.status(201).json({ message });
});

export const aiSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await getReplySuggestions({
    ...req.body,
    role: req.user.role === "deliveryBoy" ? "delivery_boy" : "user",
  });
  res.json({ suggestions });
});

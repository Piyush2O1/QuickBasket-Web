import { Order } from "../models/order.model.js";
import { Grocery } from "../models/grocery.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/httpError.js";

export const connectSocket = asyncHandler(async (req, res) => {
  const { userId = req.user._id.toString(), socketId } = req.body;

  if (!userId || !socketId) {
    throw badRequest("userId and socketId are required");
  }
  if (req.user.role !== "admin" && userId !== req.user._id.toString()) {
    throw badRequest("You can only connect your own socket identity");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { socketId, isOnline: true },
    { new: true },
  );

  if (!user) {
    throw notFound("User not found");
  }

  res.json({ success: true });
});

const normalizeLocation = ({ latitude, longitude, location }) => {
  if (location?.type === "Point" && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    return {
      type: "Point",
      coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])],
    };
  }

  const nextLatitude = Number(location?.latitude ?? latitude);
  const nextLongitude = Number(location?.longitude ?? longitude);

  if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
    return null;
  }

  return {
    type: "Point",
    coordinates: [nextLongitude, nextLatitude],
  };
};

export const updateLocation = asyncHandler(async (req, res) => {
  const userId = req.body.userId || req.user._id.toString();
  const location = normalizeLocation(req.body);

  if (!userId || !location) {
    throw badRequest("userId and location are required");
  }
  if (req.user.role !== "admin" && userId !== req.user._id.toString()) {
    throw badRequest("You can only update your own location");
  }

  const user = await User.findByIdAndUpdate(userId, { location }, { new: true });

  if (!user) {
    throw notFound("User not found");
  }

  if (user.role === "admin") {
    await Grocery.updateMany({}, { location });
  }

  const io = req.app.get("io");
  const activeOrders = await Order.find({
    assignedDeliveryBoy: user._id,
    status: "out of delivery",
  }).select("_id");

  activeOrders.forEach((order) => {
    io?.to(String(order._id)).emit("update-deliveryBoy-location", {
      orderId: order._id.toString(),
      userId: user._id.toString(),
      location,
    });
  });

  res.json({ success: true });
});

export const notify = asyncHandler(async (req, res) => {
  const { event, data, socketId } = req.body;
  const io = req.app.get("io");

  if (socketId) {
    io?.to(socketId).emit(event, data);
  } else {
    io?.emit(event, data);
  }

  res.json({ success: true });
});

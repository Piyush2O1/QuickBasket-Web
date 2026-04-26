import { Server } from "socket.io";
import { corsOrigin } from "../config/cors.js";
import { resolveAuthUser } from "../middleware/auth.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { canAccessOrder } from "../utils/orderAccess.js";

export const initSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  app.set("io", io);

  io.use(async (socket, next) => {
    try {
      const user = await resolveAuthUser({
        handshake: socket.handshake,
        headers: socket.handshake.headers,
      });

      socket.data.user = user;
      next();
    } catch (_error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    User.findByIdAndUpdate(user._id, {
      socketId: socket.id,
      isOnline: true,
    }).catch((error) => {
      console.log("socket sync failed", error.message);
    });

    socket.on("join-room", async (roomId) => {
      try {
        if (!roomId) {
          return;
        }

        const order = await Order.findById(roomId).select("user assignedDeliveryBoy");

        if (!order || !canAccessOrder(order, user)) {
          socket.emit("socket-error", {
            scope: "room",
            message: "You cannot join this order room",
          });
          return;
        }

        socket.join(String(roomId));
      } catch (error) {
        console.log("join room failed", error.message);
      }
    });

    socket.on("leave-room", (roomId) => {
      if (!roomId) {
        return;
      }

      socket.leave(String(roomId));
    });

    socket.on("disconnect", async () => {
      try {
        await User.updateOne(
          { _id: user._id, socketId: socket.id },
          { socketId: null, isOnline: false },
        );
      } catch (error) {
        console.log("disconnect sync failed", error.message);
      }
    });
  });

  return io;
};

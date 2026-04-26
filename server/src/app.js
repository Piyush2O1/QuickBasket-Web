import cookieParser from "cookie-parser";
import cors from "cors";
import { corsOrigin } from "./config/cors.js";
import express from "express";
import { env } from "./config/env.js";
import { stripeWebhook } from "./controllers/payment.controller.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import groceryRoutes from "./routes/grocery.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import socketRoutes from "./routes/socket.routes.js";

export const app = express();

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "quickbasket-mern-server" });
});

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/groceries", groceryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/socket", socketRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

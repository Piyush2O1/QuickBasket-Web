import { Router } from "express";
import {
  allOrders,
  createOrder,
  getOrder,
  myOrders,
  orderStats,
  sendLocationChangeOtp,
  updateOrderStatus,
  verifyLocationChangeOtp,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.use(protect);

router.post("/", allowRoles("user", "admin"), createOrder);
router.get("/mine", myOrders);
router.get("/stats", allowRoles("admin"), orderStats);
router.get("/", allowRoles("admin"), allOrders);
router.get("/:id", getOrder);
router.post("/:id/location-change/otp", allowRoles("user"), sendLocationChangeOtp);
router.post("/:id/location-change/verify", allowRoles("user"), verifyLocationChangeOtp);
router.patch("/:id/status", allowRoles("admin"), updateOrderStatus);

export default router;

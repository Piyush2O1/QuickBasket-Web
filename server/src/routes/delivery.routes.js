import { Router } from "express";
import {
  acceptAssignment,
  currentDeliveryOrder,
  deliveryEarnings,
  getAssignments,
  rejectAssignment,
  sendDeliveryOtp,
  verifyDeliveryOtp,
} from "../controllers/delivery.controller.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.use(protect, allowRoles("deliveryBoy", "admin"));

router.get("/assignments", getAssignments);
router.get("/current-order", currentDeliveryOrder);
router.get("/earnings", deliveryEarnings);
router.post("/assignments/:id/accept", acceptAssignment);
router.post("/assignments/:id/reject", rejectAssignment);
router.post("/orders/:orderId/otp/send", sendDeliveryOtp);
router.post("/orders/:orderId/otp/verify", verifyDeliveryOtp);

export default router;

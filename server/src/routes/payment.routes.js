import { Router } from "express";
import {
  cancelPayment,
  confirmLocationExtraPayment,
  confirmPayment,
  createCheckoutSession,
  createLocationExtraCheckoutSession,
  getPaymentConfig,
} from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/config", getPaymentConfig);
router.post("/checkout", protect, createCheckoutSession);
router.post("/location-extra/checkout", protect, createLocationExtraCheckoutSession);
router.post("/confirm", protect, confirmPayment);
router.post("/location-extra/confirm", protect, confirmLocationExtraPayment);
router.post("/cancel", protect, cancelPayment);

export default router;

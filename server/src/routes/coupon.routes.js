import { Router } from "express";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  validateCoupon,
} from "../controllers/coupon.controller.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.use(protect);

router.get("/", listCoupons);
router.post("/validate", allowRoles("user", "admin"), validateCoupon);
router.post("/", allowRoles("admin"), createCoupon);
router.delete("/:id", allowRoles("admin"), deleteCoupon);

export default router;

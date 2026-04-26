import { Coupon } from "../models/coupon.model.js";
import {
  calculateOrderPricing,
  couponMinOrderAmount,
  deliveryBaseFee,
  deliveryIncludedKm,
  deliveryMaxFee,
  deliveryPerKmFee,
  normalizeCouponCode,
} from "../services/pricing.service.js";
import { emitToRoles } from "../socket/emit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/httpError.js";

export const listCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });

  res.json({
    coupons,
    rules: {
      couponMinOrderAmount,
      deliveryBaseFee,
      deliveryMaxFee,
      deliveryIncludedKm,
      deliveryPerKmFee,
    },
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const code = normalizeCouponCode(req.body.code);
  const discountPercent = Number(req.body.discountPercent);

  if (!code || !/^[A-Z0-9_-]{3,24}$/.test(code)) {
    throw badRequest("Coupon code must be 3-24 letters or numbers");
  }
  if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 90) {
    throw badRequest("Discount percent must be between 1 and 90");
  }

  const coupon = await Coupon.findOneAndUpdate(
    { code },
    {
      code,
      discountPercent,
      minOrderAmount: couponMinOrderAmount,
      createdBy: req.user._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await emitToRoles(req.app.get("io"), ["user", "admin"], "coupons-updated", {
    action: "upsert",
    coupon,
  });

  res.status(201).json({ coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!coupon) {
    throw notFound("Coupon not found");
  }

  await emitToRoles(req.app.get("io"), ["user", "admin"], "coupons-updated", {
    action: "delete",
    couponId: coupon._id.toString(),
  });

  res.json({ success: true });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal = 0, address = null } = req.body;
  const pricing = await calculateOrderPricing({
    subtotal: Number(subtotal || 0),
    couponCode: code,
    address,
  });

  res.json({ pricing });
});

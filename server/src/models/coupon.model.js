import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },
    minOrderAmount: {
      type: Number,
      default: 200,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

export const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

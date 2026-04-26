import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ["register"],
      default: "register",
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "deliveryBoy"],
      default: "user",
    },
  },
  { timestamps: true },
);

emailOtpSchema.index({ email: 1, purpose: 1 }, { unique: true });

export const EmailOtp = mongoose.models.EmailOtp || mongoose.model("EmailOtp", emailOtpSchema);

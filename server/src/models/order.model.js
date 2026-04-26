import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        grocery: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Grocery",
          required: true,
        },
        name: String,
        price: String,
        unit: String,
        image: String,
        quantity: Number,
      },
    ],
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    subtotalAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    coupon: {
      code: String,
      discountPercent: Number,
      minOrderAmount: Number,
    },
    totalAmount: Number,
    address: {
      fullName: String,
      mobile: String,
      city: String,
      state: String,
      pincode: String,
      fullAddress: String,
      latitude: Number,
      longitude: Number,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAssignment",
      default: null,
    },
    assignedDeliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "out of delivery", "delivered", "cancelled"],
      default: "pending",
    },
    deliveryOtp: {
      type: String,
      default: null,
    },
    deliveryOtpExpiresAt: {
      type: Date,
      default: null,
    },
    deliveryOtpVerification: {
      type: Boolean,
      default: false,
    },
    locationChangeOtp: {
      type: String,
      default: null,
    },
    locationChangeOtpExpiresAt: {
      type: Date,
      default: null,
    },
    pendingLocationChange: {
      address: {
        fullName: String,
        mobile: String,
        city: String,
        state: String,
        pincode: String,
        fullAddress: String,
        latitude: Number,
        longitude: Number,
      },
      pricing: {
        currentDeliveryFee: {
          type: Number,
          default: 0,
        },
        newDeliveryFee: {
          type: Number,
          default: 0,
        },
        extraCharge: {
          type: Number,
          default: 0,
        },
      },
      requestedAt: Date,
    },
    locationExtraCharge: {
      amountDue: {
        type: Number,
        default: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      isPaid: {
        type: Boolean,
        default: true,
      },
      updatedAt: Date,
    },
    deliveryEarning: {
      amount: {
        type: Number,
        default: 0,
      },
      distanceKm: {
        type: Number,
        default: 0,
      },
      baseAmount: {
        type: Number,
        default: 0,
      },
      perKmRate: {
        type: Number,
        default: 0,
      },
      distanceAmount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
      calculatedAt: Date,
    },
    deliveredAt: Date,
  },
  { timestamps: true },
);

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

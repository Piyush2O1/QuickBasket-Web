import { Coupon } from "../models/coupon.model.js";
import { User } from "../models/user.model.js";
import { badRequest } from "../utils/httpError.js";

export const deliveryBaseFee = 100;
export const deliveryMaxFee = 150;
export const deliveryIncludedKm = 5;
export const deliveryPerKmFee = 10;
export const deliveryMaxDistanceKm = 15;
export const storeLocation = {
  latitude: 28.6139,
  longitude: 77.209,
};
export const couponMinOrderAmount = 200;

export const normalizeCouponCode = (code) => String(code || "").trim().toUpperCase();

const isValidLatLng = (location) =>
  location &&
  Number.isFinite(location.latitude) &&
  Number.isFinite(location.longitude) &&
  !(location.latitude === 0 && location.longitude === 0);

const getDistanceKm = (from, to) => {
  if (!isValidLatLng(from) || !isValidLatLng(to)) return 0;

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toDeliveryLocation = (address) => {
  const latitude = Number(address?.latitude);
  const longitude = Number(address?.longitude);

  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
};

const toLatLngFromPoint = (location) => {
  if (!Array.isArray(location?.coordinates) || location.coordinates.length !== 2) {
    return null;
  }

  const longitude = Number(location.coordinates[0]);
  const latitude = Number(location.coordinates[1]);

  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
};

export const getCurrentStoreLocation = async () => {
  const admin = await User.findOne({
    role: "admin",
    "location.coordinates.0": { $ne: 0 },
    "location.coordinates.1": { $ne: 0 },
  })
    .sort({ isOnline: -1, updatedAt: -1 })
    .select("location");

  return toLatLngFromPoint(admin?.location) || storeLocation;
};

export const getDeliveryFee = async (_subtotal, address = null) => {
  const currentStoreLocation = await getCurrentStoreLocation();
  const deliveryLocation = toDeliveryLocation(address);
  const distanceKm = getDistanceKm(currentStoreLocation, deliveryLocation);

  if (isValidLatLng(deliveryLocation) && distanceKm > deliveryMaxDistanceKm) {
    throw badRequest(`Delivery is available within ${deliveryMaxDistanceKm} km only`);
  }

  const extraDistanceKm = Math.max(0, distanceKm - deliveryIncludedKm);
  const distanceFee = Math.ceil(extraDistanceKm) * deliveryPerKmFee;

  return Math.min(deliveryMaxFee, deliveryBaseFee + distanceFee);
};

export const calculateOrderPricing = async ({ subtotal, couponCode, address = null }) => {
  const normalizedSubtotal = Number(subtotal || 0);
  const deliveryFee = await getDeliveryFee(normalizedSubtotal, address);
  const normalizedCouponCode = normalizeCouponCode(couponCode);
  let coupon = null;
  let discountAmount = 0;

  if (normalizedCouponCode) {
    coupon = await Coupon.findOne({ code: normalizedCouponCode });

    if (!coupon) {
      throw badRequest("Invalid coupon code");
    }
    if (normalizedSubtotal < coupon.minOrderAmount) {
      throw badRequest(`Coupon works on orders of Rs. ${coupon.minOrderAmount} or more`);
    }

    discountAmount = Math.round((normalizedSubtotal * Number(coupon.discountPercent || 0)) / 100);
  }

  const totalAmount = Math.max(0, normalizedSubtotal + deliveryFee - discountAmount);

  return {
    subtotalAmount: normalizedSubtotal,
    deliveryFee,
    discountAmount,
    totalAmount,
    coupon: coupon
      ? {
          code: coupon.code,
          discountPercent: coupon.discountPercent,
          minOrderAmount: coupon.minOrderAmount,
        }
      : null,
  };
};

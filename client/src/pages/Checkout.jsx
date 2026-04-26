import {
  ArrowLeft,
  Building,
  CreditCard,
  BadgePercent,
  CheckCircle2,
  Clock3,
  Home,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Search,
  TicketPercent,
  Truck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";
import CheckoutMap from "../components/CheckoutMap.jsx";
import { clearCart } from "../store/cartSlice.js";

const defaultMapPosition = [28.6139, 77.209];
const storeLocation = { latitude: 28.6139, longitude: 77.209 };
const deliveryBaseFee = 100;
const deliveryMaxFee = 150;
const deliveryIncludedKm = 5;
const deliveryPerKmFee = 10;
const deliveryMaxDistanceKm = 15;

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

const getDeliveryLocation = (address) => {
  const latitude = Number(address.latitude);
  const longitude = Number(address.longitude);

  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
};

const getDeliveryPricing = (address) => {
  const deliveryLocation = getDeliveryLocation(address);
  const distanceKm = getDistanceKm(storeLocation, deliveryLocation);
  const extraDistanceKm = Math.max(0, distanceKm - deliveryIncludedKm);
  const distanceFee = Math.ceil(extraDistanceKm) * deliveryPerKmFee;
  const isOutOfDeliveryArea = isValidLatLng(deliveryLocation) && distanceKm > deliveryMaxDistanceKm;

  return {
    deliveryFee: Math.min(deliveryMaxFee, deliveryBaseFee + distanceFee),
    distanceKm,
    isOutOfDeliveryArea,
  };
};

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [mapPosition, setMapPosition] = useState(defaultMapPosition);
  const [hasPickedLocation, setHasPickedLocation] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);
  const [error, setError] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    mobile: "",
    city: "",
    state: "",
    pincode: "",
    fullAddress: "",
    latitude: "",
    longitude: "",
  });
  const { deliveryFee, distanceKm, isOutOfDeliveryArea } = getDeliveryPricing(address);

  useEffect(() => {
    if (items.length === 0 && !successOrder) navigate("/user/cart", { replace: true });
  }, [items.length, navigate, successOrder]);

  useEffect(() => {
    let mounted = true;

    api
      .get("/payments/config")
      .then(({ data }) => {
        if (!mounted) return;
        setStripeEnabled(Boolean(data.stripeEnabled));
      })
      .catch(() => {
        if (!mounted) return;
        setStripeEnabled(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!stripeEnabled && paymentMethod === "online") {
      setPaymentMethod("cod");
    }
  }, [paymentMethod, stripeEnabled]);

  useEffect(() => {
    if (!appliedCoupon) return;

    if (total < Number(appliedCoupon.minOrderAmount || 200)) {
      setAppliedCoupon(null);
      setCouponMessage(`Coupon removed. Subtotal must be Rs. ${appliedCoupon.minOrderAmount || 200}+.`);
    }
  }, [appliedCoupon, total]);

  const discountAmount = appliedCoupon
    ? Math.round((total * Number(appliedCoupon.discountPercent || 0)) / 100)
    : 0;
  const finalTotal = Math.max(0, total + deliveryFee - discountAmount);

  const setDeliveryPosition = ([latitude, longitude]) => {
    setMapPosition([latitude, longitude]);
    setHasPickedLocation(true);
    setAddress((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
  };

  useEffect(() => {
    if (!hasPickedLocation) return undefined;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${mapPosition[0]}&lon=${mapPosition[1]}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        const placeAddress = data?.address || {};
        const city =
          placeAddress.city ||
          placeAddress.town ||
          placeAddress.village ||
          placeAddress.suburb ||
          placeAddress.county ||
          "";

        setAddress((current) => ({
          ...current,
          city: city || current.city,
          state: placeAddress.state || current.state,
          pincode: placeAddress.postcode || current.pincode,
          fullAddress: data?.display_name || current.fullAddress,
        }));
      } catch (locationError) {
        if (!controller.signal.aborted) {
          console.log(locationError);
        }
      }
    }, 550);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [hasPickedLocation, mapPosition]);

  const update = (field) => (event) => {
    const value = event.target.value;
    const nextAddress = { ...address, [field]: value };

    setAddress(nextAddress);

    const latitude = Number(nextAddress.latitude);
    const longitude = Number(nextAddress.longitude);

    if (
      (field === "latitude" || field === "longitude") &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      setMapPosition([latitude, longitude]);
      setHasPickedLocation(true);
    }
  };

  const useCurrentLocation = () => {
    navigator.geolocation?.getCurrentPosition((position) => {
      setDeliveryPosition([position.coords.latitude, position.coords.longitude]);
    });
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    setCouponMessage("");
    setError("");

    if (!code) {
      setCouponMessage("Enter coupon code first");
      return;
    }

    setCouponLoading(true);

    try {
      const { data } = await api.post("/coupons/validate", {
        code,
        subtotal: total,
        address: {
          latitude: Number(address.latitude),
          longitude: Number(address.longitude),
        },
      });
      setAppliedCoupon(data.pricing?.coupon || null);
      setCouponCode(data.pricing?.coupon?.code || code);
      setCouponMessage(`${data.pricing?.coupon?.code || code} applied successfully`);
    } catch (couponError) {
      setAppliedCoupon(null);
      setCouponMessage(getErrorMessage(couponError));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (paymentMethod === "online" && !stripeEnabled) {
        throw new Error("Online payment is not configured yet. Please use Cash on Delivery.");
      }

      const latitude = Number(address.latitude);
      const longitude = Number(address.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Please select delivery location on the map.");
      }
      if (isOutOfDeliveryArea) {
        throw new Error(`Delivery is available within ${deliveryMaxDistanceKm} km only.`);
      }

      const { data } = await api.post("/orders", {
        items,
        address: {
          ...address,
          latitude,
          longitude,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code || "",
      });

      if (paymentMethod === "online") {
        const checkout = await api.post("/payments/checkout", { orderId: data.order._id });
        window.location.href = checkout.data.url;
        return;
      }

      setSuccessOrder(data.order);
      dispatch(clearCart());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-[92%] max-w-6xl pb-16">
      <Link
        to="/user/cart"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
      >
        <ArrowLeft size={16} />
        Back to cart
      </Link>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="font-display mt-5 text-center text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
      >
        Checkout
      </motion.h1>

      <form onSubmit={submit} className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel-strong rounded-[32px] p-6"
        >
          <h2 className="mb-5 flex items-center gap-2 font-display text-2xl font-semibold text-slate-950">
            <MapPin className="text-emerald-700" />
            Delivery Address
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={User} placeholder="Full name" value={address.fullName} onChange={update("fullName")} required />
            <Field icon={Phone} placeholder="Mobile" value={address.mobile} onChange={update("mobile")} required />
            <Field icon={Building} placeholder="City" value={address.city} onChange={update("city")} required />
            <Field icon={Navigation} placeholder="State" value={address.state} onChange={update("state")} required />
            <Field icon={Search} placeholder="Pincode" value={address.pincode} onChange={update("pincode")} required />
            <button
              type="button"
              onClick={useCurrentLocation}
              className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              <LocateFixed size={18} />
              Use location
            </button>
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Full address</span>
            <div className="relative">
              <Home className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <textarea
                value={address.fullAddress}
                onChange={update("fullAddress")}
                className="min-h-32 w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-4 text-slate-800 outline-none focus:border-emerald-300"
                placeholder="Full delivery address"
                required
              />
            </div>
          </label>

          <div className="mt-4 overflow-hidden rounded-[28px] border border-white/80 bg-white/70 p-2">
            <div className="h-80 overflow-hidden rounded-[24px]">
              <CheckoutMap position={mapPosition} setPosition={setDeliveryPosition} />
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Drag the marker or use current location. Latitude, longitude, and address fields will update automatically.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field placeholder="Latitude" value={address.latitude} onChange={update("latitude")} required />
            <Field placeholder="Longitude" value={address.longitude} onChange={update("longitude")} required />
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel-strong h-fit rounded-[32px] p-6 lg:sticky lg:top-32"
        >
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold text-slate-950">
            <CreditCard className="text-emerald-700" />
            Payment Method
          </h2>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => stripeEnabled && setPaymentMethod("online")}
              disabled={!stripeEnabled}
              className={`flex w-full items-center gap-3 rounded-[24px] border p-4 text-left transition ${
                paymentMethod === "online"
                  ? "border-emerald-300 bg-emerald-50 shadow-sm"
                  : "border-white/80 bg-white/70 hover:bg-white"
              }`}
            >
              <CreditCard className="text-emerald-700" />
              <span className={`font-semibold ${stripeEnabled ? "text-slate-700" : "text-slate-400"}`}>
                Pay Online (Card / UPI)
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={`flex w-full items-center gap-3 rounded-[24px] border p-4 text-left transition ${
                paymentMethod === "cod"
                  ? "border-emerald-300 bg-emerald-50 shadow-sm"
                  : "border-white/80 bg-white/70 hover:bg-white"
              }`}
            >
              <Truck className="text-emerald-700" />
              <span className="font-semibold text-slate-700">Cash on Delivery</span>
            </button>
          </div>

          {!stripeEnabled && (
            <p className="mt-3 text-sm font-medium text-amber-700">
              Online payment is currently unavailable, so Cash on Delivery will be used.
            </p>
          )}

          <div className="mt-6 rounded-[26px] border border-white/80 bg-white/68 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <TicketPercent className="h-4 w-4 text-emerald-700" />
              Apply coupon
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  setAppliedCoupon(null);
                  setCouponMessage("");
                }}
                className="min-w-0 flex-1 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold uppercase text-slate-800 outline-none focus:border-emerald-300"
                placeholder="COUPON"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading}
                className="inline-flex items-center justify-center rounded-[18px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </button>
            </div>
            <p className={`mt-3 text-sm font-medium ${appliedCoupon ? "text-emerald-700" : "text-slate-500"}`}>
              {couponMessage || "Coupons work on subtotal of Rs. 200 or more."}
            </p>
            {appliedCoupon && (
              <button
                type="button"
                onClick={removeCoupon}
                className="mt-3 text-sm font-semibold text-red-600 transition hover:text-red-700"
              >
                Remove coupon
              </button>
            )}
          </div>

          <div className="mt-6 space-y-3 border-t border-white/70 pt-5 text-slate-700">
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal</span>
              <span className="font-semibold text-emerald-700">Rs. {total}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Delivery Fee</span>
              <span className="font-semibold text-emerald-700">Rs. {deliveryFee}</span>
            </div>
            <p className={`text-xs font-medium ${isOutOfDeliveryArea ? "text-red-600" : "text-slate-500"}`}>
              Minimum Rs. {deliveryBaseFee}, maximum Rs. {deliveryMaxFee}; delivery area up to{" "}
              {deliveryMaxDistanceKm} km
              {distanceKm > 0 ? ` (${distanceKm.toFixed(1)} km selected)` : ""}.
            </p>
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-700">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <BadgePercent className="h-4 w-4" />
                  {appliedCoupon.code} ({appliedCoupon.discountPercent}%)
                </span>
                <span className="font-semibold">- Rs. {discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/70 pt-4 text-lg font-bold">
              <span>Final Total</span>
              <span className="text-emerald-700">Rs. {finalTotal}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting || isOutOfDeliveryArea}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : paymentMethod === "cod" ? "Place Order" : "Pay & Place Order"}
          </button>
        </motion.aside>
      </form>

      <AnimatePresence>
        {successOrder && (
          <OrderPlacedModal
            order={successOrder}
            onOk={() => navigate("/user/dashboard", { replace: true })}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function OrderPlacedModal({ order, onOk }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="glass-panel-strong w-full max-w-lg rounded-[36px] p-7 text-center sm:p-8"
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.08 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-100 text-emerald-700"
        >
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>

        <p className="font-display mt-6 text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
          Order Verified
        </p>
        <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Your order has been placed
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
          Order #{String(order?._id || "").slice(-6)} is confirmed. It is waiting for admin approval and
          will move to out for delivery soon.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Placed", active: true },
            { label: "Waiting", active: true },
            { label: "Out for delivery", active: false },
          ].map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.08 }}
              className={`rounded-[22px] border px-3 py-4 ${
                step.active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white/70 text-slate-500"
              }`}
            >
              <Clock3 className="mx-auto h-4 w-4" />
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em]">{step.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] bg-white/72 px-4 py-4 text-sm font-semibold text-slate-700">
          Final amount: Rs. {Number(order?.totalAmount || 0).toLocaleString("en-IN")}
        </div>

        <button
          type="button"
          onClick={onOk}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700"
        >
          OK, go to dashboard
        </button>
      </motion.div>
    </motion.div>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-4 h-5 w-5 text-slate-400" />}
      <input
        className={`w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pr-4 text-slate-800 outline-none focus:border-emerald-300 ${
          Icon ? "pl-12" : "pl-4"
        }`}
        {...props}
      />
    </div>
  );
}

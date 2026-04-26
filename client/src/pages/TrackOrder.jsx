import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Home,
  Loader2,
  LocateFixed,
  MailCheck,
  MapPin,
  Navigation,
  Package,
  Search,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";
import { getSocket } from "../api/socket.js";
import ChatPanel from "../components/ChatPanel.jsx";
import CheckoutMap from "../components/CheckoutMap.jsx";
import LiveMap from "../components/LiveMap.jsx";

const locationFromGeoJson = (location) =>
  location?.coordinates?.length === 2
    ? { latitude: location.coordinates[1], longitude: location.coordinates[0] }
    : null;

const addressToMapPosition = (address) => [
  Number(address?.latitude || 28.6139),
  Number(address?.longitude || 77.209),
];

const formatRupees = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const getExtraChargeStatus = (order) => {
  const amountDue = Number(order?.locationExtraCharge?.amountDue || 0);
  const paidAmount = Number(order?.locationExtraCharge?.paidAmount || 0);
  const pendingAmount = Math.max(0, amountDue - paidAmount);

  return {
    amountDue,
    paidAmount,
    pendingAmount,
    isPending: pendingAmount > 0 && !order?.locationExtraCharge?.isPaid,
  };
};

export default function TrackOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [error, setError] = useState("");
  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    let mounted = true;

    api
      .get(`/orders/${id}`)
      .then(({ data }) => {
        if (!mounted) return;
        setOrder(data.order);
        setDeliveryLocation(locationFromGeoJson(data.order.assignedDeliveryBoy?.location));
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(getErrorMessage(loadError));
      });

    const onLocationUpdate = (payload) => {
      if (String(payload.orderId) !== String(id)) {
        return;
      }

      if (String(payload.userId) === String(order?.assignedDeliveryBoy?._id)) {
        setDeliveryLocation(locationFromGeoJson(payload.location));
      }
    };

    const onOrderEvent = (payload) => {
      const nextOrder = payload?.order || payload;
      if (String(nextOrder?._id) !== String(id)) return;
      setOrder(nextOrder);
      setDeliveryLocation(locationFromGeoJson(nextOrder.assignedDeliveryBoy?.location));
      setError("");
    };

    socket.on("update-deliveryBoy-location", onLocationUpdate);
    socket.on("order-updated", onOrderEvent);
    socket.on("delivery-assigned", onOrderEvent);
    socket.on("order-delivered", onOrderEvent);

    return () => {
      mounted = false;
      socket.off("update-deliveryBoy-location", onLocationUpdate);
      socket.off("order-updated", onOrderEvent);
      socket.off("delivery-assigned", onOrderEvent);
      socket.off("order-delivered", onOrderEvent);
    };
  }, [id, order?.assignedDeliveryBoy?._id, socket]);

  useEffect(() => {
    let mounted = true;

    api
      .get("/payments/config")
      .then(({ data }) => {
        if (mounted) setStripeEnabled(Boolean(data.stripeEnabled));
      })
      .catch(() => {
        if (mounted) setStripeEnabled(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <main className="mx-auto w-[94%] max-w-7xl pb-16">
        <div className="glass-panel-strong rounded-[32px] border border-red-200 p-10 text-center font-semibold text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto w-[94%] max-w-7xl pb-16">
        <div className="glass-panel-strong rounded-[32px] p-10 text-center font-semibold text-slate-500">
          Loading order tracking...
        </div>
      </main>
    );
  }

  const userLocation =
    order.address?.latitude && order.address?.longitude
      ? { latitude: order.address.latitude, longitude: order.address.longitude }
      : null;
  const extraCharge = getExtraChargeStatus(order);

  return (
    <main className="mx-auto w-[94%] max-w-7xl pb-16">
      <Link
        to="/user/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
      >
        <ArrowLeft size={16} />
        Back to orders
      </Link>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Live tracking
                </div>
                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">
                  Order #{order._id.slice(-6)}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Watch the delivery partner location, customer address, and handoff status in one place.
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-white/55">Status</p>
                <p className="mt-2 text-2xl font-bold capitalize">{order.status}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Items", value: order.items.length, icon: Package },
                { label: "Total", value: `Rs. ${order.totalAmount}`, icon: Truck },
                {
                  label: "Extra Due",
                  value: extraCharge.isPending ? formatRupees(extraCharge.pendingAmount) : "Clear",
                  icon: CreditCard,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-[24px] border border-white/80 bg-white/70 p-4">
                  <Icon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
                  <p className="mt-1 text-sm text-slate-600">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel-strong rounded-[32px] p-3 sm:p-4">
            <LiveMap userLocation={userLocation} deliveryLocation={deliveryLocation} />
          </div>

          <LocationChangePanel
            order={order}
            setOrder={setOrder}
            stripeEnabled={stripeEnabled}
          />

          <ChatPanel roomId={order._id} />
        </section>

        <aside className="space-y-6">
          <div className="glass-panel-dark rounded-[32px] p-6 text-white sm:p-7">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">
              Order Checklist
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white">
              Keep the delivery handoff clear
            </h2>
            <div className="mt-7 grid gap-3">
              {[
                { title: "Order accepted", status: order.assignedDeliveryBoy ? "Partner assigned" : "Waiting" },
                { title: "Live route", status: deliveryLocation ? "Location active" : "Waiting for GPS" },
                { title: "Secure closure", status: order.deliveryOtpVerification ? "OTP verified" : "OTP pending" },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                  <p className="text-sm text-white/55">{item.title}</p>
                  <p className="mt-2 font-medium text-white">{item.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Order items</p>
                <p className="font-display text-2xl font-semibold text-slate-950">Delivery summary</p>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {order.status}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {order.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="rounded-[22px] border border-white/80 bg-white/68 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.quantity} x {item.unit}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-700">
                      Rs. {Number(item.price || 0) * item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function LocationChangePanel({ order, setOrder, stripeEnabled }) {
  const [address, setAddress] = useState(order.address || {});
  const [mapPosition, setMapPosition] = useState(addressToMapPosition(order.address));
  const [otp, setOtp] = useState("");
  const [pricing, setPricing] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const canEdit = !["delivered", "cancelled"].includes(order.status);
  const extraCharge = getExtraChargeStatus(order);

  useEffect(() => {
    setAddress(order.address || {});
    setMapPosition(addressToMapPosition(order.address));
  }, [order._id, order.address?.latitude, order.address?.longitude]);

  useEffect(() => {
    const latitude = Number(address.latitude);
    const longitude = Number(address.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      setMapPosition([latitude, longitude]);
    }
  }, [address.latitude, address.longitude]);

  const update = (field) => (event) => {
    setAddress((current) => ({ ...current, [field]: event.target.value }));
    setNotice("");
    setError("");
  };

  const setDeliveryPosition = ([latitude, longitude]) => {
    setMapPosition([latitude, longitude]);
    setAddress((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
    setNotice("");
    setError("");
  };

  const useCurrentLocation = () => {
    navigator.geolocation?.getCurrentPosition((position) => {
      setDeliveryPosition([position.coords.latitude, position.coords.longitude]);
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const latitude = Number(address.latitude);
      const longitude = Number(address.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
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
      } catch {
        // Reverse geocode is helpful, but manual address entry still works.
      }
    }, 650);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [address.latitude, address.longitude]);

  const requestOtp = async () => {
    setLoadingAction("send");
    setNotice("");
    setError("");

    try {
      const { data } = await api.post(`/orders/${order._id}/location-change/otp`, { address });
      setPricing(data.pricing || null);
      setOtp("");
      setNotice(
        `OTP sent successfully. Extra charge: ${formatRupees(data.pricing?.extraCharge || 0)}.`,
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingAction("");
    }
  };

  const verifyOtp = async () => {
    setLoadingAction("verify");
    setNotice("");
    setError("");

    try {
      const { data } = await api.post(`/orders/${order._id}/location-change/verify`, {
        otp,
      });

      setOrder(data.order);
      setPricing(data.pricing || null);
      setOtp("");
      setNotice(
        data.pricing?.extraCharge > 0
          ? `Location updated. Extra charge added: ${formatRupees(data.pricing.extraCharge)}.`
          : "Location updated. No extra charge was added.",
      );
    } catch (verifyError) {
      setError(getErrorMessage(verifyError));
    } finally {
      setLoadingAction("");
    }
  };

  const payExtra = async () => {
    setLoadingAction("pay");
    setError("");

    try {
      const { data } = await api.post("/payments/location-extra/checkout", {
        orderId: order._id,
      });
      window.location.href = data.url;
    } catch (paymentError) {
      setError(getErrorMessage(paymentError));
      setLoadingAction("");
    }
  };

  return (
    <section className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Edit Location
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">
            Update delivery address
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Send OTP, verify it, and the new location updates instantly. Extra charge applies only when the
            new delivery fee is higher.
          </p>
        </div>

        {extraCharge.isPending && (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Extra due: {formatRupees(extraCharge.pendingAmount)}
          </div>
        )}
      </div>

      {!canEdit ? (
        <div className="mt-5 rounded-[24px] bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
          Location editing is closed for this order.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <LocationField icon={User} placeholder="Full name" value={address.fullName || ""} onChange={update("fullName")} />
            <LocationField icon={Search} placeholder="Pincode" value={address.pincode || ""} onChange={update("pincode")} />
            <LocationField icon={Home} placeholder="City" value={address.city || ""} onChange={update("city")} />
            <LocationField icon={Navigation} placeholder="State" value={address.state || ""} onChange={update("state")} />
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Full address</span>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <textarea
                value={address.fullAddress || ""}
                onChange={update("fullAddress")}
                className="min-h-28 w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-4 text-slate-800 outline-none focus:border-emerald-300"
                placeholder="Full delivery address"
              />
            </div>
          </label>

          <div className="mt-4 overflow-hidden rounded-[28px] border border-white/80 bg-white/70 p-2">
            <div className="h-72 overflow-hidden rounded-[24px]">
              <CheckoutMap position={mapPosition} setPosition={setDeliveryPosition} />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <LocationField placeholder="Latitude" value={address.latitude || ""} onChange={update("latitude")} />
            <LocationField placeholder="Longitude" value={address.longitude || ""} onChange={update("longitude")} />
            <button
              type="button"
              onClick={useCurrentLocation}
              className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              <LocateFixed className="h-4 w-4" />
              Use location
            </button>
          </div>

          {pricing && (
            <div className="mt-4 grid gap-3 rounded-[24px] border border-white/80 bg-white/70 p-4 text-sm font-semibold text-slate-700 sm:grid-cols-3">
              <span>Current: {formatRupees(pricing.currentDeliveryFee)}</span>
              <span>New: {formatRupees(pricing.newDeliveryFee)}</span>
              <span className={pricing.extraCharge > 0 ? "text-amber-700" : "text-emerald-700"}>
                Extra: {formatRupees(pricing.extraCharge)}
              </span>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_0.8fr_1fr]">
            <button
              type="button"
              onClick={requestOtp}
              disabled={Boolean(loadingAction)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loadingAction === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
              Send OTP
            </button>
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center font-semibold tracking-[0.28em] text-slate-900 outline-none focus:border-emerald-300"
              placeholder="000000"
              maxLength={6}
            />
            <button
              type="button"
              onClick={verifyOtp}
              disabled={otp.length !== 6 || Boolean(loadingAction)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
            >
              {loadingAction === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Verify & update
            </button>
          </div>
        </>
      )}

      {extraCharge.isPending && order.paymentMethod === "online" && (
        <button
          type="button"
          onClick={payExtra}
          disabled={!stripeEnabled || Boolean(loadingAction)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {stripeEnabled ? `Pay extra ${formatRupees(extraCharge.pendingAmount)}` : "Online extra payment unavailable"}
        </button>
      )}

      {extraCharge.isPending && order.paymentMethod === "cod" && (
        <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Extra delivery charge will be paid on delivery.
        </div>
      )}

      {notice && <p className="mt-4 text-sm font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
    </section>
  );
}

function LocationField({ icon: Icon, ...props }) {
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

import {
  ArrowRight,
  BarChart3,
  Bike,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  History,
  IndianRupee,
  Loader,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, getErrorMessage } from "../api/http.js";
import { getSocket } from "../api/socket.js";
import ChatPanel from "../components/ChatPanel.jsx";
import LiveMap from "../components/LiveMap.jsx";

const emptyLocation = { latitude: 0, longitude: 0 };
const emptyEarnings = {
  summary: {
    totalEarning: 0,
    totalDistance: 0,
    completedOrders: 0,
    averageEarning: 0,
  },
  chart: [],
  history: [],
};

const toLatLng = (location) =>
  location?.coordinates?.length === 2
    ? { latitude: location.coordinates[1], longitude: location.coordinates[0] }
    : null;

const isValidLocation = (location) =>
  location &&
  Number.isFinite(location.latitude) &&
  Number.isFinite(location.longitude) &&
  !(location.latitude === 0 && location.longitude === 0);

const getDistanceKm = (from, to) => {
  if (!isValidLocation(from) || !isValidLocation(to)) return null;

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return (earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

const formatRupees = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDateTime = (value) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatChartDate = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const normalizeEarnings = (data = {}) => ({
  summary: { ...emptyEarnings.summary, ...(data.summary || {}) },
  chart: data.chart || [],
  history: data.history || [],
});

export default function DeliveryDashboard() {
  const { user } = useSelector((state) => state.auth);
  const socket = useMemo(() => getSocket(), []);
  const [assignments, setAssignments] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [myLocation, setMyLocation] = useState(emptyLocation);
  const [locationStatus, setLocationStatus] = useState("Detecting your live location...");
  const [otp, setOtp] = useState("");
  const [otpNotice, setOtpNotice] = useState(null);
  const [otpActionLoading, setOtpActionLoading] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [earnings, setEarnings] = useState(emptyEarnings);

  const loadEarnings = async () => {
    const { data } = await api.get("/delivery/earnings");
    setEarnings(normalizeEarnings(data));
  };

  const load = async () => {
    setError("");

    try {
      const [assignmentsRes, currentRes, earningsRes] = await Promise.all([
        api.get("/delivery/assignments"),
        api.get("/delivery/current-order"),
        api.get("/delivery/earnings"),
      ]);
      setAssignments(assignmentsRes.data.assignments || []);
      setCurrentOrder(currentRes.data.order || null);
      setEarnings(normalizeEarnings(earningsRes.data));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  };

  useEffect(() => {
    if (!user) return;

    load();

    const onAssignment = () => load();
    socket.on("new-assignment", onAssignment);
    socket.on("order-updated", onAssignment);

    let watcher;
    if (navigator.geolocation) {
      watcher = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setMyLocation(location);
          setLocationStatus("Live location is on");
          api
            .post("/socket/update-location", {
              latitude: location.latitude,
              longitude: location.longitude,
            })
            .catch(() => {});
        },
        () => setLocationStatus("Allow location permission to show your live position"),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
    } else {
      setLocationStatus("Browser location is not supported");
    }

    return () => {
      socket.off("new-assignment", onAssignment);
      socket.off("order-updated", onAssignment);
      if (watcher) navigator.geolocation.clearWatch(watcher);
    };
  }, [socket, user]);

  const accept = async (id) => {
    setActionLoading(id);
    setOtpNotice(null);
    setError("");

    try {
      await api.post(`/delivery/assignments/${id}/accept`);
      await load();
    } catch (acceptError) {
      setError(getErrorMessage(acceptError));
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    setActionLoading(id);
    setOtpNotice(null);
    setError("");

    try {
      await api.post(`/delivery/assignments/${id}/reject`);
      await load();
    } catch (rejectError) {
      setError(getErrorMessage(rejectError));
    } finally {
      setActionLoading(null);
    }
  };

  const sendOtp = async () => {
    setOtpNotice(null);
    setError("");
    setOtpActionLoading("send");

    try {
      const { data } = await api.post(`/delivery/orders/${currentOrder._id}/otp/send`);
      const channels = data.deliveryChannels || [];
      const channelText = channels.length
        ? channels.map((channel) => channel.label).join(" and ")
        : "user notification";

      setOtpNotice({
        type: "success",
        title: "OTP sent to user successfully",
        message: `Delivery OTP went on ${channelText}. It is valid for 2 minutes.`,
        channels,
        warnings: data.deliveryWarnings || [],
      });
    } catch (sendError) {
      setOtpNotice({
        type: "error",
        title: "OTP could not be sent",
        message: getErrorMessage(sendError),
        channels: [],
        warnings: [],
      });
    } finally {
      setOtpActionLoading("");
    }
  };

  const verifyOtp = async () => {
    setOtpNotice(null);
    setError("");
    setOtpActionLoading("verify");

    try {
      const { data } = await api.post(`/delivery/orders/${currentOrder._id}/otp/verify`, { otp });
      setCurrentOrder(data.order);
      setOtp("");
      loadEarnings().catch(() => {});
      setOtpNotice({
        type: "success",
        title: "OTP verified successfully",
        message: `Order delivered. ${formatRupees(data.deliveryEarning?.amount)} has been added to your earnings.`,
        channels: [],
        warnings: [],
      });
    } catch (verifyError) {
      setOtpNotice({
        type: "error",
        title: "OTP verification failed",
        message: getErrorMessage(verifyError),
        channels: [],
        warnings: [],
      });
    } finally {
      setOtpActionLoading("");
    }
  };

  const userLocation =
    currentOrder?.address?.latitude && currentOrder?.address?.longitude
      ? { latitude: currentOrder.address.latitude, longitude: currentOrder.address.longitude }
      : null;

  const travelDistance = getDistanceKm(myLocation, userLocation);
  const orderDelivered = currentOrder?.status === "delivered";

  return (
    <main className="mx-auto w-[94%] max-w-7xl pb-16">
      <div className="mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Delivery Dashboard
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Quick Basket rider control center
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Accept nearby orders, stay route-aware, coordinate with customers, and close deliveries with
              secure OTP verification.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            onClick={() => load()}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh panel
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {[
            { label: "Open Assignments", value: assignments.length, icon: Bike, tone: "bg-emerald-100 text-emerald-800" },
            { label: "Current Delivery", value: currentOrder ? "Active" : "Standby", icon: Truck, tone: "bg-sky-100 text-sky-800" },
            { label: "Distance", value: travelDistance ? `${travelDistance} km` : "Live", icon: Navigation, tone: "bg-amber-100 text-amber-800" },
            { label: "Total Earnings", value: formatRupees(earnings.summary.totalEarning), icon: IndianRupee, tone: "bg-rose-100 text-rose-800" },
            { label: "Location", value: isValidLocation(myLocation) ? "Online" : "Waiting", icon: ShieldCheck, tone: "bg-slate-900 text-white" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="glass-panel rounded-[28px] p-5 transition hover:-translate-y-1 hover:bg-white/90">
              <div className={`inline-flex rounded-2xl px-3 py-3 ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-2xl font-bold text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!currentOrder && assignments.length === 0 && (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
                    Performance
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
                    You are ready for the next assignment
                  </h2>
                </div>
                <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                  Status: Standby
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                  <p className="text-sm text-white/65">Live location</p>
                  <p className="mt-2 text-3xl font-bold">{locationStatus}</p>
                  <p className="mt-4 text-sm leading-7 text-white/70">
                    Stay online and keep location access on so Quick Basket can send you the next closest
                    order.
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white/72 p-5">
                  <p className="font-display text-2xl font-semibold text-slate-950">No active deliveries</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    As soon as an order is broadcast to you, it will appear here and you can accept it
                    instantly.
                  </p>
                  <div className="mt-5 grid gap-3">
                    {["Location updates remain active", "Customer OTP closes delivery safely", "Chat opens after assignment"].map((item) => (
                      <div key={item} className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel-dark rounded-[32px] p-6 text-white sm:p-7">
              <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">
                Queue Tips
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                Keep the handoff clean
              </h2>
              <div className="mt-7 grid gap-3">
                {[
                  "Keep location enabled so the customer sees accurate movement.",
                  "Use chat before calling if the address needs confirmation.",
                  "Verify OTP only after the customer receives the order.",
                ].map((item, index) => (
                  <div key={item} className="rounded-[24px] border border-white/10 bg-white/8 p-4 text-white/80">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Step 0{index + 1}</p>
                    <p className="mt-2 text-sm leading-7">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!currentOrder && assignments.length > 0 && (
          <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="glass-panel-strong rounded-[30px] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Incoming assignment
                      </div>
                      <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
                        Order #{assignment.order?._id?.slice(-6)}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Accept to open live route, customer chat, and OTP verification flow.
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-slate-950 px-4 py-3 text-white">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/55">Order amount</p>
                      <p className="mt-1 text-2xl font-bold">Rs. {assignment.order?.totalAmount}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <UserCheck className="h-4 w-4 text-emerald-700" />
                        {assignment.order?.address?.fullName || assignment.order?.user?.name || "Customer"}
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-4 w-4 text-emerald-700" />
                        <span>{assignment.order?.address?.fullAddress}</span>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Package className="h-4 w-4 text-emerald-700" />
                        {assignment.order?.items?.length || 0} items in this order
                      </div>
                      <div className="mt-4 grid gap-2">
                        {(assignment.order?.items || []).slice(0, 3).map((item, index) => (
                          <div key={`${item.name}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            {item.quantity} x {item.name} ({item.unit})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      disabled={actionLoading === assignment._id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      onClick={() => accept(assignment._id)}
                      type="button"
                    >
                      {actionLoading === assignment._id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Accept assignment
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    <button
                      disabled={actionLoading === assignment._id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      onClick={() => reject(assignment._id)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-panel-dark rounded-[32px] p-6 text-white sm:p-7">
              <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">
                Queue Tips
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                Move fast, but keep the handoff clean
              </h2>
            </div>
          </div>
        )}

        {currentOrder && (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Active delivery
                    </div>
                    <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">
                      Order #{currentOrder._id.slice(-6)}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                      Customer details, live route visibility, and handoff controls are all connected below.
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">Current amount</p>
                    <p className="mt-2 text-3xl font-bold">Rs. {currentOrder.totalAmount}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-white/80 bg-white/70 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <UserCheck className="h-4 w-4 text-emerald-700" />
                      Customer
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-950">{currentOrder.address?.fullName}</p>
                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 text-emerald-700" />
                      <span>{currentOrder.address?.fullAddress}</span>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/80 bg-white/70 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">Items</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">{currentOrder.items?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Distance</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">
                          {travelDistance ? `${travelDistance} km` : "Live"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[22px] bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                      {locationStatus}
                    </div>

                    {userLocation && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${userLocation.latitude},${userLocation.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Navigation className="h-4 w-4" />
                        Open route in Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-panel-strong rounded-[32px] p-3 sm:p-4">
                <LiveMap
                  userLocation={userLocation}
                  deliveryLocation={isValidLocation(myLocation) ? myLocation : toLatLng(user?.location)}
                />
              </div>

              <ChatPanel roomId={currentOrder._id} />
            </div>

            <div className="space-y-6">
              <div className="glass-panel-dark rounded-[32px] p-6 text-white sm:p-7">
                <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">
                  Order Checklist
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                  Keep the handoff reliable
                </h2>
              </div>

              <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Order items</p>
                    <p className="font-display text-2xl font-semibold text-slate-950">Delivery summary</p>
                  </div>
                  <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {currentOrder.status || "pending"}
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {(currentOrder.items || []).map((item, index) => (
                    <div key={`${item.name}-${index}`} className="rounded-[22px] border border-white/80 bg-white/68 px-4 py-4">
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

              <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold text-slate-950">OTP handoff</p>
                    <p className="text-sm text-slate-600">Send OTP only when the order reaches the customer.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <button
                    onClick={sendOtp}
                    disabled={Boolean(otpActionLoading) || orderDelivered}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                  >
                    {otpActionLoading === "send" ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Send / resend delivery OTP
                      </>
                    )}
                  </button>
                  <input
                    type="text"
                    className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-center text-lg tracking-[0.35em] text-slate-950 outline-none focus:border-emerald-300 disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="000000"
                    maxLength={6}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    value={otp}
                    disabled={Boolean(otpActionLoading) || orderDelivered}
                  />
                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={verifyOtp}
                    type="button"
                    disabled={otp.trim().length !== 6 || Boolean(otpActionLoading) || orderDelivered}
                  >
                    {otpActionLoading === "verify" ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Verifying OTP...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Verify OTP
                      </>
                    )}
                  </button>
                </div>
                {orderDelivered && !otpNotice && (
                  <OtpStatusNotice
                    notice={{
                      type: "success",
                      title: "Order delivered",
                      message: `This handoff is complete. ${formatRupees(currentOrder.deliveryEarning?.amount)} is in your earnings history.`,
                      channels: [],
                      warnings: [],
                    }}
                  />
                )}
                {otpNotice && <OtpStatusNotice notice={otpNotice} />}
              </div>
            </div>
          </div>
        )}
        <DeliveryEarningsPanel earnings={earnings} />
      </div>
    </main>
  );
}

function OtpStatusNotice({ notice }) {
  const isSuccess = notice.type === "success";

  return (
    <div
      className={`mt-4 rounded-[24px] border px-4 py-4 ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-full p-1.5 ${
            isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{notice.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-85">{notice.message}</p>
          {notice.channels?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {notice.channels.map((channel) => (
                <span
                  key={`${channel.type}-${channel.detail}`}
                  className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold"
                >
                  {channel.label}: {channel.detail}
                </span>
              ))}
            </div>
          )}
          {notice.warnings?.map((warning) => (
            <p key={warning} className="mt-2 text-xs font-semibold opacity-80">
              {warning}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeliveryEarningsPanel({ earnings }) {
  const summary = earnings.summary || emptyEarnings.summary;
  const history = earnings.history || [];
  const chartData = (earnings.chart || []).map((item) => ({
    ...item,
    label: formatChartDate(item.date),
  }));

  return (
    <section className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Earnings History
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">
            Delivery payout summary
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Completed orders, location-based payout, and day-wise earning trend stay here.
          </p>
        </div>
        <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white">
          <p className="text-xs uppercase tracking-[0.24em] text-white/55">Total earning</p>
          <p className="mt-2 text-3xl font-bold">{formatRupees(summary.totalEarning)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: "Completed Orders", value: summary.completedOrders, icon: CalendarCheck },
          { label: "Total Distance", value: `${Number(summary.totalDistance || 0).toFixed(1)} km`, icon: Navigation },
          { label: "Avg. Earning", value: formatRupees(summary.averageEarning), icon: IndianRupee },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-[24px] border border-white/80 bg-white/72 p-5">
            <Icon className="h-5 w-5 text-emerald-700" />
            <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-white/80 bg-white/72 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BarChart3 className="h-4 w-4 text-emerald-700" />
            Daily earnings graph
          </div>
          {chartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.36} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatRupees(value)} labelFormatter={(label) => `Date: ${label}`} />
                  <Area
                    type="monotone"
                    dataKey="earning"
                    stroke="#059669"
                    strokeWidth={3}
                    fill="url(#earningGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-72 place-items-center rounded-[24px] bg-slate-50 text-center">
              <div>
                <History className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-700">No earning graph yet</p>
                <p className="mt-1 text-sm text-slate-500">Delivered orders will appear after OTP verification.</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/80 bg-white/72 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <History className="h-4 w-4 text-emerald-700" />
            Delivered order history
          </div>

          {history.length ? (
            <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
              {history.map((order) => (
                <article key={order.orderId} className="rounded-[24px] bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950">Order #{order.shortOrderId}</p>
                      <p className="mt-1 truncate text-sm text-slate-600">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700">{formatRupees(order.earningAmount)}</p>
                      <p className="mt-1 text-xs text-slate-500">{Number(order.distanceKm || 0).toFixed(1)} km</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDateTime(order.deliveredAt)}
                    </span>
                    <span>Order value {formatRupees(order.totalAmount)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-slate-50 p-8 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 font-semibold text-slate-700">No delivered orders yet</p>
              <p className="mt-1 text-sm text-slate-500">Your completed delivery history will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Clock3,
  Loader2,
  Send,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";
import { getSocket } from "../api/socket.js";
import { getDashboardPath } from "../lib/appRoutes.js";

const audienceOptions = [
  { value: "users", label: "All customers", icon: Users },
  { value: "targetUser", label: "Target person", icon: UserRound },
  { value: "deliveryBoys", label: "Delivery partners", icon: Truck },
  { value: "all", label: "Customers + partners", icon: Bell },
];

const categoryStyles = {
  admin: "bg-sky-100 text-sky-800",
  deliveryOtp: "bg-amber-100 text-amber-800",
  order: "bg-emerald-100 text-emerald-800",
  system: "bg-slate-100 text-slate-700",
};

const formatDateTime = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const publishUnreadCount = (unreadCount) => {
  window.dispatchEvent(
    new CustomEvent("quickbasket:notifications-count", {
      detail: { unreadCount },
    }),
  );
};

export default function Notifications() {
  const { user } = useSelector((state) => state.auth);
  const socket = useMemo(() => getSocket(), []);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const dashboardPath = getDashboardPath(user?.role);

  const load = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await api.get("/notifications", { params: { limit: 80 } });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      publishUnreadCount(data.unreadCount || 0);
      setError("");
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onNotification = ({ notification, unreadCount: nextUnreadCount }) => {
      if (!notification?._id) return;

      setNotifications((current) => [
        notification,
        ...current.filter((item) => String(item._id) !== String(notification._id)),
      ]);

      setUnreadCount((current) => {
        const next =
          typeof nextUnreadCount === "number" ? nextUnreadCount : current + 1;
        publishUnreadCount(next);
        return next;
      });
    };

    socket.on("notification-created", onNotification);

    return () => {
      socket.off("notification-created", onNotification);
    };
  }, [socket]);

  const markRead = async (id) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      setNotifications((current) =>
        current.map((item) =>
          String(item._id) === String(id) ? data.notification || item : item,
        ),
      );
      setUnreadCount(data.unreadCount || 0);
      publishUnreadCount(data.unreadCount || 0);
    } catch (markError) {
      setError(getErrorMessage(markError));
    }
  };

  const markAllRead = async () => {
    try {
      const { data } = await api.patch("/notifications/read-all");
      const now = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt || now })),
      );
      setUnreadCount(data.unreadCount || 0);
      publishUnreadCount(data.unreadCount || 0);
    } catch (markError) {
      setError(getErrorMessage(markError));
    }
  };

  return (
    <main className="mx-auto w-[94%] max-w-6xl pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <p className="font-display mt-5 text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Notification Center
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Notifications
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Delivery OTPs, admin messages, and time-stamped updates stay together here.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => load(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-white/72 px-5 py-3 font-semibold text-slate-700 transition hover:bg-white"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Refresh
          </button>
          <button
            type="button"
            onClick={markAllRead}
            disabled={!unreadCount}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-600">
        <Bell className="h-4 w-4 text-emerald-700" />
        {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
      </div>

      {user?.role === "admin" && <AdminNotificationComposer onSent={() => load(true)} />}

      {error && (
        <div className="glass-panel-strong mt-6 rounded-[28px] border border-red-200 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center font-semibold text-slate-500">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center">
          <Bell className="mx-auto h-14 w-14 text-emerald-600" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">No notifications yet</h2>
          <p className="mt-2 text-slate-600">New messages and OTP updates will appear here.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {notifications.map((notification) => (
            <article
              key={notification._id}
              className={`glass-panel-strong rounded-[30px] p-5 sm:p-6 ${
                notification.readAt ? "opacity-80" : "ring-2 ring-emerald-200/70"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        categoryStyles[notification.category] || categoryStyles.system
                      }`}
                    >
                      {notification.category === "deliveryOtp" ? "Delivery OTP" : notification.category}
                    </span>
                    {!notification.readAt && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        New
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950">
                    {notification.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {notification.message}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDateTime(notification.createdAt)}
                    </span>
                    {notification.sender?.name && <span>From {notification.sender.name}</span>}
                  </div>
                </div>

                {!notification.readAt && (
                  <button
                    type="button"
                    onClick={() => markRead(notification._id)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function AdminNotificationComposer({ onSent }) {
  const [recipients, setRecipients] = useState([]);
  const [form, setForm] = useState({
    audience: "users",
    targetUserId: "",
    title: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .get("/notifications/recipients")
      .then(({ data }) => setRecipients(data.recipients || []))
      .catch(() => setRecipients([]));
  }, []);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError("");
    setSuccess("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        audience: form.audience,
        title: form.title,
        message: form.message,
      };

      if (form.audience === "targetUser") {
        payload.targetUserId = form.targetUserId;
      }

      const { data } = await api.post("/notifications", payload);
      setSuccess(`Notification sent to ${data.count || 0} recipient${data.count === 1 ? "" : "s"}.`);
      setForm((current) => ({ ...current, title: "", message: "" }));
      onSent?.();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass-panel-strong mt-8 rounded-[32px] p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-950 p-3 text-white">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Admin broadcast</p>
          <h2 className="font-display text-2xl font-semibold text-slate-950">Send notification</h2>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Audience
            <select
              value={form.audience}
              onChange={updateField("audience")}
              className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none focus:border-emerald-300"
            >
              {audienceOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {form.audience === "targetUser" && (
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Recipient
              <select
                value={form.targetUserId}
                onChange={updateField("targetUserId")}
                className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none focus:border-emerald-300"
              >
                <option value="">Select user or delivery partner</option>
                {recipients.map((recipient) => (
                  <option key={recipient._id} value={recipient._id}>
                    {recipient.name} - {recipient.role} - {recipient.email}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Title
          <input
            value={form.title}
            onChange={updateField("title")}
            className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none focus:border-emerald-300"
            placeholder="Short notification title"
            maxLength={140}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Message
          <textarea
            value={form.message}
            onChange={updateField("message")}
            className="min-h-32 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none focus:border-emerald-300"
            placeholder="Write the message customers or delivery partners should see"
            maxLength={1200}
          />
        </label>

        {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        {success && <p className="text-sm font-semibold text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "Sending..." : "Send notification"}
        </button>
      </form>
    </section>
  );
}

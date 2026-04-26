import { ArrowLeft, PackageSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";
import { getSocket } from "../api/socket.js";
import UserOrderCard from "../components/UserOrderCard.jsx";

const sortNewestFirst = (orders) =>
  [...orders].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

export default function MyOrders() {
  const socket = useMemo(() => getSocket(), []);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await api.get("/orders/mine");
        if (!mounted) return;
        setOrders(sortNewestFirst(data.orders || []));
        setError("");
      } catch (loadError) {
        if (!mounted) return;
        setError(getErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const upsertOrder = (payload) => {
      const nextOrder = payload?.order || payload;
      const nextId = nextOrder?._id;

      if (!nextId) return;

      setOrders((current) => {
        const existing = current.some((item) => String(item._id) === String(nextId));
        const nextOrders = existing
          ? current.map((item) => (String(item._id) === String(nextId) ? { ...item, ...nextOrder } : item))
          : [nextOrder, ...current];

        return sortNewestFirst(nextOrders);
      });
    };

    socket.on("delivery-assigned", upsertOrder);
    socket.on("order-updated", upsertOrder);
    socket.on("order-delivered", upsertOrder);

    return () => {
      socket.off("delivery-assigned", upsertOrder);
      socket.off("order-updated", upsertOrder);
      socket.off("order-delivered", upsertOrder);
    };
  }, [socket]);

  return (
    <main className="mx-auto w-[94%] max-w-5xl pb-16">
      <Link
        to="/user/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mt-6">
        <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
          Order History
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          My orders
        </h1>
      </div>

      {loading ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center font-semibold text-slate-500">
          Loading your orders...
        </div>
      ) : error ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] border border-red-200 p-8 text-center">
          <p className="font-semibold text-red-700">Could not load your orders</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center">
          <PackageSearch className="mx-auto h-16 w-16 text-emerald-600" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">No orders found</h2>
          <p className="mt-2 text-slate-600">Start shopping to view your orders here.</p>
          <Link
            to="/user/dashboard"
            className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Browse groceries
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <UserOrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}

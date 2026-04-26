import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";
import { getSocket } from "../api/socket.js";
import AdminOrderCard from "../components/AdminOrderCard.jsx";

const PAGE_SIZE = 6;

const sortNewestFirst = (orders) =>
  [...orders].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

export default function AdminOrders() {
  const socket = useMemo(() => getSocket(), []);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [rowState, setRowState] = useState({});
  const [currentLimit, setCurrentLimit] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const load = async (limit = PAGE_SIZE, silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await api.get("/orders", {
        params: {
          limit,
        },
      });

      setOrders(sortNewestFirst(data.orders || []));
      setTotal(data.pagination?.total ?? data.orders?.length ?? 0);
      setHasMore(Boolean(data.pagination?.hasMore));
      setCurrentLimit(limit);
      setPageError("");
    } catch (loadError) {
      setPageError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(PAGE_SIZE);
  }, []);

  useEffect(() => {
    const refresh = () => load(currentLimit, true);

    socket.on("new-order", refresh);
    socket.on("order-assigned", refresh);
    socket.on("order-status-update", refresh);
    socket.on("assignment-updated", refresh);

    return () => {
      socket.off("new-order", refresh);
      socket.off("order-assigned", refresh);
      socket.off("order-status-update", refresh);
      socket.off("assignment-updated", refresh);
    };
  }, [socket, currentLimit]);

  const updateStatus = async (orderId, status) => {
    setRowState((current) => ({
      ...current,
      [orderId]: { loading: true, error: "" },
    }));

    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status });
      const nextOrder = data.order;

      setOrders((current) =>
        sortNewestFirst(
          current.map((item) => (String(item._id) === String(orderId) ? nextOrder : item)),
        ),
      );
      setRowState((current) => ({
        ...current,
        [orderId]: { loading: false, error: "" },
      }));
    } catch (updateError) {
      setRowState((current) => ({
        ...current,
        [orderId]: { loading: false, error: getErrorMessage(updateError) },
      }));
    }
  };

  return (
    <main className="mx-auto w-[94%] max-w-6xl pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <p className="font-display mt-5 text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Order Control
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Manage orders
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            This is an order-based list, so the same customer can appear multiple times when they place multiple orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load(currentLimit, true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh orders
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-600">
        Showing {orders.length} of {total} orders
      </div>

      {loading ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center font-semibold text-slate-500">
          Loading orders...
        </div>
      ) : pageError ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] border border-red-200 p-8 text-center">
          <p className="font-semibold text-red-700">{pageError}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center font-semibold text-slate-500">
          No data found
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-5">
            {orders.map((order) => (
              <AdminOrderCard
                key={order._id}
                order={order}
                onStatusChange={updateStatus}
                loading={rowState[order._id]?.loading}
                error={rowState[order._id]?.error}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                disabled={refreshing}
                onClick={() => load(currentLimit + PAGE_SIZE, true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {refreshing && <Loader2 className="h-4 w-4 animate-spin" />}
                {refreshing ? "Loading more..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

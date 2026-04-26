import {
  Bell,
  Boxes,
  ClipboardCheck,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  Package,
  PackageCheck,
  Percent,
  TicketPercent,
  Trash2,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";
import AdminGroceryForm from "../components/admin/AdminGroceryForm.jsx";
import StatCard from "../components/StatCard.jsx";
import { createEmptyGroceryForm } from "../lib/adminInventory.js";
import { adminOrderStatusOptions, getOrderStatusMeta } from "../lib/orderStatus.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [groceries, setGroceries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(createEmptyGroceryForm);
  const [couponForm, setCouponForm] = useState({ code: "", discountPercent: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const load = async () => {
    setLoading(true);

    try {
      const [statsRes, ordersRes, groceriesRes, couponsRes] = await Promise.all([
        api.get("/orders/stats"),
        api.get("/orders", { params: { limit: 4 } }),
        api.get("/groceries", { params: { limit: 4 } }),
        api.get("/coupons"),
      ]);

      setStats(statsRes.data.stats || {});
      setOrders(ordersRes.data.orders || []);
      setGroceries(groceriesRes.data.groceries || []);
      setCategories(groceriesRes.data.categories || []);
      setUnits(groceriesRes.data.units || []);
      setCoupons(couponsRes.data.coupons || []);
      setError("");
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateForm = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setSuccess("");
  };

  const updateCouponForm = (field) => (event) => {
    setCouponForm((current) => ({
      ...current,
      [field]: field === "code" ? event.target.value.toUpperCase() : event.target.value,
    }));
    setCouponMessage("");
  };

  const addGrocery = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));

      if (file) {
        payload.append("image", file);
      }

      await api.post("/groceries", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm(createEmptyGroceryForm());
      setFile(null);
      setSuccess("Grocery added to inventory.");
      await load();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    setError("");

    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await load();
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    setCouponSubmitting(true);
    setCouponMessage("");
    setError("");

    try {
      const { data } = await api.post("/coupons", {
        code: couponForm.code.trim().toUpperCase(),
        discountPercent: Number(couponForm.discountPercent),
      });

      setCoupons((current) => [
        data.coupon,
        ...current.filter((coupon) => String(coupon._id) !== String(data.coupon._id)),
      ]);
      setCouponForm({ code: "", discountPercent: "" });
      setCouponMessage("Coupon saved and visible to users.");
    } catch (couponError) {
      setCouponMessage(getErrorMessage(couponError));
    } finally {
      setCouponSubmitting(false);
    }
  };

  const deleteCoupon = async (id) => {
    setCouponMessage("");
    setError("");

    try {
      await api.delete(`/coupons/${id}`);
      setCoupons((current) => current.filter((coupon) => String(coupon._id) !== String(id)));
      setCouponMessage("Coupon deleted.");
    } catch (couponError) {
      setCouponMessage(getErrorMessage(couponError));
    }
  };

  return (
    <main className="mx-auto w-[94%] max-w-7xl pb-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Operations Hub
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Quick Basket admin dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Revenue, order flow, and grocery operations now sit inside a cleaner command surface.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/groceries"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            <Boxes className="h-4 w-4" />
            View groceries
          </Link>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            <ClipboardCheck className="h-4 w-4" />
            Manage orders
          </Link>
          <Link
            to="/admin/notifications"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </Link>
          <Link
            to="/admin/add-grocery"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <LayoutDashboard className="h-4 w-4" />
            Add inventory
          </Link>
        </div>
      </div>

      {error && (
        <div className="glass-panel-strong mt-6 rounded-[28px] border border-red-200 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center font-semibold text-slate-500">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-panel-dark rounded-[32px] p-6 sm:p-7"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-emerald-200">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Total revenue</p>
                  <p className="font-display text-4xl font-bold text-white">
                    Rs. {Number(stats.totalRevenue || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/70">
                Keep an eye on how Quick Basket is performing across recent demand and delivery windows.
              </p>
            </motion.div>

            <div className="glass-panel rounded-[32px] p-6 sm:p-7">
              <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
                Live focus
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Orders", value: stats.totalOrders || 0 },
                  { label: "Pending", value: stats.pendingOrders || 0 },
                  { label: "Customers", value: stats.users || 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/80 bg-white/72 p-4">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Orders" value={stats.totalOrders || 0} icon={Package} />
            <StatCard label="Customers" value={stats.users || 0} icon={Users} />
            <StatCard label="Pending Deliveries" value={stats.pendingOrders || 0} icon={Truck} />
            <StatCard label="Groceries" value={stats.groceries || 0} icon={Boxes} />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
            <AdminGroceryForm
              form={form}
              onFieldChange={updateForm}
              onSubmit={addGrocery}
              file={file}
              onFileChange={setFile}
              categories={categories}
              units={units}
              submitting={submitting}
              error=""
              success={success}
              eyebrow="Inventory"
              title="Add grocery"
              submitLabel="Save grocery"
              submittingLabel="Saving grocery..."
            />

            <div className="space-y-6">
              <section className="glass-panel-strong rounded-[32px] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <TicketPercent className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Promotions</p>
                    <h2 className="font-display text-2xl font-semibold text-slate-950">Coupon codes</h2>
                  </div>
                </div>

                <form onSubmit={saveCoupon} className="mt-5 grid gap-3 sm:grid-cols-[1fr_130px_auto]">
                  <input
                    value={couponForm.code}
                    onChange={updateCouponForm("code")}
                    className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold uppercase text-slate-700 outline-none focus:border-emerald-300"
                    placeholder="SAVE20"
                    required
                  />
                  <input
                    value={couponForm.discountPercent}
                    onChange={updateCouponForm("discountPercent")}
                    className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-300"
                    placeholder="% off"
                    type="number"
                    min="1"
                    max="90"
                    required
                  />
                  <button
                    type="submit"
                    disabled={couponSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {couponSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Percent className="h-4 w-4" />}
                    Save
                  </button>
                </form>

                {couponMessage && (
                  <p className="mt-3 text-sm font-semibold text-slate-600">{couponMessage}</p>
                )}

                <div className="mt-5 grid gap-3">
                  {coupons.length === 0 ? (
                    <p className="rounded-[24px] border border-white/80 bg-white/68 p-5 text-sm font-semibold text-slate-500">
                      No coupon codes yet
                    </p>
                  ) : (
                    coupons.map((coupon) => (
                      <article
                        key={coupon._id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/80 bg-white/68 p-4"
                      >
                        <div>
                          <p className="font-display text-xl font-semibold text-slate-950">{coupon.code}</p>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {coupon.discountPercent}% off on Rs. {coupon.minOrderAmount || 200}+ subtotal
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCoupon(coupon._id)}
                          className="rounded-full bg-red-50 p-3 text-red-600 transition hover:bg-red-100"
                          title="Delete coupon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="glass-panel-strong rounded-[32px] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Order Overview</p>
                    <h2 className="font-display text-2xl font-semibold text-slate-950">Recent orders</h2>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {orders.length === 0 ? (
                    <p className="rounded-[24px] border border-white/80 bg-white/68 p-5 text-sm font-semibold text-slate-500">
                      No data found
                    </p>
                  ) : (
                    orders.map((order) => {
                      const statusMeta = getOrderStatusMeta(order.status);

                      return (
                        <article key={order._id} className="rounded-[24px] border border-white/80 bg-white/68 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-display text-xl font-semibold text-slate-950">
                                Order #{String(order._id || "").slice(-6)}
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-500">
                                {order.user?.name || order.address?.fullName || "Customer"} | Rs.{" "}
                                {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClasses}`}>
                                {statusMeta.label}
                              </span>
                              {!["delivered", "cancelled"].includes(order.status) && (
                                <>
                                  <select
                                    value={order.status}
                                    onChange={(event) => updateStatus(order._id, event.target.value)}
                                    className="rounded-full border border-white/80 bg-white px-4 py-2 font-semibold text-slate-700 outline-none focus:border-emerald-300"
                                  >
                                    {adminOrderStatusOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(order._id, "cancelled")}
                                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="glass-panel-strong rounded-[32px] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Storefront</p>
                    <h2 className="font-display text-2xl font-semibold text-slate-950">Groceries</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {groceries.length === 0 ? (
                    <p className="rounded-[24px] border border-white/80 bg-white/68 p-5 text-sm font-semibold text-slate-500 sm:col-span-2">
                      No data found
                    </p>
                  ) : (
                    groceries.map((grocery) => (
                      <article key={grocery._id} className="flex gap-3 rounded-[24px] border border-white/80 bg-white/68 p-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                          <img src={grocery.image} alt={grocery.name} className="h-full w-full object-contain p-2" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{grocery.name}</p>
                          <p className="text-sm font-medium text-slate-500">
                            Rs. {grocery.price}/{grocery.unit}
                          </p>
                          <p className="text-xs font-medium text-slate-500">Stock: {grocery.stock ?? 0}</p>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

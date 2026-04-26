import { ChevronDown, ChevronUp, CreditCard, MapPin, Package, Phone, RefreshCw, Truck, User, UserCheck, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { adminOrderStatusOptions, getOrderStatusMeta } from "../lib/orderStatus.js";

export default function AdminOrderCard({ order, onStatusChange, loading = false, error = "" }) {
  const [expanded, setExpanded] = useState(false);
  const orderId = order._id?.toString() || "";
  const assignment = typeof order.assignment === "object" ? order.assignment : null;
  const availablePartners = assignment?.status === "broadcasted" ? assignment.broadcastedTo || [] : [];
  const statusMeta = getOrderStatusMeta(order.status);
  const customerName = order.user?.name || order.address?.fullName || "Customer";
  const orderItems = order.items || [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-panel-strong rounded-[30px] p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-slate-950">
              Order #{orderId.slice(-6)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {customerName} placed this order for Rs. {Number(order.totalAmount || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="grid gap-2 text-sm text-slate-700">
            <p className="flex items-center gap-2 font-semibold">
              <User size={16} className="text-emerald-700" />
              {customerName}
            </p>
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-emerald-700" />
              {order.address?.mobile}
            </p>
            <p className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-emerald-700" />
              <span>{order.address?.fullAddress}</span>
            </p>
            <p className="flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-700" />
              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
            </p>
          </div>

          {order.assignedDeliveryBoy && (
            <div className="rounded-[22px] border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <UserCheck className="text-blue-600" size={18} />
                  <div className="font-semibold text-slate-800">
                    <p>Assigned to: {order.assignedDeliveryBoy.name}</p>
                    <p className="text-xs text-slate-600">
                      {order.assignedDeliveryBoy.mobile
                        ? `+91 ${order.assignedDeliveryBoy.mobile}`
                        : "Mobile not added"}
                    </p>
                  </div>
                </div>

                {order.assignedDeliveryBoy.mobile && (
                  <a
                    href={`tel:${order.assignedDeliveryBoy.mobile}`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Call
                  </a>
                )}
              </div>
            </div>
          )}

          {!order.assignedDeliveryBoy && availablePartners.length > 0 && (
            <div className="rounded-[22px] border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-yellow-800">Waiting for delivery partner</p>
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                  {availablePartners.length} available
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                {availablePartners.map((partner) => (
                  <div
                    key={partner._id || partner.email || partner.name}
                    className="flex items-center justify-between rounded-xl border border-yellow-100 bg-white px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{partner.name}</p>
                      <p className="text-xs text-slate-500">
                        {partner.mobile ? `+91 ${partner.mobile}` : "Mobile not added"}
                      </p>
                    </div>
                    {partner.mobile && (
                      <a href={`tel:${partner.mobile}`} className="text-xs font-semibold text-blue-700">
                        Call
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClasses}`}>
            {statusMeta.label}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              order.isPaid || order.status === "delivered"
                ? "border-green-300 bg-green-100 text-green-700"
                : "border-red-300 bg-red-100 text-red-700"
            }`}
          >
            {order.isPaid || order.status === "delivered" ? "Paid" : "Unpaid"}
          </span>

          {!["delivered", "cancelled"].includes(order.status) && (
            <select
              value={order.status}
              onChange={(event) => onStatusChange?.(order._id, event.target.value)}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition hover:border-emerald-400 focus:border-emerald-500 disabled:opacity-60"
            >
              {adminOrderStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {!["delivered", "cancelled"].includes(order.status) && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onStatusChange?.(order._id, "cancelled")}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              Cancel order
            </button>
          )}

          {loading && (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Updating
            </div>
          )}

          {error && <p className="max-w-[220px] text-right text-xs text-red-600">{error}</p>}
        </div>
      </div>

      <div className="mt-4 border-t border-white/80 pt-3">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-center justify-between text-sm font-medium text-slate-700 transition hover:text-emerald-700"
        >
          <span className="flex items-center gap-2">
            <Package size={16} className="text-emerald-700" />
            {expanded ? "Hide order items" : `View ${orderItems.length} items`}
          </span>
          {expanded ? <ChevronUp size={16} className="text-emerald-700" /> : <ChevronDown size={16} className="text-emerald-700" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {orderItems.map((item, index) => (
              <div
                key={`${item.grocery || item.name}-${index}`}
                className="flex items-center justify-between rounded-[20px] bg-white/65 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl border border-white/80 object-cover bg-white"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} x {item.unit}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-800">Rs. {Number(item.price) * item.quantity}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/80 pt-3 text-sm font-semibold text-slate-800">
        <div className="flex items-center gap-2 text-slate-700">
          <Truck size={16} className="text-emerald-700" />
          Delivery: <span className="text-emerald-700">{statusMeta.label}</span>
        </div>
        <div>
          Total: <span className="text-emerald-700">Rs. {order.totalAmount}</span>
        </div>
      </div>
    </motion.article>
  );
}

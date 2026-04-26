import { ChevronDown, ChevronUp, Clock, CreditCard, MapPin, Package, Truck, UserCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const getStatusClasses = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "out of delivery":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "delivered":
      return "bg-green-100 text-green-700 border-green-300";
    default:
      return "bg-slate-100 text-slate-600 border-slate-300";
  }
};

export default function UserOrderCard({ order }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const orderId = order._id?.toString() || "";
  const status = order.status;
  const deliveryPartner = order.assignedDeliveryBoy;
  const showTrackButton = Boolean(status !== "delivered" && status !== "cancelled" && orderId);

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel-strong overflow-hidden rounded-[30px] border border-white/80"
    >
      <div className="flex flex-col gap-3 border-b border-white/80 bg-white/45 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            Order <span className="text-emerald-700">#{orderId.slice(-6)}</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              order.isPaid || status === "delivered"
                ? "border-green-300 bg-green-100 text-green-700"
                : "border-red-300 bg-red-100 text-red-700"
            }`}
          >
            {order.isPaid || status === "delivered" ? "Paid" : "Unpaid"}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(status)}`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          {order.paymentMethod === "cod" ? (
            <Truck size={16} className="text-emerald-700" />
          ) : (
            <CreditCard size={16} className="text-emerald-700" />
          )}
          {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
        </div>

        {deliveryPartner ? (
          <div
            className={`mt-4 rounded-[24px] border p-4 ${
              status === "delivered" ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <UserCheck className={status === "delivered" ? "text-green-600" : "text-blue-600"} size={18} />
                <div className="font-semibold text-slate-800">
                  <p>
                    {status === "delivered" ? "Delivered by" : "Delivery partner"}: {deliveryPartner.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {deliveryPartner.mobile ? `Phone: +91 ${deliveryPartner.mobile}` : "Phone not added"}
                  </p>
                </div>
              </div>
              {deliveryPartner.mobile && (
                <a
                  href={`tel:${deliveryPartner.mobile}`}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  Call
                </a>
              )}
            </div>

            {showTrackButton && (
              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
                onClick={() => navigate(`/user/orders/track/${orderId}`)}
              >
                <Truck size={18} />
                {deliveryPartner ? "Track your order" : "Manage delivery location"}
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <Clock size={18} />
            <div>
              <p className="font-semibold">Waiting for delivery partner</p>
              <p className="text-xs text-yellow-700">Admin will assign a nearby delivery partner soon.</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <MapPin size={16} className="text-emerald-700" />
          <span className="truncate">{order.address?.fullAddress}</span>
        </div>

        <div className="mt-4 border-t border-white/80 pt-3">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="flex w-full items-center justify-between text-sm font-medium text-slate-700 transition hover:text-emerald-700"
          >
            <span className="flex items-center gap-2">
              <Package size={16} className="text-emerald-700" />
              {expanded ? "Hide order items" : `View ${order.items.length} items`}
            </span>
            {expanded ? <ChevronUp size={16} className="text-emerald-700" /> : <ChevronDown size={16} className="text-emerald-700" />}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {order.items.map((item, index) => (
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
            Delivery: <span className="capitalize text-emerald-700">{status}</span>
          </div>
          <div>
            Total: <span className="text-emerald-700">Rs. {order.totalAmount}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

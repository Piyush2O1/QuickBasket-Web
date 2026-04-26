import { CheckCircle2, Home, PackageCheck, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";
import { getDashboardPath } from "../lib/appRoutes.js";
import { clearCart } from "../store/cartSlice.js";

export default function OrderResult({ cancelled = false }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("order_id");
  const sessionId = params.get("session_id");
  const paymentType = params.get("payment_type");
  const isLocationExtraPayment = paymentType === "location_extra";
  const hasHandled = useRef(false);
  const [message, setMessage] = useState(
    orderId
      ? `Order #${orderId.slice(-6)} is confirmed and waiting to go out for delivery.`
      : "Your order has been updated.",
  );

  useEffect(() => {
    if (!orderId || hasHandled.current) return;
    hasHandled.current = true;

    if (cancelled) {
      if (isLocationExtraPayment) {
        setMessage(`Extra location charge payment for order #${orderId.slice(-6)} was cancelled.`);
        return;
      }

      api.post("/payments/cancel", { orderId }).catch((error) => {
        setMessage(getErrorMessage(error));
      });
      return;
    }

    if (!sessionId) {
      dispatch(clearCart());
      return;
    }

    const confirmPath = isLocationExtraPayment ? "/payments/location-extra/confirm" : "/payments/confirm";

    api
      .post(confirmPath, { sessionId, orderId })
      .then(() => {
        if (!isLocationExtraPayment) {
          dispatch(clearCart());
        }
        setMessage(
          isLocationExtraPayment
            ? `Extra location charge for order #${orderId.slice(-6)} is paid.`
            : `Order #${orderId.slice(-6)} is confirmed and waiting to go out for delivery.`,
        );
      })
      .catch((error) => {
        setMessage(getErrorMessage(error));
      });
  }, [cancelled, dispatch, isLocationExtraPayment, orderId, sessionId]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-[94%] max-w-2xl items-center justify-center pb-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="glass-panel-strong w-full rounded-[36px] p-8 sm:p-10"
      >
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] ${
            cancelled ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {cancelled ? <ShoppingCart size={32} /> : <CheckCircle2 size={32} />}
        </div>
        <h1 className="font-display mt-5 text-4xl font-bold tracking-tight text-slate-950">
          {cancelled ? "Payment cancelled" : isLocationExtraPayment ? "Extra charge paid" : "Order placed"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-medium text-slate-600">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={getDashboardPath("user")}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            <Home size={18} />
            OK, go to dashboard
          </Link>
          {!cancelled && orderId && (
            <Link
              to={`/user/orders/track/${orderId}`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              Track order
            </Link>
          )}
          {!cancelled && (
            <Link
              to="/user/orders"
              className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-5 py-3 font-semibold text-slate-700 transition hover:bg-white"
            >
              <PackageCheck size={18} />
              My orders
            </Link>
          )}
          {cancelled && (
            <Link
              to="/user/cart"
              className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              Back to cart
            </Link>
          )}
        </div>
      </motion.div>
    </main>
  );
}

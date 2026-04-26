import { ArrowLeft, Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { decreaseItem, increaseItem, removeItem } from "../store/cartSlice.js";

export default function Cart() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  return (
    <main className="mx-auto mb-24 w-[95%] max-w-6xl">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
      >
        <ArrowLeft size={18} />
        Continue shopping
      </Link>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="font-display mt-5 text-center text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
      >
        Your Shopping Cart
      </motion.h1>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel-strong mt-10 rounded-[32px] px-6 py-20 text-center"
        >
          <ShoppingBasket className="mx-auto mb-4 h-16 w-16 text-slate-400" />
          <p className="mx-auto mb-6 max-w-xl text-lg text-slate-600">
            Your cart is empty. Add some groceries to continue shopping.
          </p>
          <Link
            to="/"
            className="inline-flex rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Continue Shopping
          </Link>
        </motion.div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <AnimatePresence>
              {items.map((item) => (
                <motion.article
                  key={item._id || item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-panel-strong flex flex-col items-center gap-5 rounded-[30px] p-5 transition hover:bg-white/90 sm:flex-row"
                >
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-[24px] bg-white/70">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-3 transition duration-300 hover:scale-105"
                    />
                  </div>

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {item.category}
                    </p>
                    <h2 className="mt-2 line-clamp-1 font-display text-2xl font-semibold text-slate-950">
                      {item.name}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Rs. {item.price}/{item.unit}
                    </p>
                    <p className="mt-2 text-lg font-bold text-emerald-700">
                      Rs. {Number(item.price || 0) * item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 rounded-full bg-white/70 px-3 py-2">
                    <button
                      className="rounded-full border border-slate-200 bg-white p-2 text-emerald-700 transition hover:bg-emerald-100"
                      onClick={() => dispatch(decreaseItem(item._id || item.id))}
                      type="button"
                      title="Decrease"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-semibold text-slate-800">{item.quantity}</span>
                    <button
                      className="rounded-full border border-slate-200 bg-white p-2 text-emerald-700 transition hover:bg-emerald-100"
                      onClick={() => dispatch(increaseItem(item._id || item.id))}
                      type="button"
                      title="Increase"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    className="rounded-full bg-red-50 p-3 text-red-500 transition hover:bg-red-100 hover:text-red-700"
                    onClick={() => dispatch(removeItem(item._id || item.id))}
                    type="button"
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-panel-strong h-fit rounded-[32px] p-6 lg:sticky lg:top-32"
          >
            <h2 className="font-display text-2xl font-semibold text-slate-950">Order Summary</h2>
            <div className="mt-5 space-y-3 text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-emerald-700">Rs. {total}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-emerald-700">Rs. 0</span>
              </div>
              <div className="flex justify-between border-t border-white/70 pt-4 text-xl font-bold">
                <span>Final Total</span>
                <span className="text-emerald-700">Rs. {total}</span>
              </div>
            </div>
            <Link
              to="/user/checkout"
              className="mt-6 inline-flex w-full justify-center rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Proceed to Checkout
            </Link>
          </motion.aside>
        </div>
      )}
    </main>
  );
}

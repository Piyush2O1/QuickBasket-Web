import { Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { addItem, decreaseItem, increaseItem } from "../store/cartSlice.js";

export default function GroceryCard({ grocery, onAdd }) {
  const dispatch = useDispatch();
  const cartItem = useSelector((state) =>
    state.cart.items.find((item) => String(item._id || item.id) === String(grocery._id || grocery.id)),
  );

  const add = () => {
    if (onAdd) {
      onAdd(grocery);
      return;
    }
    dispatch(addItem(grocery));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      viewport={{ once: true, amount: 0.16 }}
      className="glass-panel group flex h-full flex-col overflow-hidden rounded-[30px] border border-white/70"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_58%)]">
        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Fresh pick
        </div>
        <img
          src={grocery.image}
          alt={grocery.name}
          className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/70">
            {grocery.category}
          </p>
          <h3 className="mt-2 line-clamp-2 min-h-[64px] font-display text-2xl font-semibold leading-8 tracking-tight text-slate-950">
            {grocery.name}
          </h3>
          <p className="mt-3 inline-flex rounded-full bg-white/70 px-3 py-1 text-sm text-slate-500">
            {grocery.unit}
          </p>
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quick Basket price</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">Rs. {grocery.price}</p>
            </div>
            <p className="text-right text-sm font-medium text-emerald-700">Ready for cart</p>
          </div>

          {!cartItem ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={add}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
              type="button"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-between rounded-full border border-emerald-200 bg-emerald-50/80 px-2 py-2"
            >
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                onClick={() => dispatch(decreaseItem(grocery._id || grocery.id))}
                type="button"
                title="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-950">{cartItem.quantity}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">in cart</p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                onClick={() => dispatch(increaseItem(grocery._id || grocery.id))}
                type="button"
                title="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

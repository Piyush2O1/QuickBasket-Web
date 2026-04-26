import {
  Apple,
  Baby,
  Box,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Flame,
  Heart,
  Home,
  Milk,
  Wheat,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const defaultCategories = [
  { name: "Fruits & Vegetables", icon: Apple, accent: "from-emerald-200 via-white to-emerald-50" },
  { name: "Dairy & Eggs", icon: Milk, accent: "from-amber-200 via-white to-amber-50" },
  { name: "Rice, Atta & Grains", icon: Wheat, accent: "from-orange-200 via-white to-orange-50" },
  { name: "Snacks & Biscuits", icon: Cookie, accent: "from-rose-200 via-white to-rose-50" },
  { name: "Spices & Masalas", icon: Flame, accent: "from-red-200 via-white to-red-50" },
  { name: "Beverages & Drinks", icon: Coffee, accent: "from-sky-200 via-white to-sky-50" },
  { name: "Personal Care", icon: Heart, accent: "from-fuchsia-200 via-white to-fuchsia-50" },
  { name: "Household Essentials", icon: Home, accent: "from-lime-200 via-white to-lime-50" },
  { name: "Instant & Packaged Food", icon: Box, accent: "from-cyan-200 via-white to-cyan-50" },
  { name: "Baby & Pet Care", icon: Baby, accent: "from-pink-200 via-white to-pink-50" },
];

export default function CategorySlider({ categories = [], selected = "", onSelect }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const visibleCategories = defaultCategories.filter((item) =>
    categories.length ? categories.includes(item.name) : true,
  );

  const checkScroll = () => {
    const node = scrollRef.current;
    if (!node) return;

    setShowLeft(node.scrollLeft > 10);
    setShowRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 10);
  };

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    checkScroll();
    const node = scrollRef.current;
    if (!node) return undefined;

    node.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      node.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [visibleCategories.length]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || visibleCategories.length < 2) return undefined;

    const interval = window.setInterval(() => {
      if (isPaused) return;

      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 12;
      node.scrollTo({
        left: atEnd ? 0 : node.scrollLeft + 260,
        behavior: "smooth",
      });
    }, 2800);

    return () => window.clearInterval(interval);
  }, [isPaused, visibleCategories.length]);

  return (
    <motion.section
      className="relative mx-auto mt-16 w-[94%] max-w-7xl"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Shop by Category
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Browse the aisles faster
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          Tap a category to filter the store instantly, or reset to see every fresh pick available today.
        </p>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {showLeft && (
          <button
            type="button"
            className="absolute -left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:text-emerald-700"
            onClick={() => scroll("left")}
            title="Previous categories"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth py-2"
          onScroll={checkScroll}
        >
          <button
            type="button"
            onClick={() => onSelect?.("")}
            className={`group min-w-[220px] rounded-[28px] border p-5 text-left transition hover:-translate-y-1 ${
              selected
                ? "glass-panel border-white/70"
                : "border-emerald-200 bg-emerald-950 text-white shadow-[0_18px_40px_rgba(6,78,59,0.2)]"
            }`}
          >
            <div
              className={`mb-5 inline-flex rounded-2xl p-3 ${
                selected ? "bg-emerald-50 text-emerald-700" : "bg-white/16 text-white"
              }`}
            >
              <Box className="h-5 w-5" />
            </div>
            <p className="font-display text-xl font-semibold">All groceries</p>
            <p className={`mt-2 text-sm ${selected ? "text-slate-500" : "text-white/70"}`}>
              Everything in one place
            </p>
          </button>

          {visibleCategories.map((cat, index) => {
            const Icon = cat.icon;
            const active = selected === cat.name;

            return (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.04, duration: 0.28 }}
                onClick={() => onSelect?.(cat.name)}
                type="button"
                className={`group min-w-[220px] rounded-[28px] border p-5 text-left transition hover:-translate-y-1 ${
                  active
                    ? "border-emerald-300 bg-emerald-950 text-white shadow-[0_18px_40px_rgba(6,78,59,0.2)]"
                    : "glass-panel border-white/70"
                }`}
              >
                <div
                  className={`mb-5 inline-flex rounded-2xl p-3 ${
                    active ? "bg-white/16 text-white" : `bg-gradient-to-br ${cat.accent} text-slate-800`
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-display text-xl font-semibold leading-6">{cat.name}</p>
                <p className={`mt-2 text-sm ${active ? "text-white/70" : "text-slate-500"}`}>
                  Fresh daily picks
                </p>
              </motion.button>
            );
          })}
        </div>

        {showRight && (
          <button
            type="button"
            className="absolute -right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:text-emerald-700"
            onClick={() => scroll("right")}
            title="Next categories"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.section>
  );
}

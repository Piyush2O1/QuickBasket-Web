import {
  ArrowRight,
  Bell,
  Bike,
  Clock3,
  Leaf,
  MapPinned,
  PackageCheck,
  Route,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Store,
  TicketPercent,
  Truck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/http.js";
import { getSocket } from "../api/socket.js";
import BrandMark from "../components/BrandMark.jsx";
import CategorySlider from "../components/CategorySlider.jsx";
import Footer from "../components/Footer.jsx";
import GroceryCard from "../components/GroceryCard.jsx";
import { getDashboardPath } from "../lib/appRoutes.js";
import { addItem } from "../store/cartSlice.js";

const featureCards = [
  {
    title: "Fast shopping flow",
    description: "Search, filter, add to cart, and checkout without leaving the main storefront rhythm.",
    icon: Search,
  },
  {
    title: "Live delivery clarity",
    description: "Customer tracking, delivery assignment, chat, and OTP handoff stay connected end to end.",
    icon: Route,
  },
  {
    title: "Operational control",
    description: "Admin inventory and order management keep the store ready for real grocery operations.",
    icon: Store,
  },
];

const landingCategories = [
  { label: "Fresh Produce", note: "Fruits, vegetables, herbs", icon: Leaf },
  { label: "Daily Staples", note: "Rice, atta, pulses, oil", icon: ShoppingBasket },
  { label: "Quick Snacks", note: "Biscuits, namkeen, drinks", icon: ShoppingBag },
  { label: "Home Essentials", note: "Cleaning and care items", icon: PackageCheck },
  { label: "Safe Handoff", note: "OTP verified delivery", icon: ShieldCheck },
  { label: "Team Ready", note: "Admin and rider dashboards", icon: Users },
];

const formatMoney = (value) => Number(value || 0).toLocaleString("en-IN");

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, status } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const [groceries, setGroceries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const searchQuery = searchParams.get("q")?.trim() || "";
  const selectedCategory = searchParams.get("category")?.trim() || "";
  const activeFilter = selectedCategory || searchQuery;

  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data } = await api.get("/groceries", {
        params: {
          search: searchQuery || undefined,
          category: selectedCategory || undefined,
        },
      });
      setGroceries(data.groceries || []);
      setCategories(data.categories || []);
      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [searchQuery, selectedCategory, user]);

  const featuredGroceries = useMemo(() => groceries.slice(0, 8), [groceries]);
  const productShelf = activeFilter ? groceries : featuredGroceries;

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchText.trim();
    navigate(query ? `${getDashboardPath("user")}?q=${encodeURIComponent(query)}` : getDashboardPath("user"));
  };

  const selectCategory = (category) => {
    navigate(
      category
        ? `${getDashboardPath("user")}?category=${encodeURIComponent(category)}`
        : getDashboardPath("user"),
    );
  };

  if (status === "loading" && !user) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
        <BackgroundDecor />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <div className="glass-panel-strong flex w-full max-w-xl items-center justify-center rounded-[36px] p-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return <PublicLanding />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "deliveryBoy") {
    return <Navigate to="/delivery/dashboard" replace />;
  }

  return (
    <>
      <main className="relative min-h-screen overflow-hidden px-4 pb-24 sm:px-6">
        <BackgroundDecor />

        <section className="relative mx-auto max-w-7xl pt-6">
          <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="glass-panel-strong gradient-ring overflow-hidden rounded-[40px] p-6 sm:p-8 lg:p-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Fresh picks, ready when you are
              </div>

              <div className="mt-7 max-w-4xl">
                <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  {activeFilter ? `Showing groceries for "${activeFilter}"` : "Fresh groceries without the queue"}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Quick Basket keeps the browsing calm, fast, and clear: search the store, add essentials,
                  checkout, and track every handoff from one connected grocery flow.
                </p>
              </div>

              <form
                onSubmit={submitSearch}
                className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/78 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center px-2">
                  <Search className="mr-3 h-5 w-5 text-emerald-700" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:text-base"
                    placeholder="Search for milk, rice, snacks, vegetables..."
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Search
                </button>
              </form>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/user/cart"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
                >
                  <ShoppingBasket className="h-4 w-4" />
                  Open cart
                </Link>
                <button
                  type="button"
                  onClick={() => selectCategory("")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/72 px-5 py-3 font-semibold text-slate-700 transition hover:bg-white"
                >
                  Reset filters
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            <div className="grid gap-4">
              <MetricCard
                title="Your basket"
                value={`Rs. ${formatMoney(cartTotal)}`}
                description={`${cartCount} item${cartCount === 1 ? "" : "s"} waiting for checkout`}
                icon={ShoppingBag}
                tone="bg-emerald-50 text-emerald-700"
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <MetricCard
                  title="Delivery flow"
                  value="Live tracking"
                  description="Orders keep map, rider, chat, and OTP state together."
                  icon={MapPinned}
                  tone="bg-sky-50 text-sky-700"
                />
                <MetricCard
                  title="Store status"
                  value={`${groceries.length}+ items`}
                  description="Inventory updates from the admin side stay visible here."
                  icon={PackageCheck}
                  tone="bg-amber-50 text-amber-700"
                />
              </div>
              <PromotionsPreview />
              <NotificationPreview />
              <div className="glass-panel rounded-[34px] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-950 p-3 text-white">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                      Built for full order journeys
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Browse, pay, track, chat, and verify delivery without disconnecting the experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CategorySlider categories={categories} selected={selectedCategory} onSelect={selectCategory} />

        <section className="relative mx-auto mt-16 max-w-7xl">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
                Grocery Shelf
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {activeFilter ? "Matched products" : "Fresh picks from the store"}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Product cards keep price, unit, category, and cart controls visible so shopping stays simple.
            </p>
          </div>

          {loading ? (
            <div className="glass-panel-strong rounded-[32px] p-10 text-center font-semibold text-slate-500">
              Loading groceries...
            </div>
          ) : productShelf.length === 0 ? (
            <EmptyState activeFilter={activeFilter} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productShelf.map((grocery) => (
                <GroceryCard key={grocery._id} grocery={grocery} onAdd={(item) => dispatch(addItem(item))} />
              ))}
            </div>
          )}
        </section>

        <section className="relative mx-auto mt-16 max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map(({ title, description, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
                className="glass-panel rounded-[30px] p-6"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {cartCount > 0 && <FloatingCart cartCount={cartCount} cartTotal={cartTotal} />}
      <Footer role={user.role} />
    </>
  );
}

function PromotionsPreview() {
  const socket = useMemo(() => getSocket(), []);
  const [coupons, setCoupons] = useState([]);

  const loadCoupons = () => {
    api
      .get("/coupons")
      .then(({ data }) => setCoupons(data.coupons || []))
      .catch(() => setCoupons([]));
  };

  useEffect(() => {
    loadCoupons();
    socket.on("coupons-updated", loadCoupons);

    return () => {
      socket.off("coupons-updated", loadCoupons);
    };
  }, [socket]);

  return (
    <div className="glass-panel rounded-[34px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
            <TicketPercent className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-slate-950">
              Promotions
            </p>
            <p className="mt-1 text-sm text-slate-500">Live coupon codes</p>
          </div>
        </div>
        <Link
          to="/user/checkout"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Use
        </Link>
      </div>

      <div className="mt-4 grid gap-2">
        {coupons.length === 0 ? (
          <p className="rounded-[22px] bg-white/68 px-4 py-3 text-sm text-slate-500">
            No active coupons right now
          </p>
        ) : (
          coupons.slice(0, 3).map((coupon) => (
            <div
              key={coupon._id}
              className="flex items-center justify-between gap-3 rounded-[22px] bg-white/68 px-4 py-3"
            >
              <div>
                <p className="text-sm font-bold uppercase text-slate-900">{coupon.code}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {coupon.discountPercent}% off on Rs. {coupon.minOrderAmount || 200}+ subtotal
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                {coupon.discountPercent}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotificationPreview() {
  const socket = useMemo(() => getSocket(), []);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    api
      .get("/notifications", { params: { limit: 3 } })
      .then(({ data }) => {
        if (!mounted) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});

    const onNotification = ({ notification, unreadCount: nextUnreadCount }) => {
      if (!notification?._id) return;

      setNotifications((current) => [
        notification,
        ...current.filter((item) => String(item._id) !== String(notification._id)),
      ].slice(0, 3));
      setUnreadCount((current) =>
        typeof nextUnreadCount === "number" ? nextUnreadCount : current + 1,
      );
    };

    socket.on("notification-created", onNotification);

    return () => {
      mounted = false;
      socket.off("notification-created", onNotification);
    };
  }, [socket]);

  return (
    <div className="glass-panel rounded-[34px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-slate-950">
              Notifications
            </p>
            <p className="mt-1 text-sm text-slate-500">{unreadCount} unread</p>
          </div>
        </div>
        <Link
          to="/user/notifications"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Open
        </Link>
      </div>

      <div className="mt-4 grid gap-2">
        {notifications.length === 0 ? (
          <p className="rounded-[22px] bg-white/68 px-4 py-3 text-sm text-slate-500">
            No notifications yet
          </p>
        ) : (
          notifications.map((notification) => (
            <div key={notification._id} className="rounded-[22px] bg-white/68 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-800">{notification.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {notification.createdAt ? new Date(notification.createdAt).toLocaleString("en-IN") : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon, tone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel rounded-[34px] p-5"
    >
      <div className={`mb-5 inline-flex rounded-2xl p-3 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </motion.div>
  );
}

function EmptyState({ activeFilter }) {
  return (
    <div className="glass-panel-strong rounded-[32px] p-10 text-center">
      <p className="font-display text-3xl font-bold text-slate-950">No groceries found</p>
      <p className="mx-auto mt-3 max-w-xl text-slate-600">
        {activeFilter
          ? "Try a different keyword or reset filters to return to the full shelf."
          : "The store shelf is empty right now. Add groceries from the admin dashboard to start selling."}
      </p>
    </div>
  );
}

function FloatingCart({ cartCount, cartTotal }) {
  return (
    <Link
      to="/user/cart"
      className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(15,23,42,0.24)] transition hover:bg-emerald-700"
    >
      <span className="rounded-full bg-white/15 px-3 py-1">{cartCount} items</span>
      <span>View cart</span>
      <span>Rs. {formatMoney(cartTotal)}</span>
    </Link>
  );
}

function PublicLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6">
      <BackgroundDecor />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between rounded-[32px] border border-white/70 bg-white/66 px-4 py-3 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur sm:px-6">
        <BrandMark href="/" />
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Start Shopping
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl pb-20 pt-12">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-panel-strong gradient-ring rounded-[42px] p-6 sm:p-8 lg:p-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
              <Clock3 className="h-4 w-4" />
              Fresh grocery journeys
            </div>
            <h1 className="font-display mt-7 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
              A cleaner way to shop, deliver, and manage groceries
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Quick Basket brings the customer storefront, admin inventory, checkout, live tracking, chat,
              and OTP delivery verification into one smooth grocery platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 font-semibold text-slate-700 transition hover:bg-white"
              >
                Team login
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-4">
            <FeaturePill title="Customer Storefront" copy="Search, categories, cart, checkout, and order history." icon={ShoppingBasket} />
            <FeaturePill title="Delivery Workspace" copy="Assignments, maps, chat, and OTP completion." icon={Bike} />
            <FeaturePill title="Admin Operations" copy="Grocery inventory and order management in one place." icon={Store} />
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-6">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Store Lanes
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything the grocery flow needs
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landingCategories.map(({ label, note, icon: Icon }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="glass-panel rounded-[28px] p-5"
              >
                <div className="inline-flex rounded-2xl bg-white/70 p-3 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-xl font-semibold tracking-tight text-slate-950">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {featureCards.map(({ title, description, icon: Icon }) => (
            <div key={title} className="glass-panel rounded-[30px] p-6">
              <div className="inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer role="guest" />
    </div>
  );
}

function FeaturePill({ title, copy, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel rounded-[32px] p-6"
    >
      <div className="mb-5 inline-flex rounded-2xl bg-slate-950 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
    </motion.div>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-cyan-200/18 blur-3xl" />
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
    </>
  );
}

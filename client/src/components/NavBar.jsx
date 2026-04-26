import {
  Bell,
  Boxes,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Search,
  ShieldCheck,
  ShoppingCartIcon,
  Truck,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/http.js";
import { getSocket } from "../api/socket.js";
import { getDashboardPath, getNotificationPath } from "../lib/appRoutes.js";
import { logoutUser } from "../store/authSlice.js";
import BrandMark from "./BrandMark.jsx";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/add-grocery", label: "Add Grocery", icon: PlusCircle },
  { href: "/admin/groceries", label: "View Grocery", icon: Boxes },
  { href: "/admin/orders", label: "Manage Orders", icon: ClipboardCheck },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

const roleTheme = {
  user: {
    label: "Fresh Market",
    icon: ShoppingCartIcon,
    classes: "bg-emerald-100 text-emerald-800",
  },
  deliveryBoy: {
    label: "Delivery Hub",
    icon: Truck,
    classes: "bg-amber-100 text-amber-800",
  },
  admin: {
    label: "Operations",
    icon: ShieldCheck,
    classes: "bg-slate-900 text-white",
  },
};

export default function NavBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profileDropDown = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  const dashboardPath = getDashboardPath(user?.role);
  const notificationPath = getNotificationPath(user?.role);
  const roleConfig = roleTheme[user?.role] || roleTheme.user;
  const RoleIcon = roleConfig.icon;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropDown.current && !profileDropDown.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    let mounted = true;
    const socket = getSocket();

    api
      .get("/notifications/unread-count")
      .then(({ data }) => {
        if (mounted) setNotificationCount(data.unreadCount || 0);
      })
      .catch(() => {
        if (mounted) setNotificationCount(0);
      });

    const onNotification = (payload) => {
      setNotificationCount((current) =>
        typeof payload?.unreadCount === "number" ? payload.unreadCount : current + 1,
      );
    };
    const onCountChange = (event) => {
      const nextCount = Number(event.detail?.unreadCount ?? event.detail ?? 0);
      setNotificationCount(Number.isFinite(nextCount) ? nextCount : 0);
    };

    socket.on("notification-created", onNotification);
    window.addEventListener("quickbasket:notifications-count", onCountChange);

    return () => {
      mounted = false;
      socket.off("notification-created", onNotification);
      window.removeEventListener("quickbasket:notifications-count", onCountChange);
    };
  }, [user?.id]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/user/dashboard?q=${encodeURIComponent(query)}` : "/user/dashboard");
    setSearch("");
  };

  const logout = async () => {
    setProfileOpen(false);
    setMenuOpen(false);
    await dispatch(logoutUser());
    navigate("/login");
  };

  if (!user) return null;

  return (
    <>
      <div className="fixed left-1/2 top-4 z-50 w-[95%] max-w-7xl -translate-x-1/2">
        <div className="glass-panel-strong flex min-h-20 items-center justify-between gap-3 rounded-[32px] px-4 py-3 sm:px-5 lg:px-7">
          <div className="flex items-center gap-3">
            <BrandMark href={dashboardPath} compact={user.role !== "user"} />
            <div
              className={`hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold lg:inline-flex ${roleConfig.classes}`}
            >
              <RoleIcon className="h-3.5 w-3.5" />
              {roleConfig.label}
            </div>
          </div>

          {user.role === "user" && (
            <form
              onSubmit={handleSearch}
              className="mx-4 hidden max-w-xl flex-1 items-center rounded-full border border-white/70 bg-white/72 px-4 py-3 shadow-sm transition focus-within:border-emerald-200 md:flex"
            >
              <Search className="mr-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search groceries, snacks, and essentials"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </form>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {user.role === "admin" && (
              <>
                <div className="hidden items-center gap-2 lg:flex">
                  {adminLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={label}
                      to={href}
                      className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-emerald-800"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white lg:hidden"
                  onClick={() => setMenuOpen((current) => !current)}
                  title="Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </>
            )}

            {user.role === "deliveryBoy" && (
              <div className="hidden items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 sm:inline-flex">
                <Truck className="h-4 w-4" />
                Stay online for new assignments
              </div>
            )}

            {user.role === "user" && (
              <>
                <Link
                  to="/user/orders"
                  className="hidden rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-emerald-800 sm:inline-flex"
                >
                  Orders
                </Link>
                <Link
                  to="/user/cart"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <ShoppingCartIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Cart</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{cartCount}</span>
                </Link>
              </>
            )}

            <Link
              to={notificationPath}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/75 text-slate-700 shadow-sm transition hover:scale-[1.03] hover:bg-white hover:text-emerald-800"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>

            <ProfileMenu
              dashboardPath={dashboardPath}
              logout={logout}
              profileDropDown={profileDropDown}
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              user={user}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && user.role === "admin" && (
          <motion.div
            initial={{ x: -72, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -72, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="glass-panel-dark fixed inset-y-4 left-4 z-[9999] flex w-[calc(100%-2rem)] max-w-sm flex-col rounded-[30px] p-5 text-white"
          >
            <div className="mb-6 flex items-center justify-between">
              <BrandMark href={dashboardPath} light compact />
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/10 p-2 text-white/80 transition hover:bg-white/16 hover:text-white"
                onClick={() => setMenuOpen(false)}
                title="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/12">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{user?.name}</h2>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">{user?.role}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {adminLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  to={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/14"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>

            <button
              type="button"
              className="mt-auto flex items-center justify-center gap-2 rounded-[22px] border border-red-400/20 bg-red-500/10 px-4 py-3 font-semibold text-red-200 transition hover:bg-red-500/18"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ProfileMenu({ dashboardPath, logout, profileDropDown, profileOpen, setProfileOpen, user }) {
  return (
    <div className="relative" ref={profileDropDown}>
      <button
        type="button"
        className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/75 shadow-sm transition hover:scale-[1.03] hover:bg-white"
        onClick={() => setProfileOpen((current) => !current)}
        title="Profile"
      >
        {user?.image ? (
          <img src={user.image} alt="user" className="h-full w-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-slate-700" />
        )}
      </button>

      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="glass-panel-strong absolute right-0 mt-3 w-72 rounded-[26px] p-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-200/70 pb-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50">
                {user?.image ? (
                  <img src={user.image} alt="user" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-slate-700" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{user?.name}</div>
                <div className="truncate text-sm text-slate-500">{user?.email}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Link
                to={dashboardPath}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/80 hover:text-emerald-800"
                onClick={() => setProfileOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              {user?.role === "user" && (
                <Link
                  to="/user/orders"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/80 hover:text-emerald-800"
                  onClick={() => setProfileOpen(false)}
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>
              )}

              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck, Truck, UserRound } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import { getPostAuthPath } from "../lib/appRoutes.js";
import { clearAuthError, loginUser, loginWithGoogle } from "../store/authSlice.js";

const loginRoles = [
  { value: "user", label: "User", icon: UserRound },
  { value: "deliveryBoy", label: "Delivery partner", icon: Truck },
  { value: "admin", label: "Admin", icon: ShieldCheck },
];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { error, status } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "user" });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleGoogleCredential = useCallback(
    async (credential) => {
      const result = await dispatch(loginWithGoogle({ credential, role: form.role, mode: "login" }));
      if (result.meta.requestStatus === "fulfilled") {
        navigate(location.state?.from || getPostAuthPath(result.payload), { replace: true });
      }
    },
    [dispatch, form.role, location.state?.from, navigate],
  );

  const submit = async (event) => {
    event.preventDefault();
    const result = await dispatch(loginUser({ ...form, email: form.email.trim().toLowerCase() }));
    if (result.meta.requestStatus === "fulfilled") {
      navigate(location.state?.from || getPostAuthPath(result.payload), { replace: true });
    }
  };

  const formValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && form.password;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="glass-panel-dark hidden rounded-[36px] p-8 text-white lg:block"
        >
          <BrandMark light />
          <h1 className="font-display mt-8 text-5xl font-bold leading-tight tracking-tight">
            Login to the smarter Quick Basket experience.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
            Customers get smoother shopping. Delivery teams get cleaner controls. Admins get a more
            polished command surface.
          </p>

          <div className="mt-10 grid gap-4">
            {[
              "Responsive storefront with cleaner search and browsing",
              "Premium delivery dashboard with route, OTP, and chat flow",
              "Quick Basket branding across the whole application",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4 text-sm text-white/78"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="glass-panel-strong mx-auto w-full max-w-xl rounded-[36px] p-6 sm:p-8"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandMark compact />
          </div>

          <div className="space-y-3 text-center lg:text-left">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Welcome Back
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-slate-950">
              Login to Quick Basket
            </h2>
            <p className="text-slate-600">Continue to your dashboard, cart, orders, or delivery center.</p>
          </div>

          {error && (
            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {loginRoles.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    dispatch(clearAuthError());
                    setForm({ ...form, role: value });
                  }}
                  className={`flex items-center justify-center gap-2 rounded-[22px] border px-4 py-3 text-sm font-semibold transition ${
                    form.role === value
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-white/80 bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input
                value={form.email}
                onChange={(event) => {
                  dispatch(clearAuthError());
                  setForm({ ...form, email: event.target.value });
                }}
                type="email"
                placeholder="Your email"
                className="w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-4 text-slate-800 outline-none focus:border-emerald-300"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input
                value={form.password}
                onChange={(event) => {
                  dispatch(clearAuthError());
                  setForm({ ...form, password: event.target.value });
                }}
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                className="w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-12 text-slate-800 outline-none focus:border-emerald-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-4 text-slate-500"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!formValid || status === "loading"}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-semibold transition ${
                formValid ? "bg-slate-950 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200/80" />
            or
            <span className="h-px flex-1 bg-slate-200/80" />
          </div>

          <GoogleAuthButton disabled={status === "loading"} onCredential={handleGoogleCredential} />

          <p
            className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600 lg:justify-start"
            onClick={() => navigate("/register")}
          >
            Need a new account?
            <LogIn className="h-4 w-4 text-emerald-700" />
            <span className="font-semibold text-emerald-700">Sign up</span>
          </p>
        </motion.section>
      </div>
    </main>
  );
}

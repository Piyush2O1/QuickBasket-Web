import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import { getPostAuthPath } from "../lib/appRoutes.js";
import {
  clearAuthError,
  loginWithGoogle,
  registerUser,
} from "../store/authSlice.js";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, status } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    role: "user",
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const normalizedEmail = form.email.trim().toLowerCase();

  const validationMessage = useMemo(() => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }, [form.email, form.name, form.password]);

  const handleGoogleCredential = useCallback(
    async (credential) => {
      const result = await dispatch(loginWithGoogle({ credential, role: form.role, mode: "register" }));
      if (result.meta.requestStatus === "fulfilled") {
        navigate(getPostAuthPath(result.payload), { replace: true });
      }
    },
    [dispatch, form.role, navigate],
  );

  const update = (field) => (event) => {
    dispatch(clearAuthError());
    setForm({ ...form, [field]: event.target.value });
  };

  const formValid = form.name.trim() && form.email.trim() && form.password && !validationMessage;

  const submit = async (event) => {
    event.preventDefault();
    if (validationMessage || !formValid) return;

    const result = await dispatch(
      registerUser({
        ...form,
        name: form.name.trim(),
        email: normalizedEmail,
      }),
    );

    if (result.meta.requestStatus === "fulfilled") {
      navigate(getPostAuthPath(result.payload), { replace: true });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55 }}
          className="glass-panel-strong w-full rounded-[38px] p-6 sm:p-8"
        >
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            onClick={() => navigate("/")}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mt-6 flex justify-center">
            <BrandMark compact />
          </div>

          <div className="mt-6 space-y-3 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Create Account
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Join Quick Basket today
            </h1>
            <p className="mx-auto max-w-2xl text-slate-600">
              Create your account directly as a customer or delivery partner.
            </p>
          </div>

          {(error || validationMessage) && (
            <div className="mx-auto mt-6 max-w-xl rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {error || validationMessage}
            </div>
          )}

          <form onSubmit={submit} className="mx-auto mt-8 max-w-xl space-y-5">
            <Field
              icon={User}
              placeholder="Your name"
              value={form.name}
              onChange={update("name")}
              required
            />
            <Field
              icon={Mail}
              placeholder="Your email"
              type="email"
              value={form.email}
              onChange={update("email")}
              required
            />
            <div className="relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                className="w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-12 text-slate-800 outline-none focus:border-emerald-300"
                onChange={update("password")}
                value={form.password}
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
            <Field icon={Phone} placeholder="Mobile number" value={form.mobile} onChange={update("mobile")} />

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "user", label: "Customer" },
                { value: "deliveryBoy", label: "Delivery partner" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => {
                    dispatch(clearAuthError());
                    setForm({ ...form, role: item.value });
                  }}
                  className={`rounded-[24px] border px-4 py-4 text-sm font-semibold transition ${
                    form.role === item.value
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-white/80 bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              disabled={!formValid || status === "loading"}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-semibold transition ${
                formValid ? "bg-slate-950 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              {status === "loading" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="mx-auto my-6 flex max-w-xl items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200/80" />
            or
            <span className="h-px flex-1 bg-slate-200/80" />
          </div>

          <div className="mx-auto max-w-xl">
            <GoogleAuthButton disabled={status === "loading"} onCredential={handleGoogleCredential} />
          </div>

          <p
            className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600"
            onClick={() => navigate("/login")}
          >
            Already have an account?
            <LogIn className="h-4 w-4 text-emerald-700" />
            <span className="font-semibold text-emerald-700">Sign in</span>
          </p>
        </motion.section>
      </div>
    </main>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
      <input
        className="w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-4 text-slate-800 outline-none focus:border-emerald-300"
        {...props}
      />
    </div>
  );
}

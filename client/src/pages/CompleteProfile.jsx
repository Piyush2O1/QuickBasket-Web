import { ArrowRight, Bike, Phone, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark.jsx";
import { getDashboardPath } from "../lib/appRoutes.js";
import { updateProfile } from "../store/authSlice.js";

const roleCards = [
  {
    id: "user",
    label: "Customer",
    description: "Browse groceries, place orders, and track deliveries.",
    icon: User,
  },
  {
    id: "deliveryBoy",
    label: "Delivery Partner",
    description: "Accept assignments, follow routes, and verify OTP handoff.",
    icon: Bike,
  },
];

export default function CompleteProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [role, setRole] = useState(user?.role === "admin" ? "user" : user?.role || "user");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.mobile) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [navigate, user]);

  const canSave = useMemo(
    () => mobile.replace(/\D/g, "").length === 10 && roleCards.some((item) => item.id === role),
    [mobile, role],
  );

  const submit = async () => {
    if (!canSave) return;

    setSaving(true);
    setError("");

    const result = await dispatch(
      updateProfile({
        role,
        mobile: mobile.replace(/\D/g, "").slice(0, 10),
      }),
    );

    setSaving(false);

    if (result.meta.requestStatus !== "fulfilled") {
      setError(result.payload || "Could not save your profile right now.");
      return;
    }

    navigate(getDashboardPath(result.payload.role), { replace: true });
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="glass-panel-strong w-full rounded-[38px] p-6 sm:p-10">
          <div className="flex justify-center">
            <BrandMark />
          </div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-8 text-center"
          >
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Complete Profile
            </p>
            <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Finish your setup
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Add your mobile number and confirm the role you want to use inside Quick Basket.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {roleCards.map((item, index) => {
              const Icon = item.icon;
              const selected = role === item.id;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRole(item.id)}
                  className={`rounded-[30px] border p-6 text-left transition ${
                    selected
                      ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.12)]"
                      : "border-white/80 bg-white/72 hover:bg-white"
                  }`}
                >
                  <div
                    className={`inline-flex rounded-2xl p-3 ${
                      selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-display mt-5 text-2xl font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </motion.button>
              );
            })}
          </div>

          <div className="mx-auto mt-10 max-w-xl">
            <label htmlFor="mobile" className="mb-3 block text-sm font-semibold text-slate-700">
              Mobile number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 pl-12 text-slate-800 outline-none focus:border-emerald-300"
                placeholder="e.g. 9876543210"
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Use a valid 10-digit number so delivery updates and OTP verification work correctly.
            </p>
          </div>

          {error && (
            <div className="mx-auto mt-6 max-w-xl rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {error}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              disabled={!canSave || saving}
              onClick={submit}
              className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold transition ${
                canSave && !saving ? "bg-slate-950 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              {saving ? "Saving profile..." : "Go to dashboard"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

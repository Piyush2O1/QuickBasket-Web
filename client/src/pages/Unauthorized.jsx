import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-[94%] max-w-3xl items-center justify-center pb-16 text-center">
      <div className="glass-panel-strong w-full rounded-[36px] p-8 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-100 text-red-700">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="font-display mt-5 text-4xl font-bold tracking-tight text-slate-950">
          Access denied
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Your current role cannot open this page. Move back to the correct dashboard or login with a different
          account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Go home
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}

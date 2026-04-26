import { ShoppingBasket, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function BrandMark({ href = "/", className = "", light = false, compact = false }) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border shadow-[0_14px_34px_rgba(15,23,42,0.14)] ${
          light ? "border-white/30 bg-white/18" : "border-white/70 bg-white/75"
        }`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.96),rgba(245,158,11,0.94))]" />
        <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white/25 blur-md" />
        <ShoppingBasket className="relative z-10 h-5 w-5 text-white" />
        <span className="absolute bottom-1 right-1 rounded-full bg-white/20 p-1">
          <Zap className="h-2.5 w-2.5 text-white" />
        </span>
      </div>

      {!compact && (
        <div className="leading-none">
          <p
            className={`font-display hidden text-sm font-bold uppercase tracking-[0.24em] md:block ${
              light ? "text-white/70" : "text-emerald-900/60"
            }`}
          >
            Groceries in Motion
          </p>
          <p
            className={`font-display text-2xl font-bold tracking-tight ${
              light ? "text-white" : "text-slate-900"
            }`}
          >
            Quick Basket
          </p>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link to={href} className="inline-flex">
      {content}
    </Link>
  ) : (
    content
  );
}

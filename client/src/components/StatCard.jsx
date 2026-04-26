export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="glass-panel rounded-[28px] p-5 transition hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
      {Icon && (
        <span className="inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-800">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </div>
  );
}

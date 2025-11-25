export default function MetricCard({
  title,
  value,
  subtitle,
  tone = "neutral",
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-200/80 bg-emerald-50/60"
      : tone === "warning"
      ? "border-amber-200/80 bg-amber-50/60"
      : "border-neutral-200 bg-white/80";

  const accentBar =
    tone === "success"
      ? "from-emerald-400/70 via-emerald-300/60 to-emerald-400/70"
      : tone === "warning"
      ? "from-amber-400/70 via-amber-300/60 to-amber-400/70"
      : "from-blue-500/60 via-sky-400/60 to-indigo-500/60";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${toneClasses}`}
    >
      {/* barra superior de acento */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentBar}`}
      />

      {/* pequeño halo de luz */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/30 blur-2 group-hover:bg-white/40" />

      <div className="relative">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500/80">
          {title}
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="text-3xl font-semibold leading-none">{value}</div>
          {subtitle && (
            <span className="rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-medium text-neutral-600 border border-white/70">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

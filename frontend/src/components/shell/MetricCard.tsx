export default function MetricCard({
  title, value, subtitle, tone = "neutral",
}: { title: string; value: string; subtitle?: string; tone?: "neutral"|"success"|"warning" }) {
  const border =
    tone === "success" ? "border-green-200" : tone === "warning" ? "border-amber-200" : "border-neutral-200";
  return (
    <div className={`rounded-2xl border ${border} bg-white p-4`}>
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>}
    </div>
  );
}

"use client";

export default function PassProgress({ used, total }: { used: number; total: number }) {
  const segments = Array.from({ length: total }, (_, i) => i < used);
  return (
    <div className="flex gap-1 items-center">
      <div className="grid grid-cols-10 gap-1">
        {segments.map((filled, i) => (
          <span
            key={i}
            className={`h-2.5 w-3 rounded-sm ${filled ? "bg-emerald-600" : "bg-neutral-200"}`}
          />
        ))}
      </div>
      <span className="ml-2 text-sm tabular-nums">{used}/{total}</span>
    </div>
  );
}

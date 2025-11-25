export default function ActivityItem({
  title,
  time,
}: {
  title: string;
  time: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 text-sm shadow-xs transition-all duration-150 hover:border-blue-100 hover:bg-blue-50/60">
      <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
        •
      </div>
      <div className="flex-1">
        <div className="text-[13px] text-neutral-800">{title}</div>
        <div className="mt-0.5 text-[11px] text-neutral-500">{time}</div>
      </div>
    </div>
  );
}

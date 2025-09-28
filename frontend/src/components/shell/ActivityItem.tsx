export default function ActivityItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-neutral-300" />
      <div>
        <div className="text-sm">{title}</div>
        <div className="text-xs text-neutral-500">{time}</div>
      </div>
    </div>
  );
}

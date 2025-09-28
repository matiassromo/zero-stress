export default function ModuleCard({
  title, subtitle, badge,
}: { title: string; subtitle: string; badge?: string }) {
  return (
    <a href="#" className="block rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="text-xs text-neutral-500">{subtitle}</div>
        </div>
        {badge && (
          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {badge}
          </span>
        )}
      </div>
    </a>
  );
}

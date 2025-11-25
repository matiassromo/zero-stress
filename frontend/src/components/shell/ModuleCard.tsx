import Link from "next/link";

export default function ModuleCard({
  title,
  subtitle,
  badge,
  href,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  href?: string;
}) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    href ? (
      <Link
        href={href}
        className="group block rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-500/70 hover:shadow-md"
      >
        {children}
      </Link>
    ) : (
      <div className="group block rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
        {children}
      </div>
    );

  return (
    <Wrapper>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">
            {title}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">{subtitle}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {badge && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
              {badge}
            </span>
          )}
          <span className="mt-auto inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-[11px] text-neutral-400 group-hover:border-blue-500/60 group-hover:text-blue-600">
            →
          </span>
        </div>
      </div>
    </Wrapper>
  );
}

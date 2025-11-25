import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-r border-neutral-200 bg-white">
          <Sidebar />
        </aside>

        <section>
          <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  Dashboard operativo
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-neutral-900">
                    Panel Zero Stress
                  </div>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    Operación en curso
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <span className="hidden sm:inline">Hoy</span>
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
                  {new Intl.DateTimeFormat("es-EC", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date())}
                </span>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6 space-y-2">
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}

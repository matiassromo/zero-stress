// src/components/shell/Shell.tsx
import Sidebar from "./Sidebar"

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-r border-neutral-200 bg-white">
          <Sidebar />
        </aside>

        <section>
          <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="text-sm font-medium">Panel Zero Stress</div>
              <div className="text-sm text-neutral-500">
                {new Intl.DateTimeFormat("es-EC", {
                  dateStyle: "full",
                  timeStyle: "short",
                }).format(new Date())}
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </section>
      </div>
    </div>
  )
}

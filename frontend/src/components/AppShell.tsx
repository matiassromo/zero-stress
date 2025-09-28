"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/pos", label: "POS" },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-dvh grid md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col gap-2 border-r border-neutral-800 p-4">
        <div className="text-xl font-semibold">Zero Stress</div>
        <nav className="mt-4 space-y-1">
          {nav.map(i => (
            <Link key={i.href} href={i.href}
              className={`link ${pathname === i.href ? "bg-neutral-800 font-medium" : ""}`}>
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs text-neutral-400">v0.1 • Mitad del Mundo</div>
      </aside>

      {/* Contenido */}
      <div className="flex flex-col">
        <header className="flex items-center gap-2 border-b border-neutral-800 p-3">
          <div className="text-sm text-neutral-300">
            Caja: <span className="font-semibold text-green-400">Abierta</span>
          </div>
          <div className="ml-auto text-sm">
            Usuario: <span className="font-semibold">reception@zerostress</span>
          </div>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}

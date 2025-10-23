import "@/app/globals.css"
import Sidebar from "@/components/shell/Sidebar"

export const metadata = {
  title: "Zero Stress Panel",
  description: "Gestión Piscina Zero Stress",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen bg-neutral-950 text-white">
        {/* Sidebar fijo */}
        <aside className="w-64 border-r border-gray-800 bg-neutral-900">
          <Sidebar />
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </body>
    </html>
  )
}

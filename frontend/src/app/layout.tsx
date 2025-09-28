import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Zero Stress Core",
  description: "POS y Gestión - Piscina Zero Stress",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  )
}

import "@/app/globals.css";
import Shell from "@/components/shell/Shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body><Shell>{children}</Shell></body>
    </html>
  );
}

import { redirect } from "next/navigation";

export default function LegacyPOSRedirect() {
  redirect("/facturacion/pos");
}

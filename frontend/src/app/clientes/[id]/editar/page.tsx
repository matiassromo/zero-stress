"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ClientForm, { ClientFormValues } from "@/components/clientes/ClientForm";
import { getClient } from "@/lib/api/clients";

export default function EditarClientePage() {
  const { id } = useParams<{ id: string }>();
  const [defaults, setDefaults] = useState<ClientFormValues | null>(null);

  useEffect(() => {
    (async () => {
      const c = await getClient(id);
      if (!c) return;
      setDefaults({
        nationalId: c.nationalId,
        name: c.name,
        email: c.email,
        address: c.address,
        phone: c.phone,
      });
    })();
  }, [id]);

  if (!defaults) return <div className="p-4">Cargando…</div>;

  return (
    <div className="p-4">
      <ClientForm mode="edit" id={id} defaultValues={defaults} />
    </div>
  );
}

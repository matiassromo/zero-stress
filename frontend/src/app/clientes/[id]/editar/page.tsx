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
        number: c.number,
      });
    })();
  }, [id]);

  if (!defaults) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-500">
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Editar Cliente</h1>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <ClientForm mode="edit" id={id} defaultValues={defaults} />
      </div>
    </div>
  );
}

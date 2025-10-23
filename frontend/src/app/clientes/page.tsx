"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Client } from "@/types/client";
import { listClients, deleteClient } from "@/lib/api/clients";

export default function ClientesPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const data = await listClients(q);
    setItems(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Link href="/clientes/nuevo" className="rounded-2xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
          Nuevo cliente
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="Buscar por nombre, cédula, email o teléfono…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={load} className="rounded-xl px-4 py-2 border hover:bg-gray-50">Buscar</button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Cédula</th>
              <th className="text-left p-3">Teléfono</th>
              <th className="text-left p-3">Correo</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.nationalId}</td>
                <td className="p-3">{c.number}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <Link href={`/clientes/${c.id}/editar`} className="text-blue-600 hover:underline">Editar</Link>
                    <button
                      onClick={async () => {
                        if (!confirm(`¿Eliminar a ${c.name}?`)) return;
                        await deleteClient(c.id);
                        await load();
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={5}>
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

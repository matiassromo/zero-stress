"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient, updateClient, UpsertClientInput } from "@/lib/api/clients";

const schema = z.object({
  nationalId: z.string().min(10, "La cédula debe tener 10 dígitos").max(10, "Máx 10 dígitos").regex(/^\d+$/, "Solo números"),
  name: z.string().min(1, "Nombre obligatorio").max(50, "Máx 50 caracteres"),
  email: z.string().email("Correo inválido"),
  address: z.string().min(1, "Dirección obligatoria").max(300, "Máx 300 caracteres"),
  number: z.string().min(10, "Teléfono 10 dígitos").max(10, "Máx 10 dígitos").regex(/^\d+$/, "Solo números"),
});

export type ClientFormValues = z.infer<typeof schema>;

export default function ClientForm({
  defaultValues,
  mode,
  id,
}: {
  defaultValues?: Partial<ClientFormValues>;
  mode: "create" | "edit";
  id?: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nationalId: "",
      name: "",
      email: "",
      address: "",
      number: "",
      ...defaultValues,
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      const payload: UpsertClientInput = { ...data };
      if (mode === "create") await createClient(payload);
      else if (mode === "edit" && id) await updateClient(id, payload);
      router.push("/clientes");
    } catch (e: any) {
      alert(e?.message ?? "Error guardando cliente");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Registrar Cliente</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Cédula */}
        <div>
          <label className="block text-sm font-medium mb-1">Cédula / National ID</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="1724567890"
            {...register("nationalId")}
          />
          {errors.nationalId && <p className="text-sm text-red-600 mt-1">{errors.nationalId.message}</p>}
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            type="text"
            maxLength={50}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Rodrigo Castillo"
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input
            type="email"
            className="w-full rounded-xl border px-3 py-2"
            placeholder="rodrigo.castillo@gmail.com"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <textarea
            rows={3}
            maxLength={300}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Av. La Prensa y Eloy Alfaro, Quito"
            {...register("address")}
          />
          {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium mb-1">Número / Teléfono</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="0991234567"
            {...register("number")}
          />
          {errors.number && <p className="text-sm text-red-600 mt-1">{errors.number.message}</p>}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            💾 Guardar Cliente
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-2xl px-4 py-2 border hover:bg-gray-50"
          >
            🧹 Limpiar Campos
          </button>
          <button
            type="button"
            onClick={() => router.push("/clientes")}
            className="rounded-2xl px-4 py-2 border hover:bg-gray-50"
          >
            ⬅️ Volver
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient, updateClient, UpsertClientInput } from "@/lib/api/clients";
import Swal from "sweetalert2";
import { confirm, toast } from "@/lib/ui/swal";

const schema = z.object({
  nationalId: z
    .string()
    .min(10, "La cédula debe tener 10 dígitos")
    .max(10, "Máx 10 dígitos")
    .regex(/^\d+$/, "Solo números"),
  name: z.string().min(1, "Nombre obligatorio").max(50, "Máx 50 caracteres"),
  email: z.string().email("Correo inválido"),
  address: z.string().min(1, "Dirección obligatoria").max(300, "Máx 300 caracteres"),
  number: z
    .string()
    .min(10, "Teléfono 10 dígitos")
    .max(10, "Máx 10 dígitos")
    .regex(/^\d+$/, "Solo números"),
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

    if (mode === "edit" && id) {
      // 3.1 Confirmar EDICIÓN
      const res = await confirm({
        title: "Guardar cambios",
        text: "Se actualizarán los datos del cliente.",
        confirmButtonText: "Sí, guardar",
      });
      if (!res.isConfirmed) return;

      // opcional loading mientras guarda
      Swal.showLoading();
      await updateClient(id, payload);
      await Swal.fire({
        icon: "success",
        title: "Cambios guardados",
        timer: 1400,
        showConfirmButton: false,
      });
      router.push("/clientes");
      return;
    }

    if (mode === "create") {
      // 3.2 Crear y mostrar opciones tras CREAR
      Swal.showLoading();
      await createClient(payload);

      const r = await Swal.fire({
        icon: "success",
        title: "Cliente creado",
        text: "¿Qué deseas hacer ahora?",
        showDenyButton: true,
        confirmButtonText: "Ir al listado",
        denyButtonText: "Crear otro",
        reverseButtons: true,
      });

      if (r.isConfirmed) {
        router.push("/clientes");
      } else {
        // Crear otro: limpiar el form y mostrar toast
        reset();
        toast("info", "Formulario listo para un nuevo cliente");
      }
      return;
    }
  } catch (e: any) {
    await Swal.fire({
      icon: "error",
      title: "No se pudo guardar",
      text: e?.message ?? "Error guardando cliente",
    });
  }
};

  const inputCls =
    "w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium mb-1";
  const errCls = "text-sm text-red-600 mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Cédula */}
      <div>
        <label className={labelCls}>Cédula / National ID</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          className={inputCls}
          placeholder="1724567890"
          {...register("nationalId")}
        />
        {errors.nationalId && <p className={errCls}>{errors.nationalId.message}</p>}
      </div>

      {/* Nombre */}
      <div>
        <label className={labelCls}>Nombre</label>
        <input
          type="text"
          maxLength={50}
          className={inputCls}
          placeholder="Rodrigo Castillo"
          {...register("name")}
        />
        {errors.name && <p className={errCls}>{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={labelCls}>Correo electrónico</label>
        <input
          type="email"
          className={inputCls}
          placeholder="rodrigo.castillo@gmail.com"
          {...register("email")}
        />
        {errors.email && <p className={errCls}>{errors.email.message}</p>}
      </div>

      {/* Dirección */}
      <div>
        <label className={labelCls}>Dirección</label>
        <textarea
          rows={3}
          maxLength={300}
          className={`${inputCls} resize-y`}
          placeholder="Av. La Prensa y Eloy Alfaro, Quito"
          {...register("address")}
        />
        {errors.address && <p className={errCls}>{errors.address.message}</p>}
      </div>

      {/* Teléfono */}
      <div>
        <label className={labelCls}>Número / Teléfono</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          className={inputCls}
          placeholder="0991234567"
          {...register("number")}
        />
        {errors.number && <p className={errCls}>{errors.number.message}</p>}
      </div>

      {/* Botones */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          💾 Guardar Cliente
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 hover:bg-neutral-50"
        >
          🧹 Limpiar Campos
        </button>
        <button
          type="button"
          onClick={() => router.push("/clientes")}
          className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 hover:bg-neutral-50"
        >
          ⬅️ Volver
        </button>
      </div>
    </form>
  );
}

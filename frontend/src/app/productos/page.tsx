"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { BarProduct } from "@/types/barProduct";
import {
  listBarProducts,
  createBarProduct,
  updateBarProduct,
  deleteBarProduct,
} from "@/lib/apiv2/barProducts";
import Swal from "sweetalert2";
import { toast } from "@/lib/ui/swal";

const barProductSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100, "Máx 100 caracteres"),
  qty: z.number().min(0, "Stock no puede ser negativo"),
  unitPrice: z.number().min(0.01, "Precio debe ser mayor a 0"),
});

type BarProductFormValues = z.infer<typeof barProductSchema>;

export default function ProductosPage() {
  const [products, setProducts] = useState<BarProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BarProductFormValues>({
    resolver: zodResolver(barProductSchema),
    defaultValues: {
      name: "",
      qty: 0,
      unitPrice: 0,
    },
  });

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await listBarProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const onSubmit = async (data: BarProductFormValues) => {
    try {
      if (editingId) {
        // Update existing product
        await updateBarProduct(editingId, data);
        toast("success", "Producto actualizado");
        setEditingId(null);
      } else {
        // Create new product
        await createBarProduct(data);
        toast("success", "Producto creado");
      }

      reset();
      await loadProducts();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message ?? "No se pudo guardar el producto",
      });
    }
  };

  const handleEdit = (product: BarProduct) => {
    setEditingId(product.id);
    setValue("name", product.name);
    setValue("qty", product.qty);
    setValue("unitPrice", product.unitPrice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    reset();
  };

  const handleDelete = async (product: BarProduct) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar producto?",
      text: `Se eliminará "${product.name}". Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          await deleteBarProduct(product.id);
        } catch (err: any) {
          Swal.showValidationMessage(err?.message ?? "Error eliminando producto");
          throw err;
        }
      },
    });

    if (res.isConfirmed) {
      await loadProducts();
      toast("success", "Producto eliminado");
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputCls =
    "w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium mb-1";
  const errCls = "text-sm text-red-600 mt-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Productos Bar</h1>
      </div>

      {/* Create/Edit Form */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? "Editar Producto" : "Crear Producto"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className={labelCls}>Nombre del Producto</label>
              <input
                type="text"
                className={inputCls}
                placeholder="Hamburguesa, cerveza, pizza..."
                {...register("name")}
              />
              {errors.name && <p className={errCls}>{errors.name.message}</p>}
            </div>

            {/* Stock */}
            <div>
              <label className={labelCls}>Stock</label>
              <input
                type="number"
                className={inputCls}
                placeholder="0"
                min={0}
                {...register("qty", { valueAsNumber: true })}
              />
              {errors.qty && <p className={errCls}>{errors.qty.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Precio Unitario */}
            <div>
              <label className={labelCls}>Precio Unitario ($)</label>
              <input
                type="number"
                className={inputCls}
                placeholder="0.00"
                min={0}
                step="0.01"
                {...register("unitPrice", { valueAsNumber: true })}
              />
              {errors.unitPrice && (
                <p className={errCls}>{errors.unitPrice.message}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting
                ? "Guardando..."
                : editingId
                ? "Actualizar Producto"
                : "Crear Producto"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 hover:bg-neutral-50"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 hover:bg-neutral-50"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Search */}
      <div>
        <input
          className="w-full md:w-96 rounded-full border border-neutral-300 bg-white px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar producto por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr className="[&>th]:text-left [&>th]:font-medium [&>th]:p-3">
              <th>Nombre</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Precio Unitario</th>
              <th className="text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-t [&>tr]:border-neutral-200">
            {loading && (
              <tr>
                <td colSpan={4} className="p-4 text-neutral-500 text-center">
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && filteredProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-500">
                  {searchQuery
                    ? "No se encontraron productos"
                    : "No hay productos. Crea el primero arriba."}
                </td>
              </tr>
            )}

            {!loading &&
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-neutral-50/60 transition-colors"
                >
                  <td className="p-3">{product.name}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        product.qty > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.qty}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium">
                    ${product.unitPrice.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

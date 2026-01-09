"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TransactionMappingModal from "@/components/shared/TransactionMappingModal";

const accessCardSchema = z.object({
  transactionId: z.string().uuid().nullable(),
  total: z.number().min(0, "Total debe ser positivo").default(10),
  uses: z.number().min(0, "Usos no puede ser negativo").max(10, "Máx 10 usos"),
  holderName: z.string().optional(),
});

type AccessCardFormValues = z.infer<typeof accessCardSchema>;

interface AccessCardFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AccessCardFormValues) => Promise<void>;
}

export default function AccessCardForm({
  open,
  onClose,
  onSubmit,
}: AccessCardFormProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccessCardFormValues>({
    resolver: zodResolver(accessCardSchema),
    defaultValues: {
      transactionId: null,
      total: 10,
      uses: 0,
      holderName: "",
    },
  });

  const transactionId = watch("transactionId");

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: AccessCardFormValues) => {
    await onSubmit(data);
    reset();
  };

  const handleTransactionSelected = (txId: string) => {
    setValue("transactionId", txId);
    setShowTransactionModal(false);
  };

  const inputCls =
    "w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium mb-1";
  const errCls = "text-sm text-red-600 mt-1";

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Tarjeta de Acceso</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Holder Name */}
            <div>
              <label className={labelCls}>Titular (Opcional)</label>
              <input
                type="text"
                className={inputCls}
                placeholder="Nombre del titular..."
                {...register("holderName")}
              />
            </div>

            {/* Total Passes */}
            <div>
              <label className={labelCls}>Total de Pases</label>
              <input
                type="number"
                className={inputCls}
                min={0}
                {...register("total", { valueAsNumber: true })}
              />
              {errors.total && <p className={errCls}>{errors.total.message}</p>}
              <p className="text-xs text-neutral-500 mt-1">
                Generalmente una tarjeta tiene 10 pases
              </p>
            </div>

            {/* Uses */}
            <div>
              <label className={labelCls}>Pases Usados</label>
              <input
                type="number"
                className={inputCls}
                min={0}
                max={10}
                {...register("uses", { valueAsNumber: true })}
              />
              {errors.uses && <p className={errCls}>{errors.uses.message}</p>}
            </div>

            {/* Transaction (Optional) */}
            <div>
              <label className={labelCls}>Transacción (Opcional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`flex-1 ${inputCls}`}
                  placeholder="ID de transacción"
                  value={transactionId || ""}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(true)}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                >
                  Seleccionar
                </button>
              </div>
              {transactionId && (
                <p className="text-sm text-emerald-600 mt-1">
                  ✓ Transacción vinculada
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? "Creando..." : "Crear Tarjeta"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Mapping Modal */}
      <TransactionMappingModal
        open={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onTransactionSelected={handleTransactionSelected}
        currentTransactionId={transactionId}
      />
    </>
  );
}

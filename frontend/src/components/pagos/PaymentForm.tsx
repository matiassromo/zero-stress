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
import { PaymentType } from "@/types/payment";
import TransactionMappingModal from "@/components/shared/TransactionMappingModal";

const paymentSchema = z.object({
  total: z.number().min(0.01, "Monto debe ser mayor a 0"),
  type: z.nativeEnum(PaymentType, {
    errorMap: () => ({ message: "Selecciona un tipo de pago" }),
  }),
  transactionId: z.string().uuid("Debe vincular a una transacción"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormValues) => Promise<void>;
}

export default function PaymentForm({
  open,
  onClose,
  onSubmit,
}: PaymentFormProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      total: 0,
      type: PaymentType.Efectivo,
      transactionId: "",
    },
  });

  const transactionId = watch("transactionId");

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: PaymentFormValues) => {
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
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Monto */}
            <div>
              <label className={labelCls}>Monto ($)</label>
              <input
                type="number"
                className={inputCls}
                placeholder="0.00"
                min={0}
                step="0.01"
                {...register("total", { valueAsNumber: true })}
              />
              {errors.total && <p className={errCls}>{errors.total.message}</p>}
            </div>

            {/* Tipo de Pago */}
            <div>
              <label className={labelCls}>Tipo de Pago</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-neutral-300 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    type="radio"
                    value={PaymentType.Efectivo}
                    {...register("type", { valueAsNumber: true })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">💵</span>
                    <span className="font-medium">Efectivo</span>
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-neutral-300 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    type="radio"
                    value={PaymentType.Transferencia}
                    {...register("type", { valueAsNumber: true })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">🏦</span>
                    <span className="font-medium">Transferencia</span>
                  </span>
                </label>
              </div>
              {errors.type && <p className={errCls}>{errors.type.message}</p>}
            </div>

            {/* Transacción */}
            <div>
              <label className={labelCls}>Transacción (Requerida)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`flex-1 ${inputCls} ${
                    errors.transactionId ? "border-red-500" : ""
                  }`}
                  placeholder="ID de transacción"
                  {...register("transactionId")}
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
              {errors.transactionId && (
                <p className={errCls}>{errors.transactionId.message}</p>
              )}
              {transactionId && !errors.transactionId && (
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
                {isSubmitting ? "Guardando..." : "Registrar Pago"}
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

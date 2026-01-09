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
import { getCurrentDate, getCurrentTime } from "@/lib/utils/validation";

const entranceTransactionSchema = z
  .object({
    transactionId: z.string().uuid().nullable(),
    entranceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    entranceEntryTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Hora inválida"),
    entranceExitTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, "Hora inválida")
      .nullable()
      .optional(),
    numberAdults: z.number().min(0, "No puede ser negativo"),
    numberChildren: z.number().min(0, "No puede ser negativo"),
    numberSeniors: z.number().min(0, "No puede ser negativo"),
    numberDisabled: z.number().min(0, "No puede ser negativo"),
  })
  .refine(
    (data) =>
      data.numberAdults + data.numberChildren + data.numberSeniors + data.numberDisabled > 0,
    { message: "Debe haber al menos 1 persona", path: ["numberAdults"] }
  );

type EntranceTransactionFormValues = z.infer<typeof entranceTransactionSchema>;

interface EntranceTransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EntranceTransactionFormValues) => Promise<void>;
}

export default function EntranceTransactionForm({
  open,
  onClose,
  onSubmit,
}: EntranceTransactionFormProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntranceTransactionFormValues>({
    resolver: zodResolver(entranceTransactionSchema),
    defaultValues: {
      transactionId: null,
      entranceDate: getCurrentDate(),
      entranceEntryTime: getCurrentTime(),
      entranceExitTime: null,
      numberAdults: 0,
      numberChildren: 0,
      numberSeniors: 0,
      numberDisabled: 0,
    },
  });

  const transactionId = watch("transactionId");
  const adults = watch("numberAdults");
  const children = watch("numberChildren");
  const seniors = watch("numberSeniors");
  const disabled = watch("numberDisabled");
  const totalPeople = adults + children + seniors + disabled;

  useEffect(() => {
    if (open) {
      setValue("entranceDate", getCurrentDate());
      setValue("entranceEntryTime", getCurrentTime());
    } else {
      reset();
    }
  }, [open, reset, setValue]);

  const handleFormSubmit = async (data: EntranceTransactionFormValues) => {
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Ingreso</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Date and Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fecha de Ingreso</label>
                <input
                  type="date"
                  className={inputCls}
                  {...register("entranceDate")}
                />
                {errors.entranceDate && (
                  <p className={errCls}>{errors.entranceDate.message}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Hora de Entrada</label>
                <input
                  type="time"
                  step="1"
                  className={inputCls}
                  {...register("entranceEntryTime")}
                />
                {errors.entranceEntryTime && (
                  <p className={errCls}>{errors.entranceEntryTime.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>Hora de Salida (Opcional)</label>
              <input
                type="time"
                step="1"
                className={inputCls}
                {...register("entranceExitTime")}
              />
              {errors.entranceExitTime && (
                <p className={errCls}>{errors.entranceExitTime.message}</p>
              )}
              <p className="text-xs text-neutral-500 mt-1">
                Dejar vacío si aún no ha salido
              </p>
            </div>

            {/* Visitor Counters */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Número de Visitantes</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>👨 Adultos</label>
                  <input
                    type="number"
                    className={inputCls}
                    min={0}
                    {...register("numberAdults", { valueAsNumber: true })}
                  />
                  {errors.numberAdults && (
                    <p className={errCls}>{errors.numberAdults.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>👶 Niños</label>
                  <input
                    type="number"
                    className={inputCls}
                    min={0}
                    {...register("numberChildren", { valueAsNumber: true })}
                  />
                  {errors.numberChildren && (
                    <p className={errCls}>{errors.numberChildren.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>🧓 3ra Edad</label>
                  <input
                    type="number"
                    className={inputCls}
                    min={0}
                    {...register("numberSeniors", { valueAsNumber: true })}
                  />
                  {errors.numberSeniors && (
                    <p className={errCls}>{errors.numberSeniors.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>♿ Discapacitados</label>
                  <input
                    type="number"
                    className={inputCls}
                    min={0}
                    {...register("numberDisabled", { valueAsNumber: true })}
                  />
                  {errors.numberDisabled && (
                    <p className={errCls}>{errors.numberDisabled.message}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                <p className="font-medium text-blue-900">
                  Total de personas: {totalPeople}
                </p>
              </div>
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
                  Mapear
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
                {isSubmitting ? "Registrando..." : "Registrar Ingreso"}
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

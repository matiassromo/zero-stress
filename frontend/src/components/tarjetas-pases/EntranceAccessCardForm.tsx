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
import type { AccessCard } from "@/types/accessCard";
import { getCurrentDate, getCurrentTime } from "@/lib/utils/validation";

const entranceAccessCardSchema = z.object({
  accessCardId: z.string().uuid("Selecciona una tarjeta"),
  entranceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  entranceEntryTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Hora inválida"),
  entranceExitTime: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Hora inválida")
    .nullable()
    .optional(),
});

type EntranceAccessCardFormValues = z.infer<typeof entranceAccessCardSchema>;

interface EntranceAccessCardFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EntranceAccessCardFormValues) => Promise<void>;
  accessCards: AccessCard[];
}

export default function EntranceAccessCardForm({
  open,
  onClose,
  onSubmit,
  accessCards,
}: EntranceAccessCardFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntranceAccessCardFormValues>({
    resolver: zodResolver(entranceAccessCardSchema),
    defaultValues: {
      accessCardId: "",
      entranceDate: getCurrentDate(),
      entranceEntryTime: getCurrentTime(),
      entranceExitTime: null,
    },
  });

  useEffect(() => {
    if (open) {
      // Set current date and time when modal opens
      setValue("entranceDate", getCurrentDate());
      setValue("entranceEntryTime", getCurrentTime());
    } else {
      reset();
    }
  }, [open, reset, setValue]);

  const handleFormSubmit = async (data: EntranceAccessCardFormValues) => {
    await onSubmit(data);
    reset();
  };

  const inputCls =
    "w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium mb-1";
  const errCls = "text-sm text-red-600 mt-1";

  // Filter active access cards (not all uses consumed)
  const activeCards = accessCards.filter((card) => card.uses < card.total);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Ingreso con Tarjeta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Access Card Selector */}
          <div>
            <label className={labelCls}>Tarjeta de Acceso</label>
            <select
              className={inputCls}
              {...register("accessCardId")}
            >
              <option value="">Selecciona una tarjeta...</option>
              {activeCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.holderName || card.id.substring(0, 8)} - {card.uses}/{card.total} pases usados
                </option>
              ))}
            </select>
            {errors.accessCardId && (
              <p className={errCls}>{errors.accessCardId.message}</p>
            )}
            {activeCards.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                No hay tarjetas activas disponibles
              </p>
            )}
          </div>

          {/* Entrance Date */}
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

          {/* Entrance Entry Time */}
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

          {/* Entrance Exit Time (Optional) */}
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

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || activeCards.length === 0}
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
  );
}

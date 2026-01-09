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
import { Client } from "@/types/client";
import ClientSelector from "@/components/shared/ClientSelector";

const transactionSchema = z.object({
  clientId: z.string().uuid("Selecciona un cliente"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
}

export default function TransactionForm({
  open,
  onClose,
  onSubmit,
}: TransactionFormProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const {
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      clientId: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedClient(null);
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: TransactionFormValues) => {
    await onSubmit(data);
    reset();
    setSelectedClient(null);
  };

  const labelCls = "block text-sm font-medium mb-1";
  const errCls = "text-sm text-red-600 mt-1";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Transacción</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Client Selector */}
          <div>
            <ClientSelector
              value={selectedClient?.id || ""}
              onChange={(clientId, client) => {
                setSelectedClient(client);
                setValue("clientId", clientId);
              }}
              error={errors.clientId?.message}
              label="Seleccionar Cliente (Requerido)"
              placeholder="Buscar cliente..."
            />
          </div>

          {selectedClient && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
              <p className="font-medium text-blue-900">{selectedClient.name}</p>
              <p className="text-blue-700 text-xs">
                Cédula: {selectedClient.nationalId}
              </p>
              <p className="text-blue-700 text-xs">Tel: {selectedClient.number}</p>
            </div>
          )}

          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm text-neutral-600">
            <p className="font-medium mb-1">Nota:</p>
            <p>
              Esta transacción se creará vacía. Después podrás vincular items
              (órdenes de bar, pagos, parkings, etc.) usando sus respectivas
              páginas.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !selectedClient}
              className="flex-1 rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? "Creando..." : "Crear Transacción"}
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

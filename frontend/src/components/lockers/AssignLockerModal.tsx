"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Client } from "@/types/client";
import ClientSelector from "@/components/shared/ClientSelector";
import Swal from "sweetalert2";

interface AssignLockerModalProps {
  open: boolean;
  onClose: () => void;
  lockerCode: string;
  onAssign: (clientId: string, client: Client, notes: string) => Promise<void>;
}

export default function AssignLockerModal({
  open,
  onClose,
  lockerCode,
  onAssign,
}: AssignLockerModalProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedClient(null);
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Debes seleccionar un cliente",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onAssign(selectedClient.id, selectedClient, notes);
      onClose();
    } catch (error) {
      // Error is handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Locker {lockerCode}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selector */}
          <div>
            <ClientSelector
              value={selectedClient?.id || ""}
              onChange={(clientId, client) => setSelectedClient(client)}
              label="Seleccionar Cliente"
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Notas (Opcional)
            </label>
            <textarea
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Información adicional..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-neutral-500 mt-1">
              {notes.length}/200 caracteres
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !selectedClient}
              className="flex-1 rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {submitting ? "Asignando..." : "Asignar Locker"}
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

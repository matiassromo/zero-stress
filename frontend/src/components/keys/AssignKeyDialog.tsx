// src/components/keys/AssignKeyDialog.tsx
"use client";

import { useState } from "react";
import type { LockerKey } from "@/types/lockerKey";
import { updateKey } from "@/lib/apiv2/keys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  keyItem: LockerKey | null;
  onAssigned: () => void;
}

export default function AssignKeyDialog({
  open,
  onOpenChange,
  keyItem,
  onAssigned,
}: Props) {
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!keyItem) return;
    if (!clientName.trim()) return;

    setSaving(true);
    try {
      await updateKey(keyItem.id, {
        available: false,
        lastAssignedClient: clientName.trim(),
        notes: notes || null,
      });
      onAssigned();
      setClientName("");
      setNotes("");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Asignar llave {keyItem ? keyItem.code : ""}
          </DialogTitle>
          <DialogDescription>
            Registra a quién se entrega esta llave de vestidor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">Nombre del cliente</label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Notas (opcional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Número de locker, comentarios..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !clientName.trim()}>
            Asignar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

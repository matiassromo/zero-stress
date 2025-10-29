// src/components/keys/AssignKeyDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { assignKey, LockerKey } from "@/lib/api/keys";

// Simula búsqueda de cuentas abiertas (reemplaza por tu API)
type PosAccountLite = { id: string; name: string };
async function searchOpenAccounts(q: string): Promise<PosAccountLite[]> {
  const mock = [
    { id: "A-001", name: "Matías Romo" },
    { id: "A-002", name: "Juan José Aráuz" },
  ];
  return mock.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()));
}

const Schema = z
  .object({
    accountId: z.string().optional(),
    assignedTo: z.string().trim().optional(),
    returnEta: z.string().optional(),
    notes: z.string().trim().optional(),
    attendant: z.string().trim().min(1, "Requerido"),
  })
  .refine((v) => !!v.accountId || !!v.assignedTo, {
    message: "Selecciona una cuenta o ingresa un nombre en 'Asignada a'",
    path: ["assignedTo"],
  });

type FormValues = z.infer<typeof Schema>;

function AssignKeyDialog({
  open,
  onOpenChange,
  keyItem,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  keyItem: LockerKey | null;
  onAssigned?: () => void;
}) {
  const [accounts, setAccounts] = useState<PosAccountLite[]>([]);
  const [q, setQ] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { attendant: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      attendant: "",
      accountId: undefined,
      assignedTo: "",
      notes: "",
      returnEta: "",
    });
    setAccounts([]);
    setQ("");
  }, [open, reset]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!q) {
        setAccounts([]);
        return;
      }
      const res = await searchOpenAccounts(q);
      if (active) setAccounts(res);
    })();
    return () => {
      active = false;
    };
  }, [q]);

  async function onSubmit(values: FormValues) {
    if (!keyItem) return;
    await assignKey(
      keyItem.code,
      values.accountId
        ? accounts.find((a) => a.id === values.accountId)?.name || "Cuenta"
        : values.assignedTo || "Sin nombre"
    );
    onAssigned?.();
    onOpenChange(false);
  }

  const selectedAccountId = watch("accountId");
  useEffect(() => {
    if (!selectedAccountId) return;
    const acc = accounts.find((a) => a.id === selectedAccountId);
    if (acc) setValue("assignedTo", acc.name);
  }, [selectedAccountId, accounts, setValue]);

  const title = keyItem ? `Asignar llave ${keyItem.code}` : "Asignar llave";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {keyItem?.zone} · Entrega: ahora
          </p>
        </DialogHeader>

        {/* Cuenta POS */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cuenta POS (opcional)</label>
          <Input
            placeholder="Busca una cuenta abierta…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {accounts.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-auto">
              {accounts.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => {
                    setValue("accountId", a.id);
                    setQ(`${a.name} (${a.id})`);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-muted"
                >
                  {a.name}{" "}
                  <span className="text-xs text-muted-foreground">· {a.id}</span>
                </button>
              ))}
            </div>
          )}
          <input type="hidden" {...register("accountId")} />
        </div>

        {/* Asignada a */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Asignada a</label>
          <Input
            placeholder="Nombre de la persona"
            {...register("assignedTo")}
          />
          {errors.assignedTo && (
            <p className="text-xs text-red-600">{errors.assignedTo.message}</p>
          )}
        </div>

        {/* Operación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Empleado que entrega</label>
            <Input placeholder="Ej. Juanjo" {...register("attendant")} />
            {errors.attendant && (
              <p className="text-xs text-red-600">
                {errors.attendant.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Devolución estimada (opcional)
            </label>
            <Input type="datetime-local" {...register("returnEta")} />
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Notas (opcional)</label>
          <Textarea
            rows={3}
            placeholder="Observaciones…"
            {...register("notes")}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? "Asignando…" : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignKeyDialog;

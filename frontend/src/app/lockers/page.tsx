"use client";

import { useEffect, useState, useMemo } from "react";
import { listKeys, updateKey } from "@/lib/apiv2/keys";
import type { Key } from "@/types/key";
import type { Client } from "@/types/client";
import AssignLockerModal from "@/components/lockers/AssignLockerModal";
import Swal from "sweetalert2";
import { toast } from "@/lib/ui/swal";
import { cn } from "@/lib/utils";

type LockerZone = "Hombres" | "Mujeres";

interface LockerKey {
  id: string;
  code: string;
  zone: LockerZone;
  available: boolean;
  assignedTo: string | null;
}

export default function LockersPage() {
  const [keys, setKeys] = useState<LockerKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<LockerKey | null>(null);

  async function loadKeys(silent = false) {
    if (!silent) setLoading(true);

    try {
      const raw: Key[] = await listKeys();
      const ordered = [...raw].sort((a, b) => a.id.localeCompare(b.id));

      const lockerKeys: LockerKey[] = ordered.map((k, index) => {
        const zone: LockerZone = index < 16 ? "Hombres" : "Mujeres";
        const indexInZone = zone === "Hombres" ? index + 1 : index - 16 + 1;
        const code = `${indexInZone}${zone === "Hombres" ? "H" : "M"}`;

        const client = k.lastAssignedClient ?? null;
        const note = (k as any).notes ?? null;
        const assigned =
          client && note ? `${client} · ${note}` : client || null;

        return {
          id: k.id,
          code,
          zone,
          available: k.available,
          assignedTo: assigned,
        };
      });

      setKeys(lockerKeys);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadKeys(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const hombres = useMemo(
    () => keys.filter((k) => k.zone === "Hombres"),
    [keys]
  );
  const mujeres = useMemo(
    () => keys.filter((k) => k.zone === "Mujeres"),
    [keys]
  );

  const libresH = hombres.filter((k) => k.available).length;
  const libresM = mujeres.filter((k) => k.available).length;

  const handleLockerClick = (locker: LockerKey) => {
    if (locker.available) {
      setSelectedLocker(locker);
      setShowAssignModal(true);
    } else {
      handleRelease(locker);
    }
  };

  const handleAssign = async (clientId: string, client: Client, notes: string) => {
    if (!selectedLocker) return;

    try {
      await updateKey(selectedLocker.id, {
        available: false,
        lastAssignedClient: client.name,
        notes: notes || null,
      });

      toast("success", `Locker ${selectedLocker.code} asignado a ${client.name}`);
      await loadKeys();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message ?? "No se pudo asignar el locker",
      });
      throw error;
    }
  };

  const handleRelease = async (locker: LockerKey) => {
    const res = await Swal.fire({
      icon: "question",
      title: `¿Liberar Locker ${locker.code}?`,
      text: locker.assignedTo
        ? `Asignado a: ${locker.assignedTo}`
        : "Este locker está ocupado",
      showCancelButton: true,
      confirmButtonText: "Sí, liberar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#10b981",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          await updateKey(locker.id, {
            available: true,
            lastAssignedClient: null,
            notes: null,
          });
        } catch (err: any) {
          Swal.showValidationMessage(err?.message ?? "Error liberando locker");
          throw err;
        }
      },
    });

    if (res.isConfirmed) {
      await loadKeys();
      toast("success", `Locker ${locker.code} liberado`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Lockers</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-neutral-600">
            32 lockers totales · {libresH + libresM} disponibles
          </div>
          <button
            onClick={() => loadKeys()}
            disabled={loading}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Grids by Zone */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hombres */}
        <LockerPanel
          title="Lockers Hombres (1H - 16H)"
          hint={`${libresH} lockers disponibles`}
          list={hombres}
          loading={loading}
          badgeClass="bg-blue-100 text-blue-700"
          onLockerClick={handleLockerClick}
        />

        {/* Mujeres */}
        <LockerPanel
          title="Lockers Mujeres (1M - 16M)"
          hint={`${libresM} lockers disponibles`}
          list={mujeres}
          loading={loading}
          badgeClass="bg-pink-100 text-pink-700"
          onLockerClick={handleLockerClick}
        />
      </div>

      {/* Assign Modal */}
      {selectedLocker && (
        <AssignLockerModal
          open={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedLocker(null);
          }}
          lockerCode={selectedLocker.code}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

/* ---------------- UI Components ---------------- */

function LockerPanel({
  title,
  hint,
  list,
  loading,
  badgeClass,
  onLockerClick,
}: {
  title: string;
  hint: string;
  list: LockerKey[];
  loading: boolean;
  badgeClass: string;
  onLockerClick: (locker: LockerKey) => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={cn("px-2 py-1 rounded-full text-xs", badgeClass)}>
            Vestidor
          </span>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      </div>
      <p className="text-sm text-neutral-500 mb-4">{hint}</p>

      <div className="grid grid-cols-4 gap-3">
        {list
          .sort((a, b) => parseInt(a.code) - parseInt(b.code))
          .map((locker) => (
            <LockerCard
              key={locker.id}
              locker={locker}
              onClick={() => onLockerClick(locker)}
            />
          ))}
        {loading && (
          <div className="col-span-4 text-sm text-neutral-500">
            Cargando…
          </div>
        )}
      </div>
    </div>
  );
}

function LockerCard({
  locker,
  onClick,
}: {
  locker: LockerKey;
  onClick: () => void;
}) {
  const occupied = !locker.available;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "aspect-[1/1] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 hover:shadow-md",
        occupied
          ? "bg-red-50 border-red-200 hover:bg-red-100"
          : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
      )}
      title={
        occupied
          ? `Ocupado: ${locker.assignedTo ?? ""}. Click para liberar`
          : "Libre. Click para asignar"
      }
    >
      <div className="text-lg font-semibold">{locker.code}</div>
      <div
        className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          occupied
            ? "bg-red-100 text-red-700"
            : "bg-emerald-100 text-emerald-700"
        )}
      >
        {occupied ? "Ocupado" : "Libre"}
      </div>
      {occupied && locker.assignedTo && (
        <div className="text-[10px] text-neutral-600 line-clamp-1 px-1 text-center">
          {locker.assignedTo}
        </div>
      )}
    </button>
  );
}

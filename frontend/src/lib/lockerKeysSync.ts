// src/lib/lockerKeysSync.ts
import { listKeys, updateKey } from "@/lib/apiv2/keys";
import type { Key } from "@/types/key";
import type { LockerZone } from "@/types/lockerKey";

function buildCodeFromIndex(index: number): { code: string; zone: LockerZone } {
  const zone: LockerZone = index < 16 ? "Hombres" : "Mujeres";
  const indexInZone = zone === "Hombres" ? index + 1 : index - 16 + 1;
  const code = `${indexInZone}${zone === "Hombres" ? "H" : "M"}`;
  return { code, zone };
}

// Mapea códigos "16M", "1H" -> ids reales de Key en el backend
async function getKeyIdsByCodes(codes: string[]): Promise<string[]> {
  const raw: Key[] = await listKeys();
  const ordered = [...raw].sort((a, b) => a.id.localeCompare(b.id));

  const mapCodeToId: Record<string, string> = {};
  ordered.forEach((k, index) => {
    const { code } = buildCodeFromIndex(index);
    mapCodeToId[code] = k.id;
  });

  return codes
    .map((c) => mapCodeToId[c])
    .filter((id): id is string => !!id);
}

// Marcar llaves como ocupadas desde el POS
export async function occupyLockerKeys(codes: string[], clientName: string) {
  const ids = await getKeyIdsByCodes(codes);
  await Promise.all(
    ids.map((id) =>
      updateKey(id, {
        available: false,
        lastAssignedClient: clientName,
        notes: null,
      })
    )
  );
}

// Marcar llaves como libres (devolver llaves)
export async function releaseLockerKeys(codes: string[]) {
  const ids = await getKeyIdsByCodes(codes);
  await Promise.all(
    ids.map((id) =>
      updateKey(id, {
        available: true,
        lastAssignedClient: null,
        notes: null,
      })
    )
  );
}

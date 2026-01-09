// src/lib/api/accessCards.ts
import type { AccessCard, AccessCardRequestDto } from "@/types/accessCard";
import { http, HttpError } from "./http";

/**
 * Backend real (Swagger):
 * - Request: { transactionId, total }
 * - Response: no garantizado en swagger; normalizamos defensivo.
 */

const ENDPOINT = "/api/AccessCards";

export async function listAccessCards(): Promise<AccessCard[]> {
  try {
    const dtos = await http<any[]>(ENDPOINT);
    return (dtos ?? []).map(normalize);
  } catch (err) {
    // Si el backend revienta (500 por SQL), no mates la pantalla
    if (err instanceof HttpError && err.status >= 500) return [];
    throw err;
  }
}

export async function getAccessCard(id: string): Promise<AccessCard | null> {
  try {
    const dto = await http<any>(`${ENDPOINT}/${id}`);
    return dto ? normalize(dto) : null;
  } catch (err: any) {
    if (err instanceof HttpError && err.status === 404) return null;
    if (err instanceof HttpError && err.status >= 500) return null;
    throw err;
  }
}

export async function createAccessCard(
  input: AccessCardRequestDto
): Promise<AccessCard> {
  const payload = toRequest(input);

  const dto = await http<any>(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalize(dto);
}

export async function updateAccessCard(
  id: string,
  input: AccessCardRequestDto
): Promise<AccessCard> {
  const payload = toRequest(input);

  const dto = await http<any>(`${ENDPOINT}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return normalize(dto);
}

export async function deleteAccessCard(id: string): Promise<void> {
  await http<void>(`${ENDPOINT}/${id}`, { method: "DELETE" });
}

/**
 * Convierte lo que tu front maneje a lo que el backend acepta (Swagger)
 * Swagger AccessCardRequestDto: { transactionId?: uuid, total?: number }
 */
function toRequest(input: AccessCardRequestDto): {
  transactionId?: string;
  total?: number;
} {
  return {
    transactionId: (input as any).transactionId ?? (input as any).TransactionId,
    total: (input as any).total ?? (input as any).Total,
  };
}

/**
 * Normaliza la respuesta del backend a tu tipo AccessCard.
 * Importante:
 * - `uses` NO está en Swagger. Por defecto lo dejamos en 0.
 *   (en UI debes derivarlo desde EntranceAccessCards si quieres real)
 */
function normalize(dto: any): AccessCard {
  const id = dto?.id ?? dto?.Id ?? dto?.accessCardId ?? dto?.AccessCardId;

  return {
    id: String(id ?? ""),
    total: Number(dto?.total ?? dto?.Total ?? 0),
    uses: Number(dto?.uses ?? dto?.Uses ?? 0),
    transactionId: dto?.transactionId ?? dto?.TransactionId ?? null,
    // holderName no existe en Swagger; lo dejamos si algún día aparece
    holderName: dto?.holderName ?? dto?.HolderName,
  };
}

export default {
  listAccessCards,
  getAccessCard,
  createAccessCard,
  updateAccessCard,
  deleteAccessCard,
};

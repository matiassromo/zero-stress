// src/lib/api/accessCards.ts
import { AccessCard, AccessCardRequestDto } from "@/types/accessCard";
import { http } from "./http";

/**
 * Retrieves all access cards from the backend
 * @returns Promise<AccessCard[]> - Array of all access cards
 */
export async function listAccessCards(): Promise<AccessCard[]> {
  const dtos = await http<any[]>(`/api/AccessCards`);
  return dtos.map(normalize);
}

/**
 * Retrieves a single access card by ID
 * @param id - The UUID of the access card to retrieve
 * @returns Promise<AccessCard | null> - The access card or null if not found
 */
export async function getAccessCard(id: string): Promise<AccessCard | null> {
  try {
    const dto = await http<any>(`/api/AccessCards/${id}`);
    return dto ? normalize(dto) : null;
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
}

/**
 * Creates a new access card
 * @param input - The access card data to create
 * @returns Promise<AccessCard> - The newly created access card
 */
export async function createAccessCard(
  input: AccessCardRequestDto
): Promise<AccessCard> {
  const dto = await http<any>(`/api/AccessCards`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalize(dto);
}

/**
 * Updates an existing access card
 * @param id - The UUID of the access card to update
 * @param input - The updated access card data
 * @returns Promise<AccessCard> - The updated access card
 */
export async function updateAccessCard(
  id: string,
  input: AccessCardRequestDto
): Promise<AccessCard> {
  const dto = await http<any>(`/api/AccessCards/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return normalize(dto);
}

/**
 * Deletes an access card
 * @param id - The UUID of the access card to delete
 * @returns Promise<void>
 */
export async function deleteAccessCard(id: string): Promise<void> {
  await http<void>(`/api/AccessCards/${id}`, { method: "DELETE" });
}

/**
 * Normalizes the backend DTO to the frontend AccessCard interface
 * Handles both PascalCase (C#) and camelCase property names
 * @param dto - The raw DTO from the backend
 * @returns AccessCard - The normalized access card object
 */
function normalize(dto: any): AccessCard {
  return {
    id: dto.id ?? dto.Id,
    transactionId: dto.transactionId ?? dto.TransactionId ?? null,
    total: dto.total ?? dto.Total ?? 0,
    uses: dto.uses ?? dto.Uses ?? 0,
    // si el backend algún día manda el titular, lo mapeamos;
    // si no, quedará undefined
    holderName: dto.holderName ?? dto.HolderName,
  };
}

export default {
  listAccessCards,
  getAccessCard,
  createAccessCard,
  updateAccessCard,
  deleteAccessCard,
};

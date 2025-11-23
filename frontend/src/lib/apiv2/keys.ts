import { Key, KeyRequestDto } from "@/types/key";
import { http } from "./http";

/**
 * Retrieves all keys from the backend
 * @returns Promise<Key[]> Array of all keys
 */
export async function listKeys(): Promise<Key[]> {
  const dtos = await http<any[]>(`/api/Keys`);
  return dtos.map(normalize);
}

/**
 * Retrieves a single key by ID
 * @param id - The UUID of the key to retrieve
 * @returns Promise<Key | null> The key if found, null if not found
 */
export async function getKeyById(id: string): Promise<Key | null> {
  try {
    const dto = await http<any>(`/api/Keys/${id}`);
    return dto ? normalize(dto) : null;
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
}

/**
 * Updates an existing key
 * @param id - The UUID of the key to update
 * @param input - The updated key data
 * @returns Promise<Key> The updated key
 */
export async function updateKey(id: string, input: KeyRequestDto): Promise<Key> {
  const dto = await http<any>(`/api/Keys/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return normalize(dto);
}

/**
 * Normalizes backend DTO to frontend Key type
 * Handles both PascalCase (C# style) and camelCase property names
 * @param dto - Raw DTO from backend
 * @returns Key Normalized key object
 */
function normalize(dto: any): Key {
  return {
    id: dto.id ?? dto.Id,
    available: dto.available ?? dto.Available ?? false,
    notes: dto.notes ?? dto.Notes ?? null,
    lastAssignedClient: dto.lastAssignedClient ?? dto.LastAssignedClient ?? null,
  } as Key;
}

export default {
  listKeys,
  getKeyById,
  updateKey,
};

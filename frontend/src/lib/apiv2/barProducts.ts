import { BarProduct, BarProductRequestDto } from "@/types/barProduct";
import { http } from "./http";

/**
 * Retrieves all bar products from the backend
 * @returns Promise<BarProduct[]> Array of all bar products
 */
export async function listBarProducts(): Promise<BarProduct[]> {
  const dtos = await http<any[]>(`/api/BarProducts`);
  return dtos.map(normalize);
}

/**
 * Retrieves a single bar product by ID
 * @param id - The UUID of the bar product to retrieve
 * @returns Promise<BarProduct | null> The bar product if found, null if not found
 */
export async function getBarProduct(id: string): Promise<BarProduct | null> {
  try {
    const dto = await http<any>(`/api/BarProducts/${id}`);
    return dto ? normalize(dto) : null;
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
}

/**
 * Creates a new bar product
 * @param input - The bar product data (name, qty, unitPrice)
 * @returns Promise<BarProduct> The created bar product
 */
export async function createBarProduct(input: BarProductRequestDto): Promise<BarProduct> {
  const dto = await http<any>(`/api/BarProducts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalize(dto);
}

/**
 * Updates an existing bar product
 * @param id - The UUID of the bar product to update
 * @param input - The updated bar product data
 * @returns Promise<BarProduct> The updated bar product
 */
export async function updateBarProduct(id: string, input: BarProductRequestDto): Promise<BarProduct> {
  const dto = await http<any>(`/api/BarProducts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return normalize(dto);
}

/**
 * Deletes a bar product
 * @param id - The UUID of the bar product to delete
 * @returns Promise<void>
 */
export async function deleteBarProduct(id: string): Promise<void> {
  await http<void>(`/api/BarProducts/${id}`, { method: "DELETE" });
}

/**
 * Normalizes backend DTO to frontend BarProduct type
 * Handles both PascalCase (C# style) and camelCase property names
 * @param dto - Raw DTO from backend
 * @returns BarProduct Normalized bar product object
 */
function normalize(dto: any): BarProduct {
  return {
    id: dto.id ?? dto.Id,
    name: dto.name ?? dto.Name,
    qty: dto.qty ?? dto.Qty,
    unitPrice: dto.unitPrice ?? dto.UnitPrice,
  } as BarProduct;
}

export default {
  listBarProducts,
  getBarProduct,
  createBarProduct,
  updateBarProduct,
  deleteBarProduct,
};

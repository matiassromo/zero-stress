import { Payment, PaymentRequestDto } from "@/types/payment";
import { http } from "./http";

/**
 * Retrieves all payments from the backend
 * @returns Promise<Payment[]> Array of all payments
 */
export async function listPayments(): Promise<Payment[]> {
  const dtos = await http<any[]>(`/api/Payments`);
  return dtos.map(normalize);
}

/**
 * Retrieves a single payment by ID
 * @param id - The UUID of the payment to retrieve
 * @returns Promise<Payment | null> The payment if found, null if not found
 */
export async function getPayment(id: string): Promise<Payment | null> {
  try {
    const dto = await http<any>(`/api/Payments/${id}`);
    return dto ? normalize(dto) : null;
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
}

/**
 * Creates a new payment
 * @param input - The payment data (total, type, transactionId)
 * @returns Promise<Payment> The created payment
 */
export async function createPayment(input: PaymentRequestDto): Promise<Payment> {
  const dto = await http<any>(`/api/Payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalize(dto);
}

/**
 * Updates an existing payment
 * @param id - The UUID of the payment to update
 * @param input - The updated payment data
 * @returns Promise<Payment> The updated payment
 */
export async function updatePayment(id: string, input: PaymentRequestDto): Promise<Payment> {
  const dto = await http<any>(`/api/Payments/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return normalize(dto);
}

/**
 * Deletes a payment
 * @param id - The UUID of the payment to delete
 * @returns Promise<void>
 */
export async function deletePayment(id: string): Promise<void> {
  await http<void>(`/api/Payments/${id}`, { method: "DELETE" });
}

/**
 * Normalizes backend DTO to frontend Payment type
 * Handles both PascalCase (C# style) and camelCase property names
 * @param dto - Raw DTO from backend
 * @returns Payment Normalized payment object
 */
function normalize(dto: any): Payment {
  return {
    id: dto.id ?? dto.Id,
    createdAt: dto.createdAt ?? dto.CreatedAt,
    total: dto.total ?? dto.Total,
    type: dto.type ?? dto.Type,
    transactionId: dto.transactionId ?? dto.TransactionId,
  } as Payment;
}

export default {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
};

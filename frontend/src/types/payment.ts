/**
 * Payment type enum
 * 0 = Efectivo (cash)
 * 1 = Transferencia (transfer)
 */
export enum PaymentType {
  Efectivo = 0,
  Transferencia = 1
}

/**
 * Payment entity represents a payment record in the system
 */
export interface Payment {
  id: string;
  createdAt: string;
  total: number;
  type: PaymentType;
  transactionId: string;
}

/**
 * Request DTO for creating or updating a payment
 */
export interface PaymentRequestDto {
  total: number;
  type: PaymentType;
  transactionId: string;
}

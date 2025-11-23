/**
 * Payment entity represents a payment record in the system
 */
export interface Payment {
  id: string;
  createdAt: string;
  total: number;
}

/**
 * Request DTO for creating or updating a payment
 */
export interface PaymentRequestDto {
  total: number;
}

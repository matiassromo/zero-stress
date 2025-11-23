import { Client } from "./client"
import { Payment } from "./payment";

/**
 * Transaction entity represents a transaction record linking a client to a transaction item (parking, accessCard, barOrder, entranceTransaction) and optionally a payment
 */
export interface Transaction {
  id: string;
  createdAt: string;
  client: Client;
  transactionItem: any;
  payment: Payment;
}

/**
 * Request DTO for creating or updating a transaction
 * Note: A TransactionItem is either a parking, accessCard, barOrder, entranceTransaction, or parking entity
 */
export interface TransactionRequestDto {
  clientId: string;
  transactionItemId: string;
  paymentId?: string | null;
}

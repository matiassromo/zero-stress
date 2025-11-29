import { BarProduct } from "./barProduct";

/**
 * Estado de la orden de bar
 */
export type BarOrderStatus = "Pendiente" | "Entregado";

/**
 * Represents a bar order in the system
 */
export interface BarOrder {
  id: string;
  /** Fecha/hora de creación (OrderDate en el backend) */
  orderDate?: string;
  /** Total calculado en backend (opcional) */
  total?: number;
  /** Id de la cuenta POS asociada (si aplica) */
  accountId?: string | null;
  /** Estado de preparación/entrega */
  status?: BarOrderStatus;
  /** Detalles de la orden */
  details?: BarOrderDetail[];
}

/**
 * Represents a detail item within a bar order
 */
export interface BarOrderDetail {
  unitPrice: number;
  qty: number;
  barProduct: BarProduct;
}

/**
 * Request DTO for creating a bar order detail
 * All fields are required as per the OpenAPI schema
 */
export interface BarOrderDetailCreateRequestDto {
  barProductId: string;
  unitPrice: number;
  qty: number;
}

/**
 * Request DTO for updating a bar order detail
 * Both fields are optional as per the OpenAPI schema
 */
export interface BarOrderDetailUpdateRequestDto {
  unitPrice?: number;
  qty?: number;
}

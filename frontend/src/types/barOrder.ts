import { BarProduct } from "./barProduct";

/**
 * Type definitions for BarOrder entity
 * Based on OpenAPI schema for BarOrders
 */

/**
 * Represents a bar order in the system
 */
export interface BarOrder {
  id: string;
  total?: number;
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

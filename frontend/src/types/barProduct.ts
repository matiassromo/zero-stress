/**
 * Type definitions for BarProduct entity
 * Based on OpenAPI schema: BarProductRequestDto
 */

/**
 * Represents a bar product in the system
 */
export interface BarProduct {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

/**
 * Request DTO for creating or updating a bar product
 * All fields are required as per the OpenAPI schema
 */
export interface BarProductRequestDto {
  name: string;
  qty: number;
  unitPrice: number;
}

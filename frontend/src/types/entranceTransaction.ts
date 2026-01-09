/**
 * EntranceTransaction entity type definitions
 * Based on OpenAPI schema: EntranceTransactionRequestDto
 */

/**
 * Represents an EntranceTransaction entity in the system
 * Tracks entrance transactions with visitor counts and timing information
 */
export interface EntranceTransaction {
  id: string;
  transactionId?: string | null;
  total: number;
  entranceDate?: string;
  entranceEntryTime?: string;
  entranceExitTime?: string | null;
  numberAdults?: number;
  numberChildren?: number;
  numberSeniors?: number;
  numberDisabled?: number;
}

/**
 * Request DTO for creating or updating an EntranceTransaction
 * Matches the EntranceTransactionRequestDto schema from the backend
 */
export interface EntranceTransactionRequestDto {
  transactionId?: string | null;
  entranceDate?: string;
  entranceEntryTime?: string;
  entranceExitTime?: string | null;
  numberAdults?: number;
  numberChildren?: number;
  numberSeniors?: number;
  numberDisabled?: number;
}

/**
 * Parking entity type definitions
 * Based on OpenAPI schema: ParkingRequestDto
 */

/**
 * Represents a Parking entity in the system
 */
export interface Parking {
  id: string;
  transactionId?: string | null;
  parkingDate: string;
  parkingEntryTime: string;
  parkingExitTime?: string | null;
}

/**
 * Request DTO for creating or updating a Parking record
 */
export interface ParkingRequestDto {
  transactionId?: string | null;
  parkingDate?: string;
  parkingEntryTime?: string;
  parkingExitTime?: string | null;
}

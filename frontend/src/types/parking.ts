/**
 * Parking entity type definitions
 * Based on OpenAPI schema: ParkingRequestDto
 */

/**
 * Represents a Parking entity in the system
 */
export interface Parking {
  id: string;
  parkingDate: string;
  parkingEntryTime: string;
  parkingExitTime?: string | null;
}

/**
 * Request DTO for creating or updating a Parking record
 * Matches the ParkingRequestDto schema from the backend
 */
export interface ParkingRequestDto {
  parkingDate?: string;
  parkingEntryTime?: string;
  parkingExitTime?: string | null;
}

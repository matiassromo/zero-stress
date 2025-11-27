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

  // NUEVO - nombre del cliente que usa el parqueadero
  clientName: string;
}

/**
 * Request DTO for creating or updating a Parking record
 */
export interface ParkingRequestDto {
  parkingDate?: string;
  parkingEntryTime?: string;
  parkingExitTime?: string | null;

  // NUEVO - opcional en creación/actualización
  clientName?: string;
}

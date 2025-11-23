/**
 * EntranceAccessCard entity type definitions
 * Based on OpenAPI schema: EntranceAccessCardRequestDto
 */

/**
 * Represents an EntranceAccessCard entity in the system
 * Links an access card to an entrance with entry and exit times
 */
export interface EntranceAccessCard {
  id: string;
  accessCardId?: string;
  entranceDate?: string;
  entranceEntryTime?: string;
  entranceExitTime?: string | null;
}

/**
 * Request DTO for creating or updating an EntranceAccessCard
 * Matches the EntranceAccessCardRequestDto schema from the backend
 */
export interface EntranceAccessCardRequestDto {
  accessCardId?: string;
  entranceDate?: string;
  entranceEntryTime?: string;
  entranceExitTime?: string | null;
}

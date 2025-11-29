// src/types/accessCard.ts

/**
 * Represents an AccessCard entity in the system
 */
export interface AccessCard {
  id: string;
  total: number;
  uses: number;
  holderName?: string; // titular del pase (si el backend lo manda)
}

/**
 * Request DTO for creating or updating an AccessCard
 * Matches (y extiende) el AccessCardRequestDto del backend
 */
export interface AccessCardRequestDto {
  total?: number;
  uses?: number;        // usos disponibles
  holderName?: string;  // nombre del titular (el backend lo puede ignorar)
}

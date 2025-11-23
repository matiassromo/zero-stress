/**
 * AccessCard entity type definitions
 * Based on OpenAPI schema: AccessCardRequestDto
 */

/**
 * Represents an AccessCard entity in the system
 */
export interface AccessCard {
  id: string;
  total: number;
  uses: number;
}

/**
 * Request DTO for creating or updating an AccessCard
 * Matches the AccessCardRequestDto schema from the backend
 */
export interface AccessCardRequestDto {
  total?: number;
}

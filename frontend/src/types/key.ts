import { Client } from "./client";

/**
 * Represents a Key entity from the backend
 */
export interface Key {
  id: string;
  available: boolean;
  notes?: string | null;
  lastAssignedClient?: Client | null;
}

/**
 * Request DTO for updating a Key
 */
export interface KeyRequestDto {
  lastAssignedTo?: string | null;
  available: boolean;
  notes?: string | null;
}

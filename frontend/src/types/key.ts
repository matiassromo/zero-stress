// src/types/key.ts

// Lo que realmente devuelve el backend
export interface Key {
  id: string;
  available: boolean;
  notes: string | null;
  lastAssignedClient: string | null;
}

// Lo que puedes enviar en el PUT / POST
export interface KeyRequestDto {
  available?: boolean;
  notes?: string | null;
  lastAssignedClient?: string | null;
}

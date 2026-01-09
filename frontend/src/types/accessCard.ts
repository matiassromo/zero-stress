// src/types/accessCard.ts

export interface AccessCard {
  id: string;
  total: number;
  uses: number;
  holderName?: string;
}

export interface AccessCardRequestDto {
  total?: number;
  uses?: number;
  holderName?: string;
}

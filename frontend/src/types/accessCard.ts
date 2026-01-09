// src/types/accessCard.ts

export interface AccessCard {
  id: string;
  transactionId?: string | null;
  total: number;
  uses: number;
  holderName?: string;
}

export interface AccessCardRequestDto {
  transactionId?: string | null;
  total?: number;
  uses?: number;
  holderName?: string;
}

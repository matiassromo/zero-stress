export type PassStatus = "Active" | "Suspended" | "Expired";

export interface PassCard {
  id: string;
  clientId?: string | null;
  holderName: string;
  documentId?: string | null; // cédula
  email?: string | null;
  cardNumber: string;
  totalUses: number;
  remainingUses: number;
  status: PassStatus;
  validFrom?: string | null;
  validTo?: string | null;
  notes?: string | null;
  createdAt: string;
  purchaseDate?: string | null;  // fecha de compra
  amountPaid?: number | null;    // valor pagado
  lastUsedAt?: string | null;
}

export type PassTxType =
  | "Create" | "Use" | "Recharge" | "Adjust" | "Suspend" | "Reactivate" | "Expire" | "ManualAdd" | "Renew";

export interface PassTransaction {
  id: string;
  passCardId: string;
  type: PassTxType;
  quantity: number;        // negativos para uso
  persons?: number | null; // # personas en ese uso (para historial)
  label?: string | null;   // Ej. "Entrada Normal", "Entrada Pase"
  accountId?: string | null;
  performedBy: string;
  comment?: string | null;
  createdAt: string;
}

export interface PassDetailResponse {
  card: PassCard;
  transactions: PassTransaction[];
}

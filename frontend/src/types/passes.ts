export type PassStatus = "Active" | "Suspended" | "Expired";

export interface PassCard {
  id: string;
  clientId?: string | null;
  holderName: string;
  cardNumber: string;
  totalUses: number;
  remainingUses: number;
  status: PassStatus;
  validFrom?: string | null;
  validTo?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type PassTxType =
  | "Create"
  | "Use"
  | "Recharge"
  | "Adjust"
  | "Suspend"
  | "Reactivate"
  | "Expire";

export interface PassTransaction {
  id: string;
  passCardId: string;
  type: PassTxType;
  quantity: number; // negativos para uso
  accountId?: string | null;
  performedBy: string;
  comment?: string | null;
  createdAt: string;
}

export interface PassDetailResponse {
  card: PassCard;
  transactions: PassTransaction[];
}

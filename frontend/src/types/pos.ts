// src/types/pos.ts
export const PosRates = {
  adult: 7,
  kid: 4,
  senior: 5,
  disabled: 5,
  companion: 1,
  passPrice: 55,
  passUses: 10,
} as const;

export type PosEntryType = "normal" | "pass";

export type KeyGender = "H" | "M"; // Hombres / Mujeres

export interface PosKey {
  id: string;        // backend id o uuid
  number: number;    // 1..16
  gender: KeyGender; // "H" | "M"
  available: boolean;
}

export interface SelectedKey {
  keyId: string;
  number: number;    // para mostrar 5H, 2M
  gender: KeyGender;
  duration: "1H" | "8H" | "2M";
}

export interface NormalEntryBreakdown {
  A: number;   // Adulto
  N: number;   // Niño
  TE: number;  // Tercera edad
  D: number;   // Discapacidad
  AC: number;  // Acompañante
}

export interface PassInfo {
  id: string;
  holderName: string;
  remaining: number; // 0..10
  active: boolean;
}

export type Product = {
  id: string;
  name: string;
  price: number; // USD
  sku?: string;
  tags?: string[];
};

export type CartItem = {
  product: Product;
  qty: number;
};

export type PosState = {
  items: CartItem[];
  total: number;
};

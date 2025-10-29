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

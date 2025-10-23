export type ClientId = string;

export interface Client {
  id: ClientId;
  nationalId: string;
  name: string;
  email: string;
  address: string;
  number: string;     // <- clave alineada con el backend
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Client {
  id: string;
  nationalId: string;
  name: string;
  email: string;
  address: string;
  number: string;
}

export interface ClientRequestDto {
  nationalId: string;
  name: string;
  email: string;
  address: string;
  number: string;
}
import type { Currency } from './enums';

export type OwnerPropertyOutput = {
  id: number;
  name: string;
  address: string;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors: number;
  status: string;
  tariff: string;
  ask_price: string;
  ask_currency: Currency;
  owner_guaranteed_price: string;
  owner_guaranteed_currency: Currency;
  tenant_charge_price: string;
  tenant_charge_currency: Currency;
  vacant_since: string | null;
  vacant_days: number;
  created_at: string;
  updated_at: string;
};

export type OwnerEarningsOutput = {
  total_guaranteed: string;
  total_paid: string;
  total_pending: string;
  currency: Currency;
};

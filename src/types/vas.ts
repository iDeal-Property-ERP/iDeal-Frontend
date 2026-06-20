import type { Currency, VASOrderStatus, VASServiceType } from './enums';

export type ServiceCatalogItemOutput = {
  id: number;
  service_type: VASServiceType;
  name: string;
  partner_name: string | null;
  description: string | null;
  base_price: string;
  currency: Currency;
  commission_rate: string;
  cashback_rate: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceCatalogItemCreatePayload = {
  service_type?: VASServiceType;
  name: string;
  partner_name?: string;
  description?: string;
  base_price: string;
  currency?: Currency;
  commission_rate?: string;
  cashback_rate?: string;
  is_active?: boolean;
};

export type ServiceOrderOutput = {
  id: number;
  catalog_item_id: number;
  catalog_item_name: string;
  tenant_id: number;
  property_id: number;
  lease_id: number | null;
  status: VASOrderStatus;
  cost: string;
  currency: Currency;
  commission_earned: string;
  cashback_amount: string;
  scheduled_for: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

import type { Currency, VASOrderStatus, VASServiceType } from './enums';

export type VASTranslationItem = {
  name?: string | null;
  description?: string | null;
};

export type VASTranslationMap = {
  en?: VASTranslationItem;
  uz?: VASTranslationItem;
  ru?: VASTranslationItem;
};

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
  translations?: VASTranslationMap | null;
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
  translations?: VASTranslationMap | null;
};

export type ServiceOrderOutput = {
  id: number;
  catalog_item_id: number;
  catalog_item_name: string;
  service_type: VASServiceType;
  partner_name: string | null;
  tenant_id: number;
  tenant_name: string;
  property_id: number;
  property_name: string;
  lease_id: number | null;
  status: VASOrderStatus;
  cost: string;
  currency: Currency;
  commission_earned: string;
  cashback_amount: string;
  scheduled_for: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceOrderCreatePayload = {
  catalog_item_id: number;
  tenant_id: number;
  property_id: number;
  lease_id?: number;
  cost?: string;
  scheduled_for?: string;
  notes?: string;
};

export type VasOrderStats = {
  new: number;
  revenue_30d: string;
  commission_30d: string;
  catalog_count: number;
  partners_count: number;
  counts: {
    requested: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    all: number;
  };
};

export type VasPartnerRow = {
  partner_name: string;
  service_types: VASServiceType[];
  services_count: number;
  orders_total: number;
  commission_30d: string;
};

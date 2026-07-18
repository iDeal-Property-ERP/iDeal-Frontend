import type { PropertyStatus, Tariff, Currency } from './enums';

export type DistrictOutput = {
  id: number;
  name: string;
  city: string;
};

export type OwnerBrief = {
  id: number;
  first_name: string;
  last_name: string;
};

export type PropertyOutput = {
  id: number;
  name: string;
  address: string;
  district: DistrictOutput;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors: number | null;
  owner: OwnerBrief;
  status: PropertyStatus;
  score: string;
  map_lat: string | null;
  map_lon: string | null;
  description: string | null;
  tariff: Tariff;
  ask_price: string;
  ask_currency: Currency;
  owner_guaranteed_price: string;
  owner_guaranteed_currency: Currency;
  tenant_charge_price: string;
  tenant_charge_currency: Currency;
  vacant_since: string | null;
  vacant_days: number;
  // The detail endpoint returns the property's photos (primary-first ordering).
  photos: PropertyPhoto[];
  created_at: string;
  updated_at: string;
};

export type PropertyPhoto = {
  id: number;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
};

export type VerificationVisit = {
  id: number;
  scheduled_for: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  completed_at: string | null;
  notes: string;
};

export type OneOffDealDetail = {
  id: number;
  seller_name: string;
  seller_phone: string;
  seller_email: string | null;
  channel: 'marketplace' | 'off_market';
  status: 'draft' | 'active' | 'paused' | 'closed_won' | 'closed_lost' | 'archived';
  commission_type: 'none' | 'fixed' | 'percentage';
  commission_fixed_amount: string | null;
  commission_percentage: string | null;
  commission_currency: Currency;
  close_date: string | null;
  receipt_recorded: boolean;
};

/**
 * The management property detail shape. Publish-required fields are nullable
 * because a DRAFT can be saved partially; includes photos, verification, and the
 * derived `is_verified` flag. Distinct from {@link PropertyOutput} (the legacy,
 * always-complete shape) so legacy pages stay untouched.
 */
export type PropertyDetail = {
  id: number;
  name: string;
  address: string;
  district: DistrictOutput | null;
  rooms: number | null;
  area_sqm: number | null;
  floor: number | null;
  total_floors: number | null;
  owner: OwnerBrief | null;
  engagement_type: 'managed' | 'one_off';
  status: PropertyStatus | 'draft' | 'pending_review';
  is_verified: boolean;
  score: string;
  map_lat: string | null;
  map_lon: string | null;
  description: string | null;
  tariff: Tariff;
  ask_price: string | null;
  ask_currency: Currency;
  owner_guaranteed_price: string | null;
  owner_guaranteed_currency: Currency;
  tenant_charge_price: string | null;
  tenant_charge_currency: Currency;
  vacant_since: string | null;
  vacant_days: number;
  photos: PropertyPhoto[];
  verification: VerificationVisit | null;
  one_off_deal: OneOffDealDetail | null;
  created_at: string;
  updated_at: string;
};

export type PropertyCreatePayload = {
  name: string;
  address: string;
  district_id: number;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors?: number;
  owner_id: number;
  status?: PropertyStatus;
  score?: string;
  map_lat?: string;
  map_lon?: string;
  description?: string;
  tariff?: Tariff;
  ask_price: string;
  ask_currency?: Currency;
  owner_guaranteed_price: string;
  owner_guaranteed_currency?: Currency;
  tenant_charge_price: string;
  tenant_charge_currency?: Currency;
  vacant_since?: string;
  vacant_days?: number;
};

export type PropertyUpdatePayload = Partial<PropertyCreatePayload>;

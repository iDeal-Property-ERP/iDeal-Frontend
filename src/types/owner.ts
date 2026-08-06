import type { Currency, OnboardingStatus } from './enums';

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
  vacant_since: string | null;
  vacant_days: number;
  created_at: string;
  updated_at: string;
};

export type OwnerEarningsOutput = {
  total_guaranteed: string;
  total_paid: string;
  total_pending: string;
  total_above_guarantee: string;
  next_payout_amount: string;
  currency: Currency;
};

export type OwnerSettlementOutput = {
  id: number;
  property_name: string;
  period_start: string;
  period_end: string;
  gross_floor_amount: string;
  commission_rate: string;
  currency: Currency;
  rent_received_amount: string;
  settlement_base_amount: string;
  commission_amount: string;
  owner_payout_amount: string;
  ideal_cash_exposure: string;
  payout_status: string | null;
  payout_amount: string | null;
  payout_kind: string | null;
};

export type OwnerWhyOutput = {
  title: string;
  description: string;
  benefits: string[];
};

export type PublicOfferOutput = {
  id: number | null;
  version: string | null;
  body: string | null;
};

export type OwnerOnboardingOutput = {
  id: number;
  owner_id: number;
  property_id: number;
  property_name: string;
  status: OnboardingStatus;
  offer_version: string | null;
  offer_accepted_at: string | null;
  review_notes: string | null;
  generated_agreement_id: number | null;
  created_at: string;
  updated_at: string;
};

export type OwnerOnboardingCreatePayload = {
  name: string;
  address: string;
  district_id: number;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors?: number;
  description?: string;
  ask_price: string;
  ask_currency?: Currency;
  accept_offer: boolean;
};

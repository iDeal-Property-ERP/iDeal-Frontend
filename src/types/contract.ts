import type { AgreementStatus, LeaseStatus } from './enums';

export type OwnerAgreementOutput = {
  id: number;
  owner_id: number;
  property_id: number;
  agreement_number: string;
  signed_date: string;
  start_date: string;
  end_date: string;
  status: AgreementStatus;
  terms: string | null;
  commission_rate: string;
  gross_floor_amount: string;
  currency: string;
  payout_day: number;
  created_at: string;
  updated_at: string;
};

export type OwnerAgreementCreatePayload = {
  owner_id: number;
  property_id: number;
  agreement_number: string;
  signed_date: string;
  start_date: string;
  end_date: string;
  status?: AgreementStatus;
  terms?: string | null;
  commission_rate: string;
  gross_floor_amount: string;
  currency?: string;
  payout_day?: number;
};

export type LeaseOutput = {
  id: number;
  property_id: number;
  tenant_id: number;
  owner_agreement_id: number;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  deposit: string;
  status: LeaseStatus;
  created_at: string;
  updated_at: string;
};

export type LeaseCreatePayload = {
  property_id: number;
  owner_agreement_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  deposit: string;
  status?: LeaseStatus;
};

export type LeaseRenewPayload = {
  new_start_date: string;
  new_end_date: string;
  new_monthly_rent: string;
  deposit: string;
};

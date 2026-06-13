import type { Currency, PaymentMethod, PaymentStatus } from './enums';

export type PaymentOutput = {
  id: number;
  lease_id: number;
  tenant_id: number;
  tenant_name: string;
  paid_by_id: number;
  amount: string;
  currency: Currency;
  payment_date: string;
  due_date: string;
  status: PaymentStatus;
  method: PaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentCreatePayload = {
  lease_id: number;
  tenant_id: number;
  paid_by_id: number;
  amount: string;
  currency: Currency;
  payment_date: string;
  due_date: string;
  status: PaymentStatus;
  method: PaymentMethod;
  notes?: string | null;
};

export type PaymentUpdatePayload = {
  amount?: string;
  currency?: Currency;
  payment_date?: string;
  due_date?: string;
  method?: PaymentMethod;
  notes?: string | null;
};

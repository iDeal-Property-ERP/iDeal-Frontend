import type { PaymentMethod, PaymentStatus, ServiceRequestStatus, Priority } from './enums';

export type TenantHomeOutput = {
  lease_id: number | null;
  property_id: number | null;
  property_name: string | null;
  property_address: string | null;
  start_date: string | null;
  end_date: string | null;
  monthly_rent: string | null;
  deposit: string | null;
  status: string | null;
  next_payment_due: string | null;
  rent_due: string | null;
};

export type TenantPaymentOutput = {
  id: number;
  amount: string;
  currency: string;
  payment_date: string;
  due_date: string;
  status: PaymentStatus;
  method: PaymentMethod;
  notes: string | null;
  created_at: string;
};

export type TenantServiceRequestOutput = {
  id: number;
  property_id: number;
  property_name: string;
  title: string;
  description: string;
  priority: Priority;
  status: ServiceRequestStatus;
  cost: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantServiceRequestCreatePayload = {
  property_id: number;
  title: string;
  description: string;
  priority?: Priority;
};

export type TenantPaymentCreatePayload = {
  amount?: string;
  method?: PaymentMethod;
  notes?: string;
};

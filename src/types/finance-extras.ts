export type FinanceDashboardOutput = {
  total_payments: string;
  total_payments_uzs: string;
  total_payouts: string;
  total_payouts_uzs: string;
  net_margin: string;
  net_margin_uzs: string;
  pending_count: number;
  pending_amount: string;
  overdue_count: number;
  overdue_amount: string;
};

export type PnLOutput = {
  gross_revenue: string;
  gross_revenue_uzs: string;
  owner_payouts: string;
  owner_payouts_uzs: string;
  net_margin: string;
  net_margin_uzs: string;
  payment_count: number;
  tax_estimate: string;
  tax_estimate_uzs: string;
};

export type PayoutOutput = {
  id: number;
  owner_id: number;
  amount: string;
  currency: string;
  scheduled_date: string;
  paid_date: string | null;
  status: string;
  created_at: string;
};

export type ExchangeRateOutput = {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: string;
  updated_at: string;
};

export type ExchangeRateCreatePayload = {
  from_currency: string;
  to_currency: string;
  rate: string;
};

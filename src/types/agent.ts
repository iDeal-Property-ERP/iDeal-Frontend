import type { DealStatus } from './enums';

export type AgentOutput = {
  id: number;
  user_id: number;
  user_name: string;
  total_deals: number;
  total_revenue: string;
  commission_rate: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DealOutput = {
  id: number;
  agent_id: number;
  property_id: number;
  property_name: string;
  deal_date: string;
  rent_amount: string;
  commission_amount: string;
  status: DealStatus;
  created_at: string;
  updated_at: string;
};

export type DealCreatePayload = {
  property_id: number;
  deal_date: string;
  rent_amount: string;
  status: DealStatus;
};

import type { OnboardingStatus, Role } from './enums';

export type ManagementOnboardingOutput = {
  id: number;
  owner_id: number;
  owner_name: string;
  property_id: number;
  property_name: string;
  status: OnboardingStatus;
  offer_version: string | null;
  offer_accepted_at: string | null;
  review_notes: string | null;
  generated_agreement_id: number | null;
  ask_price: string;
  created_at: string;
  updated_at: string;
};

export type ManagementOnboardingApprovePayload = {
  commission_rate: string;
  start_date: string;
  end_date: string;
  agreement_number?: string;
  terms?: string;
  owner_guaranteed_price?: string;
  tenant_charge_price?: string;
};

export type UserOutput = {
  id: number;
  first_name: string;
  last_name: string;
  patronymic: string | null;
  username: string;
  phone: string;
  email: string;
  role: Role;
  is_active: boolean;
  is_verified: boolean;
  nationality: string | null;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
};

export type UserUpdatePayload = {
  is_active?: boolean;
  is_verified?: boolean;
  role?: Role;
};

export type ManagementPropertyOutput = {
  id: number;
  name: string;
  address: string;
  district_id: number;
  district_name: string;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors: number;
  owner_id: number;
  owner_name: string;
  status: string;
  tariff: string;
  ask_price: string;
  ask_currency: string;
  owner_guaranteed_price: string;
  tenant_charge_price: string;
  vacant_since: string | null;
  vacant_days: number;
  description: string | null;
  score: string;
  created_at: string;
  updated_at: string;
};

export type ManagementLeaseOutput = {
  id: number;
  property_id: number;
  property_name: string;
  tenant_id: number;
  tenant_name: string;
  owner_agreement_id: number;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  deposit: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ManagementAgreementOutput = {
  id: number;
  owner_id: number;
  property_id: number;
  owner_name: string;
  property_name: string;
  agreement_number: string;
  signed_date: string;
  start_date: string;
  end_date: string;
  status: string;
  commission_rate: string;
  created_at: string;
  updated_at: string;
};

export type ManagementPaymentOutput = {
  id: number;
  lease_id: number;
  tenant_id: number;
  tenant_name: string;
  paid_by_id: number | null;
  paid_by_name: string | null;
  property_id: number | null;
  property_name: string | null;
  amount: string;
  currency: string;
  payment_date: string;
  due_date: string;
  status: string;
  method: string;
  gateway_ref: string | null;
  notes: string | null;
  linked_payout_id: number | null;
  created_at: string;
};

export type ManagementPayoutOutput = {
  id: number;
  owner_agreement_id: number;
  owner_id: number;
  owner_name: string;
  property_id: number | null;
  property_name: string | null;
  property_address: string | null;
  source_payment_id: number | null;
  amount: string;
  currency: string;
  scheduled_date: string;
  paid_date: string | null;
  status: string;
  status_reason: string | null;
  method: string;
  created_at: string;
};

export type PaymentsStats = {
  month: string;
  collected_month: string;
  outstanding: string;
  overdue_total: string;
  payouts_due: string;
  counts: { overdue: number; due_month: number; paid_month: number; all: number };
};

export type PayoutsStats = {
  next_run_date: string;
  due_next_run: string;
  this_month: string;
  held_total: string;
  next_30_days: string;
  counts: { due: number; held: number; paid: number; cancelled: number; all: number };
};

export type PaymentCreatePayload = {
  lease_id: number;
  tenant_id: number;
  paid_by_id: number;
  amount: string;
  currency: string;
  payment_date: string;
  due_date: string;
  status?: string;
  method: string;
  gateway_ref?: string | null;
  notes?: string | null;
};

export type PayoutCreatePayload = {
  owner_agreement_id: number;
  amount: string;
  currency: string;
  scheduled_date: string;
  method: string;
};

export type ManagementServiceRequestOutput = {
  id: number;
  property_id: number;
  property_name: string;
  tenant_id: number;
  tenant_name: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  cost: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardKpi = {
  occupied: {
    value: number;
    total: number;
    change: number;
  };
  net_profit: {
    value: string;
    change: string;
  };
  payments_received: {
    amount: string;
    days: number;
    on_time_pct: number;
  };
  vacant: {
    value: number;
    loss_per_day: string;
  };
};

export type RecentPaymentItem = {
  tenant_name: string;
  nationality: string | null;
  property_name: string;
  amount: string;
  status: string;
};

export type OccupancyItem = {
  rate: number;
  rented: number;
  vacant: number;
  maintenance: number;
};

export type MaintenanceRequestItem = {
  title: string;
  property_name: string;
  tenant_name: string;
  priority: string;
  status: string;
};

export type ManagementDashboardOutput = {
  greeting: string;
  date: string;
  location: string;
  total_properties: number;
  payment_status: string;
  kpi: DashboardKpi;
  recent_payments: RecentPaymentItem[];
  occupancy: OccupancyItem;
  maintenance_requests: MaintenanceRequestItem[];
};

export type PnlMonthlyItem = {
  month: string;
  revenue: string;
  owner_payouts: string;
  profit: string;
  tax: string;
};

export type PnlBarItem = {
  month: string;
  revenue: string;
};

export type PnlOutput = {
  summary: {
    gross_revenue: string;
    owner_payouts: string;
    net_profit: string;
    tax: string;
  };
  monthly: PnlMonthlyItem[];
  growth: {
    actual: PnlBarItem[];
    projected: PnlBarItem[];
  };
  investor: {
    monthly: string;
    annual: string;
    property_count: number;
    scaled_50: string;
  };
};

export type PortfolioMapProperties = {
  id: number;
  name: string;
  address: string;
  rooms: number;
  area_sqm: number;
  floor: number;
  price: string;
  currency: string;
};

export type PortfolioMapOutput = {
  type: string;
  features: {
    type: string;
    geometry: {
      type: string;
      coordinates: number[];
    };
    properties: PortfolioMapProperties;
  }[];
};

// --- Agents (People) ---

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

export type AgentDealOutput = {
  id: number;
  agent_id: number;
  property_id: number;
  property_name: string;
  deal_date: string;
  rent_amount: string;
  commission_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AgentCreatePayload = {
  user_id: number;
  commission_rate: string;
  is_active?: boolean;
};

export type AgentUpdatePayload = {
  commission_rate?: string;
  is_active?: boolean;
};

export type AgentDealCreatePayload = {
  property_id: number;
  deal_date: string;
  rent_amount: string;
  status?: string;
};

// --- Inventory acts (Portfolio) ---

export type InventoryActListOutput = {
  id: number;
  property_id: number;
  property_name: string;
  lease_id: number | null;
  act_type: string;
  status: string;
  item_count: number;
  photo_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryActItemOutput = {
  id: number;
  area: string;
  condition: string;
  notes: string | null;
  sort_order: number;
};

export type InventoryActPhotoOutput = {
  id: number;
  item_id: number | null;
  image_url: string | null;
  caption: string | null;
  created_at: string;
};

export type InventoryActOutput = {
  id: number;
  property_id: number;
  property_name: string;
  lease_id: number | null;
  act_type: string;
  status: string;
  created_by_id: number;
  notes: string | null;
  finalized_at: string | null;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  items: InventoryActItemOutput[];
  photos: InventoryActPhotoOutput[];
  created_at: string;
  updated_at: string;
};

export type InventoryActCreatePayload = {
  property_id: number;
  lease_id?: number | null;
  act_type: string;
  notes?: string | null;
};

// --- Lease / Agreement write payloads (management CRUD) ---

export type LeaseCreatePayload = {
  property_id: number;
  owner_agreement_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  deposit: string;
};

export type LeaseRenewPayload = {
  new_start_date: string;
  new_end_date: string;
  new_monthly_rent: string;
  deposit?: string;
};

export type LeaseTerminatePayload = {
  end_date?: string;
  reason?: string;
};

export type AgreementCreatePayload = {
  owner_id: number;
  property_id: number;
  agreement_number: string;
  signed_date: string;
  start_date: string;
  end_date: string;
  commission_rate: string;
  terms?: string;
};

export type AgreementRenewPayload = {
  new_start_date: string;
  new_end_date: string;
  commission_rate?: string;
  agreement_number?: string;
  terms?: string;
};

export type UserInvitePayload = {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: string;
  is_active?: boolean;
  is_verified?: boolean;
};

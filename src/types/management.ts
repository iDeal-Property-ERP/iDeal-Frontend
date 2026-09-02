import type { OnboardingStatus, Role } from './enums';

export type ManagementOnboardingOutput = {
  id: number;
  number: string;
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

export type ManagementOnboardingDetailOutput = {
  id: number;
  number: string;
  owner_id: number;
  owner_name: string;
  owner_phone: string | null;
  owner_properties_count: number;
  property_id: number;
  property_name: string;
  property_address: string;
  district_name: string;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors: number | null;
  tariff: string;
  status: OnboardingStatus;
  offer_version: string | null;
  offer_terms_snapshot: string | null;
  offer_accepted_at: string | null;
  review_notes: string | null;
  generated_agreement_id: number | null;
  ask_price: string;
  ask_currency: string;
  market_min: string | null;
  market_max: string | null;
  market_median: string | null;
  suggested_price: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type OnboardingsStats = {
  counts: {
    submitted: number;
    offer_accepted: number;
    approved: number;
    rejected: number;
    all: number;
  };
  open: number;
};

/** A unified lead row: a viewing request or a booking merged into one shape. */
export type ManagementLeadOutput = {
  id: string;
  type: 'viewing' | 'booking';
  source_id: number;
  status: string;
  name: string;
  phone: string | null;
  email: string | null;
  listing_id: number | null;
  property_id: number | null;
  property_name: string;
  property_address: string | null;
  property_status: string | null;
  property_rooms: number | null;
  property_area_sqm: number | null;
  property_floor: number | null;
  property_photo_url: string | null;
  listing_price: string | null;
  currency: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  requested_start_date: string | null;
  requested_end_date: string | null;
  monthly_rent_offer: string | null;
  message: string | null;
  reviewed_by_name: string | null;
  converted_lease_id: number | null;
  created_at: string;
  updated_at: string;
};

export type LeadsStats = {
  counts: {
    new: number;
    scheduled: number;
    awaiting: number;
    closed: number;
    all: number;
  };
  by_type: { viewing: number; booking: number };
  open: number;
};

/** Sidebar queue-badge counts (open work per module). */
export type QueueCounts = {
  leads: number;
  onboardings: number;
  maintenance: number;
  payments: number;
  payouts: number;
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
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  is_verified?: boolean;
  role?: Role;
};

export type ManagementPropertyOutput = {
  id: number;
  name: string;
  address: string;
  // Nullable in the management API contract for legacy incomplete records.
  district_id: number | null;
  district_name: string | null;
  rooms: number | null;
  area_sqm: number | null;
  floor: number | null;
  total_floors: number | null;
  owner_id: number | null;
  owner_name: string | null;
  engagement_type: 'managed' | 'one_off';
  status: string;
  tariff: string;
  ask_price: string | null;
  ask_currency: string;
  owner_guaranteed_price: string | null;
  tenant_charge_price: string | null;
  vacant_since: string | null;
  // Null when rented — vacancy figures only apply to vacant properties.
  vacant_days: number | null;
  // Decimal string (e.g. "16.67"); null when rented.
  vacancy_loss_per_day: string | null;
  // Active-lease enrichment: null when the property has no active lease.
  tenant_name: string | null;
  tenant_since: string | null;
  map_lat: string | null;
  map_lon: string | null;
  description: string | null;
  score: string;
  created_by_id?: number | null;
  created_by_name?: string | null;
  contact_phone?: string | null;
  // Absolute URL of the primary photo for the row thumbnail; null when none.
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type OneOffDealStatus = 'active' | 'paused' | 'closed_won' | 'closed_lost' | 'archived';
export type OneOffChannel = 'marketplace' | 'off_market';
export type BrokerageCommissionType = 'none' | 'fixed' | 'percentage';

export type OneOffCommissionReceipt = {
  id: number;
  amount: string;
  currency: 'USD' | 'UZS';
  received_date: string;
  method: string;
  reference: string;
  recorded_by_id: number;
  recorded_by_name: string;
  attachments: {
    id: number;
    filename: string;
    url: string;
    content_type: string;
    size_bytes: number;
    created_at: string;
  }[];
  created_at: string;
};

export type OneOffDeal = {
  id: number;
  property_id: number;
  property_name: string;
  property_address: string;
  status: OneOffDealStatus;
  channel: OneOffChannel;
  seller_name: string;
  seller_phone: string;
  seller_email: string | null;
  renter_name: string | null;
  renter_phone: string | null;
  renter_email: string | null;
  commission_type: BrokerageCommissionType;
  commission_fixed_amount: string | null;
  commission_percentage: string | null;
  commission_currency: 'USD' | 'UZS';
  agreed_monthly_rent: string | null;
  agreed_currency: 'USD' | 'UZS';
  close_date: string | null;
  close_notes: string;
  evidence: {
    filename: string;
    url: string;
    content_type?: string | null;
    size_bytes?: number | null;
  }[];
  commission_amount: string | null;
  commission_uzs_amount: string | null;
  commission_conversion_rate: string | null;
  receipt: OneOffCommissionReceipt | null;
  created_at: string;
  updated_at: string;
};

export type BrokerageCommissionStats = {
  expected_uzs: string;
  received_uzs: string;
  unpaid_uzs: string;
  free_deals: number;
  close_rate: string;
  average_days_to_close: number;
  counts: { active: number; won: number; closed: number; all: number };
};

/**
 * A portfolio-map row — the full property output plus the map popup enrichment
 * (lease end; the tenant name is on the base row). A superset of
 * `ManagementPropertyOutput`, so a marker's row drives the property record
 * panel directly.
 */
export type ManagementPropertyMapRow = ManagementPropertyOutput & {
  lease_end_date: string | null;
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
  gross_floor_amount: string;
  currency: string;
  payout_day: number;
  /** @deprecated Pricing now belongs to the agreement settlement terms. */
  owner_guaranteed_amount?: string | null;
  /** @deprecated Pricing now belongs to the agreement settlement terms. */
  tenant_charge_amount?: string | null;
  /** @deprecated Replaced by transparent commission and settlement fields. */
  margin?: string | null;
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
  rental_period: string | null;
  kind: string;
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
  settlement_id: number | null;
  kind: string;
  /** @deprecated Payouts are now linked to settlements, not one payment. */
  source_payment_id?: number | null;
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
  rental_period?: string | null;
  kind?: 'rent' | 'deposit' | 'other';
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
  tenant_phone: string | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  cost: string | null;
  cost_bearer: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  photos_count: number;
  photo_urls: string[];
  // Server-computed SLA: window hours, due datetime, and whether it is past due
  // (breached = past due and status not resolved/cancelled).
  sla_hours: number;
  sla_due_at: string;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
};

export type MaintenanceStats = {
  open: number;
  open_unassigned: number;
  in_progress: number;
  in_progress_avg_age_days: number;
  resolved_30d: number;
  resolved_30d_avg_days: number;
  cost_30d_total: string;
  cost_30d_owner: string;
  cost_30d_platform: string;
  counts: { open: number; in_progress: number; resolved: number; all: number };
};

export type ServiceRequestComment = {
  id: number;
  author_id: number | null;
  author_name: string | null;
  body: string;
  created_at: string;
};

export type ServiceRequestCreatePayload = {
  property_id: number;
  tenant_id: number;
  title: string;
  description: string;
  priority: string;
};

export type ServiceRequestResolvePayload = {
  cost: string;
  resolution_notes: string;
  cost_bearer?: string;
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
  brokerage: {
    expected_uzs: string;
    received_uzs: string;
    unpaid_uzs: string;
    closed_count: number;
  };
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

export type PnlBreakdownRow = {
  source: string;
  amount: string;
  share: string;
};

export type PnlServiceTypeRow = {
  service_type: string;
  amount: string;
};

export type PnlBreakdown = {
  revenue: PnlBreakdownRow[];
  expenses: PnlBreakdownRow[];
  vas_by_service_type: PnlServiceTypeRow[];
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
  // Phase 6 — additive; present on the current backend, optional for safety.
  year?: number;
  currency?: string;
  sources?: string[];
  breakdown?: PnlBreakdown;
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
  deals_ytd: number;
  pending_commission_total: string | null;
  total_revenue: string;
  commission_rate: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AgentStats = {
  counts: { active: number; pending_commission: number; all: number };
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
  acknowledged_at: string | null;
  acknowledged_by_name: string | null;
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
  gross_floor_amount: string;
  currency?: string;
  payout_day?: number;
  terms?: string;
};

export type AgreementRenewPayload = {
  new_start_date: string;
  new_end_date: string;
  commission_rate?: string;
  gross_floor_amount?: string;
  currency?: string;
  payout_day?: number;
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

// --- Management Localization Workspace ---

export type DistrictTranslationItem = {
  name?: string | null;
  city?: string | null;
};

export type DistrictTranslationMap = {
  en?: DistrictTranslationItem;
  uz?: DistrictTranslationItem;
  ru?: DistrictTranslationItem;
};

export type ManagementDistrict = {
  id: number;
  name: string;
  city: string;
  translations: DistrictTranslationMap;
  created_at: string;
  updated_at: string;
};

export type ManagementDistrictInput = {
  translations: {
    en: { name: string; city: string };
    uz: { name: string; city: string };
    ru: { name: string; city: string };
  };
};

export type AmenityTranslationItem = {
  name?: string | null;
};

export type AmenityTranslationMap = {
  en?: AmenityTranslationItem;
  uz?: AmenityTranslationItem;
  ru?: AmenityTranslationItem;
};

export type ManagementAmenity = {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  translations: AmenityTranslationMap;
  created_at: string;
  updated_at: string;
};

export type ManagementAmenityInput = {
  slug?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
  translations: {
    en: { name: string };
    uz: { name: string };
    ru: { name: string };
  };
};

export type FaqTranslationItem = {
  question?: string | null;
  answer?: string | null;
};

export type FaqTranslationMap = {
  en?: FaqTranslationItem;
  uz?: FaqTranslationItem;
  ru?: FaqTranslationItem;
};

export type ManagementFaq = {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  translations: FaqTranslationMap;
  created_at: string;
  updated_at: string;
};

export type ManagementFaqInput = {
  sort_order?: number;
  is_active?: boolean;
  translations: {
    en: { question: string; answer: string };
    uz: { question: string; answer: string };
    ru: { question: string; answer: string };
  };
};

export type PublicOfferTranslationItem = {
  body?: string | null;
};

export type PublicOfferTranslationMap = {
  en?: PublicOfferTranslationItem;
  uz?: PublicOfferTranslationItem;
  ru?: PublicOfferTranslationItem;
};

export type ManagementPublicOffer = {
  id: number;
  version: string;
  body: string;
  is_active: boolean;
  translations: PublicOfferTranslationMap;
  created_at: string;
  updated_at: string;
};

export type ManagementPublicOfferInput = {
  version: string;
  is_active?: boolean;
  translations: {
    en: { body: string };
    uz: { body: string };
    ru: { body: string };
  };
};

export type ResourceIncompleteItem = {
  id: number;
  identifier: string;
  missing_by_language: Record<string, string[]>;
};

export type ResourceLocalizationStatus = {
  total_count: number;
  complete_count: number;
  incomplete_count: number;
  missing_by_language: {
    en: number;
    uz: number;
    ru: number;
  };
  incomplete_items: ResourceIncompleteItem[];
};

export type LocalizationStatusReport = {
  properties: ResourceLocalizationStatus;
  districts: ResourceLocalizationStatus;
  amenities: ResourceLocalizationStatus;
  faqs: ResourceLocalizationStatus;
  public_offers: ResourceLocalizationStatus;
  vas_catalog_items: ResourceLocalizationStatus;
};

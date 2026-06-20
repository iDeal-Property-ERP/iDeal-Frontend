/** Enum types matching backend Pydantic schemas */

export type Role = 'mgmt' | 'owner' | 'tenant' | 'agent' | 'listings';

export type PropertyStatus = 'vacant' | 'rented' | 'maintenance';

export type Tariff = 'standard' | 'comfort' | 'premium';

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'online';

export type PayoutStatus = 'scheduled' | 'paid' | 'cancelled';

export type LeaseStatus = 'active' | 'expired' | 'renewed' | 'terminated';

export type AgreementStatus = 'active' | 'expired' | 'terminated';

export type ServiceRequestStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type DealStatus = 'closed' | 'pending' | 'cancelled';

export type Currency = 'USD' | 'UZS';

export type ViewingStatus = 'pending' | 'confirmed' | 'cancelled';

export type NotificationType =
  | 'payment_due'
  | 'payment_paid'
  | 'payout_paid'
  | 'booking_status'
  | 'service_request_status'
  | 'lease_renewal'
  | 'owner_onboarding'
  | 'service_order_status'
  | 'general';

export type BookingStatus = 'requested' | 'approved' | 'rejected' | 'converted' | 'cancelled';

export type OnboardingStatus = 'submitted' | 'offer_accepted' | 'approved' | 'rejected';

export type InventoryActStatus = 'draft' | 'finalized';

export type InventoryActType = 'handover' | 'return' | 'general';

export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

export type VASServiceType = 'cleaning' | 'handyman' | 'utility' | 'internet' | 'moving' | 'other';

export type VASOrderStatus = 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

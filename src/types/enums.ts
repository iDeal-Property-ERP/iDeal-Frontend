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

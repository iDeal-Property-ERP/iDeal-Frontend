import type { BookingStatus, Currency, Tariff } from './enums';

export type ListingOutput = {
  id: number;
  property: {
    id: number;
    name: string;
    address: string;
    district_id: number;
    district_name: string | null;
    rooms: number;
    area_sqm: number;
    floor: number;
    total_floors: number;
    status: string;
    map_lat: string;
    map_lon: string;
    tariff: Tariff;
    ask_price: string;
    ask_currency: Currency;
  };
  property_id: number;
  owner_agreement_id: number;
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
  listed_price: string;
  created_at: string;
  updated_at: string;
};

export type BookViewingPayload = {
  full_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  message?: string | null;
};

export type ViewingOutput = {
  id: number;
  listing_id: number;
  full_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TenantBookingOutput = {
  id: number;
  listing_id: number;
  property_id: number;
  property_name: string;
  requested_start_date: string;
  requested_end_date: string;
  monthly_rent_offer: string | null;
  status: BookingStatus;
  message: string | null;
  converted_lease_id: number | null;
  created_at: string;
  updated_at: string;
};

export type TenantBookingCreatePayload = {
  listing_id: number;
  requested_start_date: string;
  requested_end_date: string;
  monthly_rent_offer?: string;
  message?: string;
};

export type ManagementBookingOutput = {
  id: number;
  listing_id: number;
  property_id: number;
  property_name: string;
  tenant_id: number;
  tenant_name: string;
  requested_start_date: string;
  requested_end_date: string;
  monthly_rent_offer: string | null;
  status: BookingStatus;
  message: string | null;
  converted_lease_id: number | null;
  created_at: string;
  updated_at: string;
};

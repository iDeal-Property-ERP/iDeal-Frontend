import type {
  BookingStatus,
  Currency,
  Furnishing,
  ListingStatus,
  PropertyType,
  Tariff,
  ViewingTimeSlot,
} from './enums';

export type Amenity = {
  slug: string;
  name: string;
  icon: string;
};

export type PropertyBrief = {
  id: number;
  name: string;
  address: string;
  district_id: number;
  district_name: string | null;
  property_type: PropertyType;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors: number | null;
  furnishing: Furnishing;
  status: string;
  is_verified: boolean;
  score: string;
  review_count: number;
  map_lat: string | null;
  map_lon: string | null;
  tariff: Tariff;
  ask_price: string;
  ask_currency: Currency;
  amenities: Amenity[];
  image_url: string | null;
  image_urls?: string[];
};

export type ListingOutput = {
  id: number;
  property: PropertyBrief;
  property_id: number;
  owner_agreement_id: number | null;
  status: ListingStatus;
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
  listed_price: string | null;
  monthly_price: string | null;
  deposit_amount: string | null;
  currency: Currency;
  created_at: string;
  updated_at: string;
};

export type ListingPhoto = {
  id: number;
  image_url: string;
  caption?: string | null;
  is_primary: boolean;
  sort_order: number;
};

export type VerificationChecklistItem = {
  key: string;
  label: string;
};

/** Enriched listing detail returned by GET /marketplace/listings/{id}/. */
export type ListingDetail = ListingOutput & {
  photos: ListingPhoto[];
  specs: {
    property_type: PropertyType;
    rooms: number;
    area_sqm: number;
    floor: number;
    total_floors: number | null;
    furnishing: Furnishing;
    tariff: Tariff;
  };
  price_card: {
    monthly_price: string | null;
    deposit_amount: string | null;
    currency: Currency;
    minimum_stay: number | null;
    price_includes: string[];
    response_time: string;
  };
  verification: {
    is_verified: boolean;
    checklist: VerificationChecklistItem[];
  };
};

export type DistrictOption = {
  id: number;
  name: string;
  city: string;
};

export type AmenityOption = {
  id: number;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
};

export type FaqItem = {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
};

/** Discovery filter params accepted by GET /marketplace/listings/. */
export type ListingFilters = {
  district_id?: string;
  price_min?: string;
  price_max?: string;
  rooms?: string;
  rooms_min?: string;
  rooms_max?: string;
  area_min?: string;
  area_max?: string;
  verified?: string;
  furnishing?: string;
  tariff?: string;
  property_type?: string;
  amenities?: string;
  sort?: string;
  q?: string;
  bbox?: string;
};

/** Discovery layout mode, persisted in the URL as `?view=`. */
export type DiscoveryView = 'list' | 'split' | 'map';

export type ListingMapFeature = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    id: number;
    name: string;
    address: string;
    rooms: number;
    area_sqm: number;
    floor: number;
    price: string;
    currency: Currency;
    image_url: string | null;
  };
};

export type ListingMapCollection = {
  type: 'FeatureCollection';
  features: ListingMapFeature[];
};

/** Normalized point used by the map components. */
export type MapPoint = {
  id: number;
  lat: number;
  lon: number;
  name: string;
  address: string;
  price: string;
  currency: Currency;
  image_url: string | null;
};

export type BookViewingPayload = {
  full_name: string;
  phone: string;
  email?: string | null;
  preferred_date: string;
  preferred_time?: ViewingTimeSlot | null;
  message?: string | null;
};

export type ContactInquiryPayload = {
  listing_id?: number | null;
  full_name: string;
  phone: string;
  email?: string | null;
  message: string;
};

export type ContactInquiryOutput = {
  id: number;
  listing_id: number | null;
  full_name: string;
  phone: string;
  email: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

/** Owner "List your property" wizard draft/listing. */
export type OwnerListing = {
  id: number;
  status: ListingStatus;
  property_id: number;
  property_type: PropertyType;
  name: string;
  address: string;
  district_id: number;
  district_name: string | null;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors: number | null;
  furnishing: Furnishing;
  tariff: Tariff;
  description: string | null;
  amenities: Amenity[];
  monthly_price: string | null;
  deposit_amount: string | null;
  currency: Currency;
  minimum_stay: number | null;
  price_includes: string[];
  photos: ListingPhoto[];
  completeness: {
    has_5_photos: boolean;
    has_price: boolean;
    has_ownership: boolean;
  };
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type OwnerListingCreatePayload = {
  property_type: PropertyType;
  name: string;
  address?: string | null;
  district_id: number;
  rooms: number;
  area_sqm: number;
  floor?: number;
  total_floors?: number | null;
  furnishing: Furnishing;
  description?: string | null;
  amenities: string[];
};

export type OwnerListingUpdatePayload = Partial<{
  property_type: PropertyType;
  name: string;
  address: string;
  district_id: number;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors: number | null;
  furnishing: Furnishing;
  tariff: Tariff;
  description: string | null;
  amenities: string[];
  monthly_price: string;
  deposit_amount: string;
  currency: Currency;
  minimum_stay: number | null;
  price_includes: string[];
}>;

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

export type ManagementViewingRequestOutput = {
  id: number;
  listing_id: number;
  property_name: string;
  full_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  preferred_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
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

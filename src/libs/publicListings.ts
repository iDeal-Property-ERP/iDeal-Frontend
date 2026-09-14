import { apiFetch, apiUpload } from '@/libs/api';
import type { PublicOfferOutput } from '@/types/owner';

export type PublicListingContactPayload = {
  first_name: string;
  last_name?: string | null;
  email: string;
  phone: string;
};

export type PublicListingPayload = {
  contact: PublicListingContactPayload;
  property_type: string;
  name: string;
  landmark?: string;
  district_id: number;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors?: number | null;
  furnishing: string;
  description?: string | null;
  amenities: string[];
  monthly_price: number | string;
  deposit_amount: number | string;
  currency: string;
  minimum_stay: number;
  price_includes: string[];
  offer_id: number;
  offer_version: string;
  offer_hash: string;
};

type PublicOfferAcceptance = {
  offer_id: number;
  offer_version: string;
  offer_hash: string;
};

/**
 * Fetches the active marketplace public offer.
 * @returns The active offer, or a payload of nulls when none exists.
 */
export async function fetchPublicOffer(): Promise<PublicOfferOutput> {
  return await apiFetch<PublicOfferOutput>('/marketplace/public-offer/');
}

/**
 * Maps a public-offer response to the listing-submit acceptance fields.
 * @param offer - The active public offer, or null when none is loaded.
 * @returns The three required offer fields, or null when any value is missing.
 */
export function toOfferAcceptance(offer: PublicOfferOutput | null): PublicOfferAcceptance | null {
  if (!(offer?.id && offer.version && offer.content_hash)) {
    return null;
  }
  return {
    offer_id: offer.id,
    offer_version: offer.version,
    offer_hash: offer.content_hash,
  };
}

/**
 * Submits a completed public (guest) listing draft for review.
 * @param payload - The listing details and contact info.
 * @param files - The image files to upload.
 * @returns The created listing.
 */
export async function submitPublicListing(
  payload: PublicListingPayload,
  files: File[],
): Promise<{ id: number; status: string }> {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  for (const file of files) {
    form.append('images', file);
  }
  return await apiUpload<{ id: number; status: string }>('/marketplace/listings/submit/', form);
}

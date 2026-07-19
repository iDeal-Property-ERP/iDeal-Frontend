import { apiUpload } from '@/libs/api';

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
};

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

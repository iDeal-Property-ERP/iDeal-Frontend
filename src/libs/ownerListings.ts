import { apiFetch, apiUpload } from '@/libs/api';
import type { OwnerListing } from '@/types/marketplace';

const BASE = '/owner/listings';

export type OwnerListingSubmitPayload = {
  property_type: string;
  name?: string;
  address?: string;
  district_id: number;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors?: number;
  furnishing: string;
  description?: string;
  tariff?: string;
  monthly_price: string | number;
  deposit_amount?: string | number;
  currency?: string;
  minimum_stay?: number;
  price_includes?: string[];
  amenities?: string[];
  captions?: string[];
  contact?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  accept_offer: true;
  content_locale?: string;
};

export type OwnerListingResubmitPayload = OwnerListingSubmitPayload & {
  keep_photo_ids?: number[];
};

export type OwnerListingUploadPhoto = {
  file?: File;
  caption?: string | null;
};

export type OwnerListingUploadResult = {
  images: File[];
  captions: string[];
};

/**
 * Selects the image files and positionally aligned captions for an owner submission.
 * Resubmissions omit captions for retained server photos because the backend applies
 * captions only to newly uploaded files.
 * @param photos - The local photo sequence, including retained photos during resubmission.
 * @param isResubmission - Whether the upload replaces a rejected listing.
 * @returns New image files and captions aligned to the receiving upload sequence.
 */
export function prepareOwnerListingUpload(
  photos: OwnerListingUploadPhoto[],
  isResubmission: boolean,
): OwnerListingUploadResult {
  const newPhotos = photos.filter((photo): photo is OwnerListingUploadPhoto & { file: File } =>
    Boolean(photo.file),
  );
  const captionPhotos = isResubmission ? newPhotos : photos;
  return {
    images: newPhotos.map((photo) => photo.file),
    captions: captionPhotos.map((photo) => photo.caption ?? ''),
  };
}

/**
 * Lists the current owner's listings.
 * @returns The owner's listings.
 */
export async function fetchOwnerListings(): Promise<OwnerListing[]> {
  return await apiFetch<OwnerListing[]>(`${BASE}/`);
}

/**
 * Retrieves a single owner listing (e.g. to inspect or resubmit a rejected listing).
 * @param id - The listing id.
 * @returns The owner listing.
 */
export async function fetchOwnerListing(id: number | string): Promise<OwnerListing> {
  return await apiFetch<OwnerListing>(`${BASE}/${id}/`);
}

/**
 * Submits a new owner listing atomically for review.
 * @param payload - Structured form fields.
 * @param images - Binary image files (5 to 12).
 * @returns The created listing.
 */
export async function submitOwnerListing(
  payload: OwnerListingSubmitPayload,
  images: File[],
): Promise<OwnerListing> {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  for (const image of images) {
    form.append('images', image);
  }
  return await apiUpload<OwnerListing>(`${BASE}/submit/`, form);
}

/**
 * Atomically resubmits a previously rejected listing.
 * @param id - The rejected listing id.
 * @param payload - Replaced metadata + kept photo IDs.
 * @param images - Additional new image files.
 * @returns The updated listing in pending_review.
 */
export async function resubmitOwnerListing(
  id: number | string,
  payload: OwnerListingResubmitPayload,
  images: File[],
): Promise<OwnerListing> {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  for (const image of images) {
    form.append('images', image);
  }
  return await apiUpload<OwnerListing>(`${BASE}/${id}/resubmit/`, form, {
    method: 'PUT',
  });
}

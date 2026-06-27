import { apiFetch, apiUpload } from '@/libs/api';
import type {
  ListingPhoto,
  OwnerListing,
  OwnerListingCreatePayload,
  OwnerListingUpdatePayload,
} from '@/types/marketplace';

const BASE = '/owner/listings';

/**
 * Lists the current owner's draft/published listings.
 * @returns The owner's listings.
 */
export async function fetchOwnerListings(): Promise<OwnerListing[]> {
  return await apiFetch<OwnerListing[]>(`${BASE}/`);
}

/**
 * Retrieves a single owner listing draft (for resume).
 * @param id - The listing id.
 * @returns The owner listing.
 */
export async function fetchOwnerListing(id: number | string): Promise<OwnerListing> {
  return await apiFetch<OwnerListing>(`${BASE}/${id}/`);
}

/**
 * Creates a new draft (wizard step 1).
 * @param payload - The step-1 details.
 * @returns The created draft.
 */
export async function createOwnerListing(
  payload: OwnerListingCreatePayload,
): Promise<OwnerListing> {
  return await apiFetch<OwnerListing>(`${BASE}/`, { method: 'POST', body: payload });
}

/**
 * Partially updates a draft (per-step save).
 * @param id - The listing id.
 * @param payload - The fields to update.
 * @returns The updated draft.
 */
export async function updateOwnerListing(
  id: number,
  payload: OwnerListingUpdatePayload,
): Promise<OwnerListing> {
  return await apiFetch<OwnerListing>(`${BASE}/${id}/`, { method: 'PATCH', body: payload });
}

/**
 * Uploads photos (wizard step 2) as multipart form-data under the `images` field.
 * @param id - The listing id.
 * @param files - The image files to upload.
 * @returns The created photos.
 */
export async function uploadOwnerListingPhotos(id: number, files: File[]): Promise<ListingPhoto[]> {
  const form = new FormData();
  for (const file of files) {
    form.append('images', file);
  }
  return await apiUpload<ListingPhoto[]>(`${BASE}/${id}/photos/`, form);
}

/**
 * Reorders / re-flags listing photos.
 * @param id - The listing id.
 * @param items - The new ordering and primary flags.
 * @returns The updated listing.
 */
export async function reorderOwnerListingPhotos(
  id: number,
  items: { id: number; sort_order: number; is_primary: boolean; caption?: string | null }[],
): Promise<OwnerListing> {
  return await apiFetch<OwnerListing>(`${BASE}/${id}/photos/reorder/`, {
    method: 'PATCH',
    body: { items },
  });
}

/**
 * Deletes a listing photo.
 * @param id - The listing id.
 * @param photoId - The photo id.
 * @returns Deletion result.
 */
export async function deleteOwnerListingPhoto(
  id: number,
  photoId: number,
): Promise<{ deleted: boolean }> {
  return await apiFetch<{ deleted: boolean }>(`${BASE}/${id}/photos/${photoId}/`, {
    method: 'DELETE',
  });
}

/**
 * Submits a completed draft for review (wizard step 4).
 * @param id - The listing id.
 * @param acceptOffer - Whether the owner accepts the public offer.
 * @returns The submitted listing.
 */
export async function submitOwnerListing(id: number, acceptOffer: boolean): Promise<OwnerListing> {
  return await apiFetch<OwnerListing>(`${BASE}/${id}/submit/`, {
    method: 'POST',
    body: { accept_offer: acceptOffer },
  });
}

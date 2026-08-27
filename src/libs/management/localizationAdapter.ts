import { apiFetch } from '@/libs/api';
import type {
  LocalizationStatusReport,
  ManagementAmenity,
  ManagementAmenityInput,
  ManagementDistrict,
  ManagementDistrictInput,
  ManagementFaq,
  ManagementFaqInput,
  ManagementPublicOffer,
  ManagementPublicOfferInput,
} from '@/types/management';

/**
 * Fetch all districts with translations for management.
 * @returns List of management districts.
 */
export async function getManagementDistricts(): Promise<ManagementDistrict[]> {
  return await apiFetch<ManagementDistrict[]>('/management/districts/');
}

/**
 * Create a new district with translations.
 * @param input - The district translations.
 * @returns The created district.
 */
export async function createManagementDistrict(
  input: ManagementDistrictInput,
): Promise<ManagementDistrict> {
  return await apiFetch<ManagementDistrict>('/management/districts/', {
    method: 'POST',
    body: input,
  });
}

/**
 * Update an existing district's translations.
 * @param id - District ID.
 * @param input - The district translations.
 * @returns The updated district.
 */
export async function updateManagementDistrict(
  id: number,
  input: ManagementDistrictInput,
): Promise<ManagementDistrict> {
  return await apiFetch<ManagementDistrict>(`/management/districts/${id}/`, {
    method: 'PATCH',
    body: input,
  });
}

/**
 * Delete a district.
 * @param id - District ID.
 * @returns The deletion result.
 */
export async function deleteManagementDistrict(id: number): Promise<{ deleted: boolean }> {
  return await apiFetch<{ deleted: boolean }>(`/management/districts/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Fetch all amenities with translations for management.
 * @returns List of management amenities.
 */
export async function getManagementAmenities(): Promise<ManagementAmenity[]> {
  return await apiFetch<ManagementAmenity[]>('/management/amenities/');
}

/**
 * Create a new amenity with translations.
 * @param input - The amenity input.
 * @returns The created amenity.
 */
export async function createManagementAmenity(
  input: ManagementAmenityInput,
): Promise<ManagementAmenity> {
  return await apiFetch<ManagementAmenity>('/management/amenities/', {
    method: 'POST',
    body: input,
  });
}

/**
 * Update an existing amenity with translations.
 * @param id - Amenity ID.
 * @param input - The amenity input.
 * @returns The updated amenity.
 */
export async function updateManagementAmenity(
  id: number,
  input: ManagementAmenityInput,
): Promise<ManagementAmenity> {
  return await apiFetch<ManagementAmenity>(`/management/amenities/${id}/`, {
    method: 'PATCH',
    body: input,
  });
}

/**
 * Delete an amenity.
 * @param id - Amenity ID.
 * @returns The deletion result.
 */
export async function deleteManagementAmenity(id: number): Promise<{ deleted: boolean }> {
  return await apiFetch<{ deleted: boolean }>(`/management/amenities/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Fetch all FAQs with translations for management.
 * @returns List of management FAQs.
 */
export async function getManagementFaqs(): Promise<ManagementFaq[]> {
  return await apiFetch<ManagementFaq[]>('/management/faqs/');
}

/**
 * Create a new FAQ with translations.
 * @param input - The FAQ input.
 * @returns The created FAQ.
 */
export async function createManagementFaq(input: ManagementFaqInput): Promise<ManagementFaq> {
  return await apiFetch<ManagementFaq>('/management/faqs/', {
    method: 'POST',
    body: input,
  });
}

/**
 * Update an existing FAQ with translations.
 * @param id - FAQ ID.
 * @param input - The FAQ input.
 * @returns The updated FAQ.
 */
export async function updateManagementFaq(
  id: number,
  input: ManagementFaqInput,
): Promise<ManagementFaq> {
  return await apiFetch<ManagementFaq>(`/management/faqs/${id}/`, {
    method: 'PATCH',
    body: input,
  });
}

/**
 * Delete a FAQ.
 * @param id - FAQ ID.
 * @returns The deletion result.
 */
export async function deleteManagementFaq(id: number): Promise<{ deleted: boolean }> {
  return await apiFetch<{ deleted: boolean }>(`/management/faqs/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Fetch all Public Offers with translations for management.
 * @returns List of public offers.
 */
export async function getManagementPublicOffers(): Promise<ManagementPublicOffer[]> {
  return await apiFetch<ManagementPublicOffer[]>('/management/public-offers/');
}

/**
 * Create a new Public Offer with translations.
 * @param input - Public offer input.
 * @returns Created public offer.
 */
export async function createManagementPublicOffer(
  input: ManagementPublicOfferInput,
): Promise<ManagementPublicOffer> {
  return await apiFetch<ManagementPublicOffer>('/management/public-offers/', {
    method: 'POST',
    body: input,
  });
}

/**
 * Update an existing Public Offer with translations.
 * @param id - Public offer ID.
 * @param input - Public offer input.
 * @returns Updated public offer.
 */
export async function updateManagementPublicOffer(
  id: number,
  input: ManagementPublicOfferInput,
): Promise<ManagementPublicOffer> {
  return await apiFetch<ManagementPublicOffer>(`/management/public-offers/${id}/`, {
    method: 'PATCH',
    body: input,
  });
}

/**
 * Delete a Public Offer.
 * @param id - Public offer ID.
 * @returns The deletion result.
 */
export async function deleteManagementPublicOffer(id: number): Promise<{ deleted: boolean }> {
  return await apiFetch<{ deleted: boolean }>(`/management/public-offers/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Fetch aggregation of localization completeness status.
 * @returns The localization status report.
 */
export async function getLocalizationStatusReport(): Promise<LocalizationStatusReport> {
  return await apiFetch<LocalizationStatusReport>('/management/localization/status/');
}

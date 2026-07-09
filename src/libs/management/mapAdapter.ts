import { apiFetch } from '@/libs/api';
import type { ManagementPropertyMapRow } from '@/types/management';

/**
 * Portfolio-map data adapter — the single isolation point between the map screen
 * and `GET /management/properties/map/`. Returns geocoded properties across all
 * statuses (unlike the vacant-only marketplace map), enriched for the popup.
 */

export type MapFilters = {
  status?: string;
  districtId?: number | string;
  tariff?: string;
  rooms?: number | string;
  priceMin?: number | string;
  priceMax?: number | string;
  search?: string;
  bbox?: string;
};

/**
 * Lists geocoded portfolio properties via `GET /management/properties/map/`.
 * @param filters - Status, district, rooms, price, search, and bbox filters.
 * @returns The map rows (non-paginated; portfolio-scale).
 */
export async function listMapProperties(
  filters: MapFilters = {},
): Promise<ManagementPropertyMapRow[]> {
  const query: Record<string, string | number> = {};
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.districtId) {
    query.district_id = filters.districtId;
  }
  if (filters.tariff) {
    query.tariff = filters.tariff;
  }
  if (filters.rooms) {
    query.rooms = filters.rooms;
  }
  if (filters.priceMin) {
    query.price_min = filters.priceMin;
  }
  if (filters.priceMax) {
    query.price_max = filters.priceMax;
  }
  if (filters.search) {
    query.search = filters.search;
  }
  if (filters.bbox) {
    query.bbox = filters.bbox;
  }
  return await apiFetch<ManagementPropertyMapRow[]>('/management/properties/map/', { query });
}

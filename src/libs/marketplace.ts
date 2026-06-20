import type { Currency } from '@/types/enums';
import type { ListingMapCollection, ListingOutput, MapPoint } from '@/types/marketplace';
import { Env } from './Env';

type Envelope<T> = { success: boolean; data: T };

/**
 * Fetches marketplace listings, optionally filtered. Returns an empty array on failure.
 * @param params - Query params (district_id, rooms, price_min, price_max, area_min, area_max, page, per_page).
 * @returns Array of listings (empty on error).
 */
export async function fetchListings(params: Record<string, string> = {}): Promise<ListingOutput[]> {
  const url = new URL(`${Env.NEXT_PUBLIC_API_URL}/marketplace/listings/`);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as Envelope<ListingOutput[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

export type PagedListings = {
  items: ListingOutput[];
  count: number;
  numPages: number;
  page: number;
  perPage: number;
};

type PaginatedPayload = {
  count: number;
  num_pages: number;
  per_page: number;
  page: { number: number; object_list: ListingOutput[] };
};

/**
 * Fetches a single page of marketplace listings with pagination metadata.
 * @param params - Filter query params.
 * @param page - 1-based page number.
 * @param perPage - Items per page.
 * @returns Paginated listings (empty on error).
 */
export async function fetchListingsPage(
  params: Record<string, string>,
  page: number,
  perPage: number,
): Promise<PagedListings> {
  const empty: PagedListings = { items: [], count: 0, numPages: 0, page, perPage };
  const url = new URL(`${Env.NEXT_PUBLIC_API_URL}/marketplace/listings/`);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return empty;
    }
    const json = (await res.json()) as Envelope<PaginatedPayload>;
    const { data } = json;
    if (!data?.page) {
      return empty;
    }
    return {
      items: data.page.object_list ?? [],
      count: data.count,
      numPages: data.num_pages,
      page: data.page.number,
      perPage: data.per_page,
    };
  } catch {
    return empty;
  }
}

/**
 * Fetches the public GeoJSON map of vacant listings and normalizes it into MapPoints.
 * @returns Array of map points (empty on error).
 */
export async function fetchListingsMap(): Promise<MapPoint[]> {
  try {
    const res = await fetch(`${Env.NEXT_PUBLIC_API_URL}/marketplace/listings/map/`);
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as Envelope<ListingMapCollection>;
    const features = json.data?.features ?? [];
    return features.map((f) => ({
      id: f.properties.id,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      name: f.properties.name,
      address: f.properties.address,
      price: f.properties.price,
      currency: f.properties.currency,
      image_url: f.properties.image_url,
    }));
  } catch {
    return [];
  }
}

/**
 * Converts listings into MapPoints, skipping any without coordinates.
 * @param listings - Listings to convert.
 * @returns Array of map points.
 */
export function listingsToPoints(listings: ListingOutput[]): MapPoint[] {
  return listings
    .filter((l) => l.property.map_lat && l.property.map_lon)
    .map((l) => ({
      id: l.id,
      lat: Number(l.property.map_lat),
      lon: Number(l.property.map_lon),
      name: l.property.name,
      address: l.property.address,
      price: l.listed_price,
      currency: l.property.ask_currency,
      image_url: l.property.image_url,
    }));
}

/**
 * Formats a price with its currency.
 * @param price - The numeric price as a string.
 * @param currency - The currency code.
 * @returns Formatted price string.
 */
export function formatPrice(price: string, currency: Currency): string {
  if (currency === 'USD') {
    return `$${price}`;
  }
  return `${price} UZS`;
}

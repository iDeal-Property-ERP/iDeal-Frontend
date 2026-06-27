import type { Currency } from '@/types/enums';
import type {
  AmenityOption,
  BookViewingPayload,
  ContactInquiryOutput,
  ContactInquiryPayload,
  DiscoveryView,
  DistrictOption,
  FaqItem,
  ListingDetail,
  ListingFilters,
  ListingMapCollection,
  ListingOutput,
  MapPoint,
  ViewingOutput,
} from '@/types/marketplace';
import { Env } from './Env';

type Envelope<T> = { success: boolean; data: T };

const BASE = `${Env.NEXT_PUBLIC_API_URL}/marketplace`;

export const DISCOVERY_VIEWS: DiscoveryView[] = ['list', 'split', 'map'];

/** The discovery view used when the URL has no (or an invalid) `?view=` value. */
export const DEFAULT_DISCOVERY_VIEW: DiscoveryView = 'split';

/**
 * Normalizes an arbitrary `?view=` value to a known discovery view.
 * @param value - The raw query-string value (may be undefined).
 * @returns A valid DiscoveryView, falling back to the default.
 */
export function normalizeView(value: string | undefined): DiscoveryView {
  for (const view of DISCOVERY_VIEWS) {
    if (view === value) {
      return view;
    }
  }
  return DEFAULT_DISCOVERY_VIEW;
}

const FILTER_KEYS = [
  'district_id',
  'price_min',
  'price_max',
  'rooms',
  'rooms_min',
  'rooms_max',
  'area_min',
  'area_max',
  'verified',
  'furnishing',
  'tariff',
  'property_type',
  'amenities',
  'sort',
  'q',
  'bbox',
] as const;

/**
 * Extracts the discovery filters that are set on a URLSearchParams (ignoring view/page/per_page).
 * Used by the mobile map overlay to lazy-fetch the map dataset with the current filters.
 * @param params - The current URL search params.
 * @returns A ListingFilters object containing only the keys that have a value.
 */
export function filtersFromSearchParams(params: URLSearchParams): ListingFilters {
  const out: ListingFilters = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) {
      out[key] = value;
    }
  }
  return out;
}

type PaginatedPayload<T> = {
  count: number;
  num_pages: number;
  per_page: number;
  page: { number: number; object_list: T[] };
};

function buildQuery(params: Record<string, string | undefined>): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, value);
    }
  }
  return search;
}

/**
 * Fetches marketplace listings (first page) with optional filters. Returns an empty array on failure.
 * The discovery endpoint always returns the paginated envelope, so we read `page.object_list`.
 * @param params - Discovery filters plus optional per_page.
 * @returns The first page of matching listings.
 */
export async function fetchListings(
  params: ListingFilters & { per_page?: string } = {},
): Promise<ListingOutput[]> {
  const url = new URL(`${BASE}/listings/`);
  url.search = buildQuery(params).toString();
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as Envelope<PaginatedPayload<ListingOutput>>;
    return json.data?.page?.object_list ?? [];
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

/**
 * Fetches a single page of marketplace listings with pagination metadata.
 * @param params - Discovery filters.
 * @param page - 1-based page number.
 * @param perPage - Items per page.
 * @returns Paginated listings (empty on error).
 */
export async function fetchListingsPage(
  params: ListingFilters,
  page: number,
  perPage: number,
): Promise<PagedListings> {
  const empty: PagedListings = { items: [], count: 0, numPages: 0, page, perPage };
  const url = new URL(`${BASE}/listings/`);
  const search = buildQuery(params);
  search.set('page', String(page));
  search.set('per_page', String(perPage));
  url.search = search.toString();
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return empty;
    }
    const json = (await res.json()) as Envelope<PaginatedPayload<ListingOutput>>;
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
 * Fetches a single enriched listing detail. Returns null on failure / 404.
 * @param id - The listing id.
 * @returns The listing detail, or null.
 */
export async function fetchListing(id: string | number): Promise<ListingDetail | null> {
  try {
    const res = await fetch(`${BASE}/listings/${id}/`);
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as Envelope<ListingDetail>;
    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches the public GeoJSON map of vacant listings and normalizes it into MapPoints.
 * @returns Normalized map points (empty on error).
 */
export async function fetchListingsMap(): Promise<MapPoint[]> {
  try {
    const res = await fetch(`${BASE}/listings/map/`);
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

export async function fetchDistricts(): Promise<DistrictOption[]> {
  try {
    const res = await fetch(`${BASE}/districts/`);
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as Envelope<DistrictOption[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchAmenities(): Promise<AmenityOption[]> {
  try {
    const res = await fetch(`${BASE}/amenities/`);
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as Envelope<AmenityOption[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchFaqs(): Promise<FaqItem[]> {
  try {
    const res = await fetch(`${BASE}/faqs/`);
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as Envelope<FaqItem[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Submits a "book a viewing" request (public). Throws on failure so the caller can toast.
 * @param listingId - The listing to book.
 * @param payload - The viewing request body.
 * @returns The created viewing request.
 */
export async function bookViewing(
  listingId: number,
  payload: BookViewingPayload,
): Promise<ViewingOutput> {
  const res = await fetch(`${BASE}/listings/${listingId}/book-viewing/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as Envelope<ViewingOutput>;
  if (!res.ok || !json.success) {
    throw new Error('book_viewing_failed');
  }
  return json.data;
}

/**
 * Submits a "Message iDeal" general inquiry (public).
 * @param payload - The inquiry body.
 * @returns The created inquiry.
 */
export async function postInquiry(payload: ContactInquiryPayload): Promise<ContactInquiryOutput> {
  const res = await fetch(`${BASE}/inquiries/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as Envelope<ContactInquiryOutput>;
  if (!res.ok || !json.success) {
    throw new Error('inquiry_failed');
  }
  return json.data;
}

/**
 * Converts listings into MapPoints, skipping any without coordinates.
 * @param listings - The listings to convert.
 * @returns Map points with coordinates.
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
      price: l.monthly_price ?? l.listed_price ?? l.property.ask_price,
      currency: l.property.ask_currency,
      image_url: l.property.image_url,
    }));
}

/**
 * Formats a price with its currency. Returns an em dash for null/empty prices.
 * @param price - The numeric price as a string.
 * @param currency - The currency code.
 * @returns The formatted price.
 */
export function formatPrice(price: string | null | undefined, currency: Currency): string {
  if (!price) {
    return '—';
  }
  if (currency === 'USD') {
    return `$${price}`;
  }
  return `${price} UZS`;
}

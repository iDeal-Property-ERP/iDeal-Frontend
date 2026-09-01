import { apiFetch, apiUpload } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ManagementDashboardOutput, ManagementPropertyOutput } from '@/types/management';
import type { PropertyDetail, PropertyTranslationMap } from '@/types/property';

/**
 * Properties data adapter — the single isolation point between the Properties
 * Workbench and the backend. Real endpoints are called where they exist; every
 * fallback for a missing capability is marked `BACKEND-GAP` so it is easy to
 * swap for a real endpoint later. No UI component talks to the API directly.
 */

export const PROPERTY_STATUSES = ['rented', 'vacant', 'maintenance', 'pending_review'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export type PropertyDraftValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | PropertyTranslationMap
  | OneOffBrokerageDraftPayload;

export type PropertyDraftPayload = Record<string, PropertyDraftValue>;

export type OneOffBrokerageDraftPayload = {
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
  channel?: 'marketplace' | 'off_market';
  commission_type?: 'none' | 'fixed' | 'percentage';
  commission_fixed_amount?: string;
  commission_percentage?: string;
  commission_currency?: 'USD' | 'UZS';
};

export type OneOffPropertyDraftPayload = PropertyDraftPayload & {
  brokerage: OneOffBrokerageDraftPayload;
};

/**
 * Fetches the full management property detail (nullable fields + photos +
 * verification). Backs the management property edit flow.
 * @param id - Property id.
 * @returns The property detail record.
 */
export async function fetchPropertyDetail(id: number | string): Promise<PropertyDetail> {
  return await apiFetch<PropertyDetail>(`/properties/${id}/`);
}

export type PropertySubmissionPayload = {
  engagement_type?: 'managed' | 'one_off';
  name?: string;
  address?: string;
  landmark?: string;
  district_id: number;
  property_type: string;
  rooms: number;
  area_sqm: number;
  floor: number;
  total_floors?: number;
  furnishing: string;
  owner_id?: number;
  description?: string;
  tariff?: string;
  map_lat?: number;
  map_lon?: number;
  ask_price: string | number;
  ask_currency?: string;
  owner_guaranteed_price?: string | number;
  owner_guaranteed_currency?: string;
  tenant_charge_price?: string | number;
  tenant_charge_currency?: string;
  deposit_amount?: string | number;
  deposit_currency?: string;
  amenities?: string[];
  captions?: string[];
  minimum_stay?: number;
  price_includes?: string[];
  schedule_verification_at?: string;
  translations?: PropertyTranslationMap;
  brokerage?: OneOffBrokerageDraftPayload;
};

/**
 * Submits a new property (managed or one-off) atomically via multipart `POST /properties/submit/`.
 * @param payload - The structured property fields.
 * @param images - Uploaded image files.
 * @returns The created property detail.
 */
export async function submitProperty(
  payload: PropertySubmissionPayload,
  images: File[],
): Promise<PropertyDetail> {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  for (const image of images) {
    formData.append('images', image);
  }
  return await apiUpload<PropertyDetail>('/properties/submit/', formData);
}

/**
 * Patches an existing property. Wraps `PATCH /properties/{id}/`.
 * @param id - Property id.
 * @param payload - The changed fields.
 * @returns The updated property.
 */
export async function updateProperty(
  id: number | string,
  payload: PropertyDraftPayload,
): Promise<PropertyDetail> {
  return await apiFetch<PropertyDetail>(`/properties/${id}/`, { method: 'PATCH', body: payload });
}

/**
 * Atomically patches an existing one-off property and its brokerage terms.
 * @param id - The one-off property identifier.
 * @param payload - Shared property fields plus optional brokerage terms.
 * @returns The updated one-off property detail.
 */
export async function updateOneOffProperty(
  id: number | string,
  payload: Partial<OneOffPropertyDraftPayload>,
): Promise<PropertyDetail> {
  return await apiFetch<PropertyDetail>(`/properties/${id}/one-off/`, {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Uploads one or more photos (multipart). Wraps `POST /properties/{id}/photos/`.
 * @param id - Property id.
 * @param files - The image files.
 * @returns The updated property (with the new photo list).
 */
export async function uploadPropertyPhotos(
  id: number | string,
  files: File[],
): Promise<PropertyDetail> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('images', file);
  }
  return await apiUpload<PropertyDetail>(`/properties/${id}/photos/`, formData);
}

/**
 * Deletes a property photo. Wraps `DELETE /properties/{id}/photos/{photoId}/`.
 * @param id - Property id.
 * @param photoId - The photo id.
 * @returns The updated property.
 */
export async function deletePropertyPhoto(
  id: number | string,
  photoId: number,
): Promise<PropertyDetail> {
  return await apiFetch<PropertyDetail>(`/properties/${id}/photos/${photoId}/`, {
    method: 'DELETE',
  });
}

export type PhotoReorderItem = {
  id: number;
  sort_order: number;
  is_primary: boolean;
  caption?: string;
};

/**
 * Reorders photos / sets the cover. Wraps `PATCH /properties/{id}/photos/reorder/`.
 * @param id - Property id.
 * @param items - The ordered photo descriptors.
 * @returns The updated property.
 */
export async function reorderPropertyPhotos(
  id: number | string,
  items: PhotoReorderItem[],
): Promise<PropertyDetail> {
  return await apiFetch<PropertyDetail>(`/properties/${id}/photos/reorder/`, {
    method: 'PATCH',
    body: { items },
  });
}

/**
 * Schedules a verification visit outside the publish flow (e.g. from an already
 * published but unverified property). Wraps
 * `POST /properties/{id}/verification-visits/`.
 * @param id - Property id.
 * @param scheduledFor - ISO datetime.
 * @param notes - Optional notes.
 */
export async function scheduleVerification(
  id: number | string,
  scheduledFor: string,
  notes = '',
): Promise<void> {
  await apiFetch(`/properties/${id}/verification-visits/`, {
    method: 'POST',
    body: { scheduled_for: scheduledFor, notes },
  });
}

/**
 * Archives (soft-deletes) a property via `DELETE /properties/{id}/`. The backend
 * keeps the row and preserves any related agreement or lease history.
 * @param id - The property id.
 */
export async function deleteProperty(id: number | string): Promise<void> {
  await apiFetch(`/properties/${id}/`, { method: 'DELETE' });
}

export const PROPERTY_TARIFFS = ['standard', 'comfort', 'premium'] as const;
export type PropertyTariff = (typeof PROPERTY_TARIFFS)[number];

export type PropertyListParams = {
  page: number;
  perPage?: number;
  search?: string;
  status?: string;
  districtId?: number | string;
  tariff?: string;
};

export type PropertyListResult = {
  items: ManagementPropertyOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists properties for the workbench table. Wraps the real
 * `GET /management/properties/` endpoint (server-supported: search, status,
 * district_id, tariff, pagination).
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listProperties(params: PropertyListParams): Promise<PropertyListResult> {
  const query = {
    page: params.page,
    per_page: params.perPage,
    search: params.search,
    status: params.status,
    district_id: params.districtId,
    tariff: params.tariff,
  } satisfies Record<string, string | number | undefined>;
  const res = await apiFetch<PaginatedData<ManagementPropertyOutput>>('/management/properties/', {
    query,
  });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

export type StatusCounts = {
  all: number;
  rented: number;
  vacant: number;
  maintenance: number;
  pending_review: number;
};

/**
 * Per-status record counts for the saved-view tabs.
 * BACKEND-GAP: there is no aggregate counts endpoint, so counts are read from
 * parallel lightweight (`per_page: 1`) list calls using the returned `count`.
 * @param search - Optional active search, so tab counts reflect the query.
 * @returns Counts for All plus each status.
 */
export async function getStatusCounts(search?: string): Promise<StatusCounts> {
  const countOf = async (status?: string): Promise<number> => {
    try {
      const query = {
        page: 1,
        per_page: 1,
        search,
        status,
      } satisfies Record<string, string | number | undefined>;
      const res = await apiFetch<PaginatedData<ManagementPropertyOutput>>(
        '/management/properties/',
        { query },
      );
      return res.count;
    } catch {
      return 0;
    }
  };

  const [all, rented, vacant, maintenance, pendingReview] = await Promise.all([
    countOf(),
    countOf('rented'),
    countOf('vacant'),
    countOf('maintenance'),
    countOf('pending_review'),
  ]);
  return { all, rented, vacant, maintenance, pending_review: pendingReview };
}

export type WorkbenchKpis = {
  occupancyRate: number;
  occupancyChange: number;
  vacantUnits: number;
  lossPerDay: string;
  avgRent: number;
  pendingReview: number;
};

/**
 * The four KPI-strip metrics for the workbench. Occupancy and vacancy come from
 * the real `/management/dashboard/` payload; pending-review is a real status
 * count; average rent is derived from a sample page.
 * BACKEND-GAP: no average-rent metric exists server-side — it is averaged over a
 * sample fetch of tenant-charge prices.
 * @param counts - Pre-fetched status counts (reused for pending-review).
 * @returns The KPI bundle.
 */
export async function getWorkbenchKpis(counts: StatusCounts): Promise<WorkbenchKpis> {
  const [dashboard, sample] = await Promise.all([
    apiFetch<ManagementDashboardOutput>('/management/dashboard/').catch(() => null),
    listProperties({ page: 1, perPage: 50 }).catch(
      (): PropertyListResult => ({ items: [], total: 0, totalPages: 1 }),
    ),
  ]);

  const rents = sample.items
    .map((row) => Number(row.tenant_charge_price ?? row.ask_price ?? ''))
    .filter((value) => !Number.isNaN(value) && value > 0);
  const avgRent = rents.length
    ? Math.round(rents.reduce((sum, value) => sum + value, 0) / rents.length)
    : 0;

  return {
    occupancyRate: dashboard?.occupancy.rate ?? 0,
    occupancyChange: dashboard?.kpi.occupied.change ?? 0,
    vacantUnits: dashboard?.kpi.vacant.value ?? counts.vacant,
    lossPerDay: dashboard?.kpi.vacant.loss_per_day ?? '0',
    avgRent,
    pendingReview: counts.pending_review,
  };
}

export type DistrictOption = { id: number; name: string };

/**
 * All districts, for the property form's District select and the filter chip.
 * Reads the real `/marketplace/districts/` list (public, name-ordered), so it
 * works even with an empty portfolio — unlike deriving districts from properties.
 * @returns District options sorted by name.
 */
export async function getDistricts(): Promise<DistrictOption[]> {
  const res = await apiFetch<{ id: number; name: string }[]>('/marketplace/districts/').catch(
    () => null,
  );
  if (!res) {
    return [];
  }
  return res.map(({ id, name }) => ({ id, name })).toSorted((a, b) => a.name.localeCompare(b.name));
}

export type BulkStatusResult = { succeeded: number[]; failed: number[] };

/**
 * Applies a status change to many properties at once.
 * BACKEND-GAP: no batch endpoint — this fans out per-id `PATCH /properties/{id}/`
 * calls and reports partial success so the caller can keep the bulk bar open on
 * failures.
 * @param ids - Property ids to update.
 * @param status - The new status.
 * @returns Which ids succeeded and which failed.
 */
export async function bulkChangeStatus(ids: number[], status: string): Promise<BulkStatusResult> {
  const results = await Promise.allSettled(
    ids.map(
      async (id) => await apiFetch(`/properties/${id}/`, { method: 'PATCH', body: { status } }),
    ),
  );
  const succeeded: number[] = [];
  const failed: number[] = [];
  for (const [index, result] of results.entries()) {
    const id = ids[index];
    if (id === undefined) {
      continue;
    }
    if (result.status === 'fulfilled') {
      succeeded.push(id);
    } else {
      failed.push(id);
    }
  }
  return { succeeded, failed };
}

/**
 * Escapes one CSV cell (quotes fields containing separators, quotes, newlines).
 * @param value - The raw cell value.
 * @returns The escaped cell.
 */
function csvCell(value: string | number): string {
  const text = String(value);
  return /["\n,]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Exports the given property rows as a downloaded CSV file.
 * BACKEND-GAP: no server export endpoint — the CSV is generated client-side.
 * @param rows - The property rows to export.
 * @param filename - The download filename.
 */
export function exportPropertiesCsv(rows: ManagementPropertyOutput[], filename: string): void {
  const headers = [
    'ID',
    'Name',
    'Address',
    'District',
    'Rooms',
    'Area (m2)',
    'Status',
    'Tariff',
    'Ask price',
    'Currency',
  ];
  const body = rows.map((row) =>
    [
      row.id,
      row.name,
      row.address,
      row.district_name ?? '',
      row.rooms ?? '',
      row.area_sqm ?? '',
      row.status,
      row.tariff,
      row.ask_price ?? '',
      row.ask_currency,
    ]
      .map(csvCell)
      .join(','),
  );
  const csv = [headers.join(','), ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** The header columns the bulk-import CSV must carry (header row required). */
export const PROPERTY_IMPORT_COLUMNS = [
  'name',
  'address',
  'district_id',
  'rooms',
  'area_sqm',
  'floor',
  'owner_id',
  'ask_price',
  'owner_guaranteed_price',
  'tenant_charge_price',
] as const;

export type PropertyImportError = { row: number; message: string };

export type PropertyImportResult = {
  created: number;
  errors: PropertyImportError[];
};

/**
 * Bulk-imports properties from a CSV file via
 * `POST /management/properties/import/` (multipart, field `file`).
 * @param file - The CSV file to upload (header row required).
 * @returns The created count plus per-row errors (1-based CSV lines).
 */
export async function importPropertiesCsv(file: File): Promise<PropertyImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return await apiUpload<PropertyImportResult>('/management/properties/import/', formData);
}

/**
 * Downloads a client-generated CSV template (the header row only) for the
 * property bulk import — no backend call.
 * @param filename - The download filename.
 */
export function downloadPropertyImportTemplate(filename: string): void {
  const blob = new Blob([`${PROPERTY_IMPORT_COLUMNS.join(',')}\n`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

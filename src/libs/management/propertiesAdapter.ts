import { apiFetch, apiUpload } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ManagementDashboardOutput, ManagementPropertyOutput } from '@/types/management';
import type { PropertyDetail } from '@/types/property';

/**
 * Properties data adapter — the single isolation point between the Properties
 * Workbench and the backend. Real endpoints are called where they exist; every
 * fallback for a missing capability is marked `BACKEND-GAP` so it is easy to
 * swap for a real endpoint later. No UI component talks to the API directly.
 */

export const PROPERTY_STATUSES = ['rented', 'vacant', 'maintenance', 'pending_review'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export type PropertyDraftPayload = Record<string, string | number | undefined>;

/**
 * Fetches the full management property detail (nullable fields + photos +
 * verification). Backs both the Edit page load and the draft autosave lifecycle.
 * @param id - Property id.
 * @returns The property detail record.
 */
export async function fetchPropertyDetail(id: number | string): Promise<PropertyDetail> {
  return await apiFetch<PropertyDetail>(`/properties/${id}/`);
}

/**
 * Creates a DRAFT property from any subset of touched fields. Wraps
 * `POST /properties/drafts/`.
 * @param payload - The partial field values.
 * @returns The created draft.
 */
export async function createPropertyDraft(payload: PropertyDraftPayload): Promise<PropertyDetail> {
  return await apiFetch<PropertyDetail>('/properties/drafts/', { method: 'POST', body: payload });
}

/**
 * Patches a property (used for autosave and edit saves). Wraps
 * `PATCH /properties/{id}/`.
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

export type PublishResult =
  | { ok: true; property: PropertyDetail }
  | { ok: false; missing: string[] };

/**
 * Publishes a draft (DRAFT → VACANT) with an optional verification visit. On an
 * incomplete draft the backend returns a 422 with machine-readable `missing`
 * field codes, surfaced here so the checklist can light the matching rows.
 * @param id - Property id.
 * @param scheduleVerificationAt - Optional ISO datetime for the verification visit.
 * @returns Success with the published property, or the missing-field codes.
 */
export async function publishProperty(
  id: number | string,
  scheduleVerificationAt?: string,
): Promise<PublishResult> {
  try {
    const property = await apiFetch<PropertyDetail>(`/properties/${id}/publish/`, {
      method: 'POST',
      body: scheduleVerificationAt ? { schedule_verification_at: scheduleVerificationAt } : {},
    });
    return { ok: true, property };
  } catch (error) {
    const { ApiError_ } = await import('@/libs/api');
    if (error instanceof ApiError_) {
      const raw = error.body?.error as { code?: string; missing?: string[] } | undefined;
      if (raw && raw.code === 'incomplete' && Array.isArray(raw.missing)) {
        return { ok: false, missing: raw.missing };
      }
    }
    throw error;
  }
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
 * keeps the row (soft delete) and returns a clean 409 if the property is still
 * referenced by an agreement/lease, which the caller surfaces as an error.
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
  const query: Record<string, string | number> = { page: params.page };
  if (params.perPage) {
    query.per_page = params.perPage;
  }
  if (params.search) {
    query.search = params.search;
  }
  if (params.status) {
    query.status = params.status;
  }
  if (params.districtId) {
    query.district_id = params.districtId;
  }
  if (params.tariff) {
    query.tariff = params.tariff;
  }
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
  draft: number;
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
      const res = await apiFetch<PaginatedData<ManagementPropertyOutput>>(
        '/management/properties/',
        {
          query: {
            page: 1,
            per_page: 1,
            ...(search ? { search } : {}),
            ...(status ? { status } : {}),
          },
        },
      );
      return res.count;
    } catch {
      return 0;
    }
  };

  const [all, rented, vacant, maintenance, pendingReview, draft] = await Promise.all([
    countOf(),
    countOf('rented'),
    countOf('vacant'),
    countOf('maintenance'),
    countOf('pending_review'),
    countOf('draft'),
  ]);
  return { all, rented, vacant, maintenance, pending_review: pendingReview, draft };
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
      () => ({ items: [], total: 0, totalPages: 1 }) as PropertyListResult,
    ),
  ]);

  const rents = sample.items
    .map((row) => Number.parseFloat(row.tenant_charge_price ?? row.ask_price ?? ''))
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
 * The distinct districts present in the portfolio, for the District filter chip.
 * BACKEND-GAP: no `/districts/` list endpoint — districts are derived from a
 * wide properties fetch. Replace with a real endpoint when available.
 * @returns District options sorted by name.
 */
export async function getDistricts(): Promise<DistrictOption[]> {
  const res = await apiFetch<PaginatedData<ManagementPropertyOutput>>('/management/properties/', {
    query: { page: 1, per_page: 200 },
  }).catch(() => null);
  if (!res) {
    return [];
  }
  const map = new Map<number, string>();
  for (const row of res.page.object_list) {
    if (row.district_id !== null && row.district_name !== null) {
      map.set(row.district_id, row.district_name);
    }
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
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
    ids.map(async (id) => {
      await apiFetch(`/properties/${id}/`, { method: 'PATCH', body: { status } });
    }),
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

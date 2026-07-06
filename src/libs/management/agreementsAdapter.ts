import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type {
  AgreementCreatePayload,
  AgreementRenewPayload,
  ManagementAgreementOutput,
} from '@/types/management';

/**
 * Owner-agreements data adapter — the single isolation point between the Owner
 * Agreements Workbench and the backend. Real endpoints are used where they exist
 * (`/management/owner-agreements/` for reads, `/contracts/owner-agreements/…` for
 * writes); every fallback for a missing capability is marked `BACKEND-GAP`. No UI
 * component talks to the API directly.
 */

export const AGREEMENT_STATUSES = ['active', 'expired', 'terminated'] as const;
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

/** Days-to-expiry window that defines the "Expiring soon" saved view / KPI. */
export const AGREEMENT_EXPIRING_WINDOW = 90;

export type AgreementListParams = {
  page: number;
  perPage?: number;
  search?: string;
  status?: string;
  endsWithin?: number;
  ownerId?: number | string;
  propertyId?: number | string;
};

export type AgreementListResult = {
  items: ManagementAgreementOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists owner agreements for the workbench table via `GET /management/owner-agreements/`.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listAgreements(params: AgreementListParams): Promise<AgreementListResult> {
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
  if (params.endsWithin) {
    query.ends_within = params.endsWithin;
  }
  if (params.ownerId) {
    query.owner_id = params.ownerId;
  }
  if (params.propertyId) {
    query.property_id = params.propertyId;
  }
  const res = await apiFetch<PaginatedData<ManagementAgreementOutput>>(
    '/management/owner-agreements/',
    { query },
  );
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

export type AgreementStatusCounts = {
  all: number;
  active: number;
  expiring: number;
  expired: number;
  terminated: number;
};

/**
 * Per-tab record counts for the saved-view tabs.
 * BACKEND-GAP: no aggregate counts endpoint — counts are read from parallel
 * lightweight (`per_page: 1`) list calls using the returned `count`.
 * @param search - Optional active search so tab counts reflect the query.
 * @returns Counts for each saved view.
 */
export async function getAgreementStatusCounts(search?: string): Promise<AgreementStatusCounts> {
  const countOf = async (extra: Record<string, string | number>): Promise<number> => {
    try {
      const res = await apiFetch<PaginatedData<ManagementAgreementOutput>>(
        '/management/owner-agreements/',
        { query: { page: 1, per_page: 1, ...(search ? { search } : {}), ...extra } },
      );
      return res.count;
    } catch {
      return 0;
    }
  };
  const [all, active, expiring, expired, terminated] = await Promise.all([
    countOf({}),
    countOf({ status: 'active' }),
    countOf({ status: 'active', ends_within: AGREEMENT_EXPIRING_WINDOW }),
    countOf({ status: 'expired' }),
    countOf({ status: 'terminated' }),
  ]);
  return { all, active, expiring, expired, terminated };
}

export type AgreementKpis = {
  active: number;
  expiringSoon: number;
  avgCommission: number;
  guaranteedPerMo: number;
};

/**
 * The four KPI-strip metrics for the Owner Agreements workbench.
 * Active + expiring come from real counts; avg. commission is derived from a
 * sample page of active agreements.
 * BACKEND-GAP: the agreement output carries no guaranteed/charged monthly amount,
 * so `guaranteedPerMo` cannot be computed server-side — it returns 0 and the UI
 * renders an em-dash placeholder.
 * @param counts - Pre-fetched status counts.
 * @returns The KPI bundle.
 */
export async function getAgreementKpis(counts: AgreementStatusCounts): Promise<AgreementKpis> {
  const sample = await listAgreements({ page: 1, perPage: 50, status: 'active' }).catch(
    () => ({ items: [], total: 0, totalPages: 1 }) as AgreementListResult,
  );
  const rates = sample.items
    .map((row) => Number.parseFloat(row.commission_rate))
    .filter((value) => Number.isFinite(value) && value > 0);
  const avgCommission = rates.length
    ? Math.round((rates.reduce((sum, value) => sum + value, 0) / rates.length) * 10) / 10
    : 0;
  // BACKEND-GAP: no guaranteed monthly amount on the agreement output.
  const guaranteedPerMo = 0;
  return {
    active: counts.active,
    expiringSoon: counts.expiring,
    avgCommission,
    guaranteedPerMo,
  };
}

/**
 * Creates an owner agreement via `POST /contracts/owner-agreements/`.
 * @param payload - The agreement fields.
 * @returns The created agreement id.
 */
export async function createAgreement(payload: AgreementCreatePayload): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>('/contracts/owner-agreements/', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Renews an owner agreement via `POST /contracts/owner-agreements/{id}/renew/`.
 * @param id - The agreement id.
 * @param payload - The renewal terms.
 * @returns The new agreement id.
 */
export async function renewAgreement(
  id: number,
  payload: AgreementRenewPayload,
): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>(`/contracts/owner-agreements/${id}/renew/`, {
    method: 'POST',
    body: payload,
  });
}

export type AgreementTerminatePayload = {
  end_date?: string;
  reason?: string;
};

/**
 * Terminates an owner agreement via `POST /contracts/owner-agreements/{id}/terminate/`.
 * @param id - The agreement id.
 * @param payload - The end date + reason.
 * @returns The terminated agreement id.
 */
export async function terminateAgreement(
  id: number,
  payload: AgreementTerminatePayload,
): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>(`/contracts/owner-agreements/${id}/terminate/`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Escapes one CSV cell.
 * @param value - The raw value.
 * @returns The escaped cell.
 */
function csvCell(value: string | number): string {
  const text = String(value);
  return /["\n,]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Exports the given agreement rows as a downloaded CSV file.
 * BACKEND-GAP: no server export endpoint — the CSV is generated client-side.
 * @param rows - The agreement rows to export.
 * @param filename - The download filename.
 */
export function exportAgreementsCsv(rows: ManagementAgreementOutput[], filename: string): void {
  const headers = [
    'ID',
    'Agreement',
    'Owner',
    'Property',
    'Signed',
    'Start',
    'End',
    'Commission',
    'Status',
  ];
  const body = rows.map((row) =>
    [
      row.id,
      row.agreement_number,
      row.owner_name,
      row.property_name,
      row.signed_date,
      row.start_date,
      row.end_date,
      row.commission_rate,
      row.status,
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

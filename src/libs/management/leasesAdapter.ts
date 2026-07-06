import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type {
  LeaseCreatePayload,
  LeaseRenewPayload,
  LeaseTerminatePayload,
  ManagementLeaseOutput,
} from '@/types/management';

/**
 * Leases data adapter — the single isolation point between the Leases Workbench
 * and the backend. Real endpoints are used where they exist (`/management/leases/`
 * for reads, `/contracts/leases/…` for writes); every fallback for a missing
 * capability is marked `BACKEND-GAP`. No UI component talks to the API directly.
 */

export const LEASE_STATUSES = ['active', 'renewed', 'terminated', 'expired'] as const;
export type LeaseStatus = (typeof LEASE_STATUSES)[number];

/** Days-to-expiry window that defines the "Expiring soon" saved view / KPI. */
export const LEASE_EXPIRING_WINDOW = 60;

export type LeaseListParams = {
  page: number;
  perPage?: number;
  search?: string;
  status?: string;
  endsWithin?: number;
  propertyId?: number | string;
  tenantId?: number | string;
};

export type LeaseListResult = {
  items: ManagementLeaseOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists leases for the workbench table via `GET /management/leases/`.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listLeases(params: LeaseListParams): Promise<LeaseListResult> {
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
  if (params.propertyId) {
    query.property_id = params.propertyId;
  }
  if (params.tenantId) {
    query.tenant_id = params.tenantId;
  }
  const res = await apiFetch<PaginatedData<ManagementLeaseOutput>>('/management/leases/', {
    query,
  });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

export type LeaseStatusCounts = {
  all: number;
  expiring: number;
  active: number;
  renewed: number;
  terminated: number;
};

/**
 * Per-tab record counts for the saved-view tabs.
 * BACKEND-GAP: no aggregate counts endpoint — counts are read from parallel
 * lightweight (`per_page: 1`) list calls using the returned `count`.
 * @param search - Optional active search so tab counts reflect the query.
 * @returns Counts for each saved view.
 */
export async function getLeaseStatusCounts(search?: string): Promise<LeaseStatusCounts> {
  const countOf = async (extra: Record<string, string | number>): Promise<number> => {
    try {
      const res = await apiFetch<PaginatedData<ManagementLeaseOutput>>('/management/leases/', {
        query: { page: 1, per_page: 1, ...(search ? { search } : {}), ...extra },
      });
      return res.count;
    } catch {
      return 0;
    }
  };
  const [all, expiring, active, renewed, terminated] = await Promise.all([
    countOf({}),
    countOf({ status: 'active', ends_within: LEASE_EXPIRING_WINDOW }),
    countOf({ status: 'active' }),
    countOf({ status: 'renewed' }),
    countOf({ status: 'terminated' }),
  ]);
  return { all, expiring, active, renewed, terminated };
}

export type LeaseKpis = {
  activeLeases: number;
  expiringSoon: number;
  avgTermMonths: number;
  renewalRate: number;
};

/**
 * Whole-month term length between two ISO dates.
 * @param start - ISO start date.
 * @param end - ISO end date.
 * @returns The term in whole months (0 when unparseable).
 */
function termMonths(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return 0;
  }
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
}

/**
 * The four KPI-strip metrics for the Leases workbench.
 * Active + expiring come from real counts; avg. term is derived from a sample.
 * BACKEND-GAP: no avg-term or renewal-rate metric server-side — avg term is
 * averaged over a sample page and renewal rate is derived from renewed vs.
 * terminated counts.
 * @param counts - Pre-fetched status counts.
 * @returns The KPI bundle.
 */
export async function getLeaseKpis(counts: LeaseStatusCounts): Promise<LeaseKpis> {
  const sample = await listLeases({ page: 1, perPage: 50, status: 'active' }).catch(
    () => ({ items: [], total: 0, totalPages: 1 }) as LeaseListResult,
  );
  const terms = sample.items
    .map((row) => termMonths(row.start_date, row.end_date))
    .filter((value) => value > 0);
  const avgTermMonths = terms.length
    ? Math.round(terms.reduce((sum, value) => sum + value, 0) / terms.length)
    : 0;
  const decided = counts.renewed + counts.terminated;
  const renewalRate = decided ? Math.round((counts.renewed / decided) * 100) : 0;
  return {
    activeLeases: counts.active,
    expiringSoon: counts.expiring,
    avgTermMonths,
    renewalRate,
  };
}

/**
 * Creates a lease via `POST /contracts/leases/`.
 * @param payload - The lease fields.
 * @returns The created lease id.
 */
export async function createLease(payload: LeaseCreatePayload): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>('/contracts/leases/', { method: 'POST', body: payload });
}

/**
 * Renews a lease via `POST /contracts/leases/{id}/renew/`.
 * @param id - The lease id.
 * @param payload - The renewal terms.
 * @returns The new lease id.
 */
export async function renewLease(id: number, payload: LeaseRenewPayload): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>(`/contracts/leases/${id}/renew/`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Terminates a lease via `POST /contracts/leases/{id}/terminate/`.
 * @param id - The lease id.
 * @param payload - The end date + reason.
 * @returns The terminated lease id.
 */
export async function terminateLease(
  id: number,
  payload: LeaseTerminatePayload,
): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>(`/contracts/leases/${id}/terminate/`, {
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
 * Exports the given lease rows as a downloaded CSV file.
 * BACKEND-GAP: no server export endpoint — the CSV is generated client-side.
 * @param rows - The lease rows to export.
 * @param filename - The download filename.
 */
export function exportLeasesCsv(rows: ManagementLeaseOutput[], filename: string): void {
  const headers = ['ID', 'Property', 'Tenant', 'Start', 'End', 'Monthly rent', 'Deposit', 'Status'];
  const body = rows.map((row) =>
    [
      row.id,
      row.property_name,
      row.tenant_name,
      row.start_date,
      row.end_date,
      row.monthly_rent,
      row.deposit,
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

import { apiFetch } from '@/libs/api';
import type { ExportTable } from '@/libs/management/exportFile';
import type { PaginatedData } from '@/types/api';
import type { ManagementPayoutOutput, PayoutCreatePayload, PayoutsStats } from '@/types/management';
import type { BulkActionResult } from './paymentsAdapter';

/**
 * Payouts data adapter — the single isolation point between the Payouts
 * Workbench and the backend. Reads go through `GET /management/payouts/`
 * (+ `/stats/`); writes through `/finance/payouts/…`. Every place a capability
 * is missing server-side is marked `BACKEND-GAP`. No UI component talks to the
 * API directly.
 */

export type PayoutListParams = {
  page: number;
  perPage?: number;
  search?: string;
  status?: string;
  ownerId?: number | string;
  scheduledFrom?: string;
  scheduledTo?: string;
  order?: string;
};

export type PayoutListResult = {
  items: ManagementPayoutOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists payouts for the workbench table via `GET /management/payouts/`.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listPayouts(params: PayoutListParams): Promise<PayoutListResult> {
  const query = {
    page: params.page,
    per_page: params.perPage,
    search: params.search,
    status: params.status,
    owner_id: params.ownerId,
    scheduled_from: params.scheduledFrom,
    scheduled_to: params.scheduledTo,
    order: params.order,
  } satisfies Record<string, string | number | undefined>;
  const res = await apiFetch<PaginatedData<ManagementPayoutOutput>>('/management/payouts/', {
    query,
  });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

/**
 * Aggregate money totals + tab counts for the Payouts KPI strip and saved-view
 * tabs, via `GET /management/payouts/stats/`.
 * @returns The payouts stats bundle.
 */
export async function getPayoutsStats(): Promise<PayoutsStats> {
  return await apiFetch<PayoutsStats>('/management/payouts/stats/');
}

/**
 * Creates a manual payout via `POST /finance/payouts/`.
 * @param payload - The payout fields (owner derived from the agreement).
 * @returns The created payout.
 */
export async function createPayout(payload: PayoutCreatePayload): Promise<ManagementPayoutOutput> {
  return await apiFetch<ManagementPayoutOutput>('/finance/payouts/', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Confirms (marks paid) a single payout via `POST /finance/payouts/{id}/mark-paid/`.
 * @param id - The payout id.
 * @returns The updated payout.
 */
export async function markPayoutPaid(id: number): Promise<ManagementPayoutOutput> {
  return await apiFetch<ManagementPayoutOutput>(`/finance/payouts/${id}/mark-paid/`, {
    method: 'POST',
  });
}

/**
 * Confirms many payouts in one call via `POST /finance/payouts/bulk-mark-paid/`.
 * @param ids - The payout ids.
 * @returns Counts of updated vs. skipped rows.
 */
export async function bulkMarkPayoutsPaid(ids: number[]): Promise<BulkActionResult> {
  return await apiFetch<BulkActionResult>('/finance/payouts/bulk-mark-paid/', {
    method: 'POST',
    body: { ids },
  });
}

/**
 * Holds a scheduled payout via `POST /finance/payouts/{id}/hold/`.
 * @param id - The payout id.
 * @param reason - Why the payout is held (required).
 * @returns The updated payout.
 */
export async function holdPayout(id: number, reason: string): Promise<ManagementPayoutOutput> {
  return await apiFetch<ManagementPayoutOutput>(`/finance/payouts/${id}/hold/`, {
    method: 'POST',
    body: { reason },
  });
}

/**
 * Releases a held payout back to scheduled via `POST /finance/payouts/{id}/release/`.
 * @param id - The payout id.
 * @returns The updated payout.
 */
export async function releasePayout(id: number): Promise<ManagementPayoutOutput> {
  return await apiFetch<ManagementPayoutOutput>(`/finance/payouts/${id}/release/`, {
    method: 'POST',
  });
}

/**
 * Cancels a payout via `POST /finance/payouts/{id}/cancel/`.
 * @param id - The payout id.
 * @param reason - Optional cancellation note.
 * @returns The updated payout.
 */
export async function cancelPayout(id: number, reason?: string): Promise<ManagementPayoutOutput> {
  return await apiFetch<ManagementPayoutOutput>(`/finance/payouts/${id}/cancel/`, {
    method: 'POST',
    body: reason ? { reason } : {},
  });
}

/**
 * Builds the export matrix (visible columns, money in original currency) for the
 * shared ExportDialog engine.
 * @param rows - The payout rows to export.
 * @returns The headers + cell matrix.
 */
export function buildPayoutExportRows(rows: ManagementPayoutOutput[]): ExportTable {
  return {
    headers: ['ID', 'Owner', 'Property', 'Scheduled', 'Amount', 'Currency', 'Method', 'Status'],
    rows: rows.map((row) => [
      row.id,
      row.owner_name,
      row.property_name ?? '',
      row.scheduled_date,
      row.amount,
      row.currency,
      row.method,
      row.status,
    ]),
  };
}

import { apiFetch } from '@/libs/api';
import type { ExportTable } from '@/libs/management/exportFile';
import type { PaginatedData } from '@/types/api';
import type {
  ManagementPaymentOutput,
  PaymentCreatePayload,
  PaymentsStats,
} from '@/types/management';

/**
 * Payments data adapter — the single isolation point between the Payments
 * Workbench and the backend. Reads go through `GET /management/payments/`
 * (+ `/stats/`); writes through `/finance/payments/…`. Every place a capability
 * is missing server-side is marked `BACKEND-GAP`. No UI component talks to the
 * API directly.
 */

export type PaymentListParams = {
  page: number;
  perPage?: number;
  search?: string;
  status?: string;
  method?: string;
  propertyId?: number | string;
  leaseId?: number | string;
  tenantId?: number | string;
  dueFrom?: string;
  dueTo?: string;
  overdue?: boolean;
  order?: string;
};

export type PaymentListResult = {
  items: ManagementPaymentOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists payments for the workbench table via `GET /management/payments/`.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listPayments(params: PaymentListParams): Promise<PaymentListResult> {
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
  if (params.method) {
    query.method = params.method;
  }
  if (params.propertyId) {
    query.property_id = params.propertyId;
  }
  if (params.leaseId) {
    query.lease_id = params.leaseId;
  }
  if (params.tenantId) {
    query.tenant_id = params.tenantId;
  }
  if (params.dueFrom) {
    query.due_from = params.dueFrom;
  }
  if (params.dueTo) {
    query.due_to = params.dueTo;
  }
  if (params.overdue) {
    query.overdue = 'true';
  }
  if (params.order) {
    query.order = params.order;
  }
  const res = await apiFetch<PaginatedData<ManagementPaymentOutput>>('/management/payments/', {
    query,
  });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

/**
 * Aggregate money totals + tab counts for the Payments KPI strip and saved-view
 * tabs, via `GET /management/payments/stats/` (sums converted to USD server-side).
 * @param search - Optional active search so figures reflect the query.
 * @returns The payments stats bundle.
 */
export async function getPaymentsStats(search?: string): Promise<PaymentsStats> {
  return await apiFetch<PaymentsStats>('/management/payments/stats/', {
    query: search ? { search } : undefined,
  });
}

/**
 * Creates a payment via `POST /finance/payments/`.
 * @param payload - The payment fields.
 * @returns The created payment id.
 */
export async function createPayment(payload: PaymentCreatePayload): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>('/finance/payments/', { method: 'POST', body: payload });
}

export type MarkPaidOptions = { method?: string; gatewayRef?: string };

/**
 * Marks a single payment paid via `POST /finance/payments/{id}/mark-paid/`.
 * @param id - The payment id.
 * @param options - Optional method / gateway reference overrides.
 * @returns The updated payment.
 */
export async function markPaymentPaid(
  id: number,
  options: MarkPaidOptions = {},
): Promise<ManagementPaymentOutput> {
  const body: Record<string, string> = {};
  if (options.method) {
    body.method = options.method;
  }
  if (options.gatewayRef) {
    body.gateway_ref = options.gatewayRef;
  }
  return await apiFetch<ManagementPaymentOutput>(`/finance/payments/${id}/mark-paid/`, {
    method: 'POST',
    body,
  });
}

export type BulkActionResult = { updated: number; skipped: number };

/**
 * Marks many payments paid in one call via `POST /finance/payments/bulk-mark-paid/`.
 * @param ids - The payment ids.
 * @param method - Optional method applied to all.
 * @returns Counts of updated vs. skipped rows.
 */
export async function bulkMarkPaymentsPaid(
  ids: number[],
  method?: string,
): Promise<BulkActionResult> {
  return await apiFetch<BulkActionResult>('/finance/payments/bulk-mark-paid/', {
    method: 'POST',
    body: method ? { ids, method } : { ids },
  });
}

/**
 * Sends a payment-due reminder for one payment via `POST /finance/payments/{id}/remind/`.
 * @param id - The payment id.
 * @returns The number of reminders sent (0 or 1).
 */
export async function remindPayment(id: number): Promise<{ sent: number }> {
  return await apiFetch<{ sent: number }>(`/finance/payments/${id}/remind/`, { method: 'POST' });
}

/**
 * Sends reminders for many payments via `POST /finance/payments/bulk-remind/`.
 * @param ids - The payment ids.
 * @returns The number of reminders sent.
 */
export async function bulkRemindPayments(ids: number[]): Promise<{ sent: number }> {
  return await apiFetch<{ sent: number }>('/finance/payments/bulk-remind/', {
    method: 'POST',
    body: { ids },
  });
}

/**
 * Builds the export matrix (visible columns, money in original currency) for the
 * shared ExportDialog engine.
 * @param rows - The payment rows to export.
 * @returns The headers + cell matrix.
 */
export function buildPaymentExportRows(rows: ManagementPaymentOutput[]): ExportTable {
  return {
    headers: ['ID', 'Tenant', 'Property', 'Due date', 'Amount', 'Currency', 'Method', 'Status'],
    rows: rows.map((row) => [
      row.id,
      row.tenant_name,
      row.property_name ?? '',
      row.due_date,
      row.amount,
      row.currency,
      row.method,
      row.status,
    ]),
  };
}

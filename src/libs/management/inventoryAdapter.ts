import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type {
  InventoryActCreatePayload,
  InventoryActListOutput,
  InventoryActOutput,
} from '@/types/management';

/**
 * Inventory-acts data adapter — the single isolation point between the Inventory
 * Workbench and the backend. Real endpoints are used where they exist
 * (`/inventory/acts/…`); every fallback for a missing capability is marked
 * `BACKEND-GAP`. No UI component talks to the API directly.
 */

export const INVENTORY_STATUSES = ['draft', 'finalized'] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export const ACT_TYPES = ['handover', 'return', 'general'] as const;
export type ActType = (typeof ACT_TYPES)[number];

export type ActListParams = {
  page: number;
  perPage?: number;
  status?: string;
  propertyId?: number | string;
  leaseId?: number | string;
  /** Finalized-but-unacknowledged acts (`?awaiting_ack=true`). */
  awaitingAck?: boolean;
};

export type ActListResult = {
  items: InventoryActListOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists inventory acts for the workbench table via `GET /inventory/acts/`.
 * BACKEND-GAP: the endpoint offers no `search` param, so free-text search is
 * applied client-side over the loaded page in the page orchestrator.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listActs(params: ActListParams): Promise<ActListResult> {
  const query: Record<string, string | number> = { page: params.page };
  if (params.perPage) {
    query.per_page = params.perPage;
  }
  if (params.status) {
    query.status = params.status;
  }
  if (params.propertyId) {
    query.property_id = params.propertyId;
  }
  if (params.leaseId) {
    query.lease_id = params.leaseId;
  }
  if (params.awaitingAck) {
    query.awaiting_ack = 'true';
  }
  const res = await apiFetch<PaginatedData<InventoryActListOutput>>('/inventory/acts/', { query });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

export type InventoryActStats = {
  counts: {
    draft: number;
    finalized: number;
    awaiting_ack: number;
    all: number;
  };
};

/**
 * Per-tab record counts for the saved-view tabs (Drafts · Finalized · Awaiting
 * acknowledgment · All) via `GET /inventory/acts/stats/`.
 * @returns The stats bundle with per-view counts.
 */
export async function getActStats(): Promise<InventoryActStats> {
  return await apiFetch<InventoryActStats>('/inventory/acts/stats/');
}

/**
 * Fetches a single act's detail (items + photos) via `GET /inventory/acts/{id}/`.
 * @param id - The act id.
 * @returns The full act detail.
 */
export async function getAct(id: number): Promise<InventoryActOutput> {
  return await apiFetch<InventoryActOutput>(`/inventory/acts/${id}/`);
}

/**
 * Creates a draft act via `POST /inventory/acts/`.
 * @param payload - The act fields (property, type, optional lease, notes).
 * @returns The created act id.
 */
export async function createAct(payload: InventoryActCreatePayload): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>('/inventory/acts/', { method: 'POST', body: payload });
}

/**
 * Finalizes a draft act via `POST /inventory/acts/{id}/finalize/`.
 * @param id - The act id.
 * @returns The finalized act id.
 */
export async function finalizeAct(id: number): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>(`/inventory/acts/${id}/finalize/`, { method: 'POST' });
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
 * Exports the given act rows as a downloaded CSV file.
 * BACKEND-GAP: no server export endpoint — the CSV is generated client-side.
 * @param rows - The act rows to export.
 * @param filename - The download filename.
 */
export function exportActsCsv(rows: InventoryActListOutput[], filename: string): void {
  const headers = ['ID', 'Property', 'Lease', 'Type', 'Items', 'Photos', 'Status', 'Created'];
  const body = rows.map((row) =>
    [
      row.id,
      row.property_name,
      row.lease_id ?? '',
      row.act_type,
      row.item_count,
      row.photo_count,
      row.status,
      row.created_at,
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

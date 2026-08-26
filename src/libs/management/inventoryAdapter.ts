import { apiFetch, apiUpload } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { InventoryActListOutput, InventoryActOutput } from '@/types/management';

/**
 * Inventory-acts data adapter — the single isolation point between the Inventory
 * Workbench and the backend. Real endpoints are used where they exist
 * (`/inventory/acts/…`); every fallback for a missing capability is marked
 * `BACKEND-GAP`. No UI component talks to the API directly.
 */

export const INVENTORY_STATUSES = ['finalized'] as const;
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
  const query = {
    page: params.page,
    per_page: params.perPage,
    status: params.status,
    property_id: params.propertyId,
    lease_id: params.leaseId,
    awaiting_ack: params.awaitingAck ? 'true' : undefined,
  } satisfies Record<string, string | number | undefined>;
  const res = await apiFetch<PaginatedData<InventoryActListOutput>>('/inventory/acts/', { query });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

export type InventoryActStats = {
  counts: {
    finalized: number;
    awaiting_ack: number;
    all: number;
  };
};

/**
 * Per-tab record counts for the saved-view tabs (Finalized · Awaiting
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

export type InventoryActItemSubmitPayload = {
  area: string;
  condition?: string;
  notes?: string | null;
  sort_order?: number;
};

export type InventoryActSubmitPayload = {
  property_id: number;
  lease_id?: number | null;
  act_type?: string;
  notes?: string | null;
  items: InventoryActItemSubmitPayload[];
  photo_item_map?: Record<string, number>;
  captions?: string[];
  acknowledged_by_name?: string | null;
  acknowledgment_note?: string | null;
};

export type InventoryActAcknowledgePayload = {
  acknowledged_by_name: string;
  acknowledgment_note?: string | null;
};

/**
 * Submits a complete finalized inventory act with items and photos atomically via `POST /inventory/acts/`.
 * @param payload - Act metadata, items, and mapping.
 * @param images - Binary image files.
 * @returns The created finalized act.
 */
export async function submitAct(
  payload: InventoryActSubmitPayload,
  images: File[],
): Promise<InventoryActOutput> {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  for (const image of images) {
    form.append('images', image);
  }
  return await apiUpload<InventoryActOutput>('/inventory/acts/', form);
}

/**
 * Acknowledges a finalized inventory act via `POST /inventory/acts/{id}/acknowledge/`.
 * @param id - Act ID.
 * @param payload - Acknowledger name and optional note.
 * @returns The updated act.
 */
export async function acknowledgeAct(
  id: number | string,
  payload: InventoryActAcknowledgePayload,
): Promise<InventoryActOutput> {
  return await apiFetch<InventoryActOutput>(`/inventory/acts/${id}/acknowledge/`, {
    method: 'POST',
    body: payload,
  });
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

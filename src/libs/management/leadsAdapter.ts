import { apiFetch, ApiError_ } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { LeadsStats, ManagementLeadOutput } from '@/types/management';

/**
 * Leads data adapter — the single isolation point between the unified Leads
 * triage queue and the backend. Reads go through `GET /management/leads/`
 * (+ `/stats/`); the two lead types (viewing / booking) write through their
 * existing per-type action endpoints. Unread tracking is client-side
 * (BACKEND-GAP: no read-state model) via localStorage.
 */

export type LeadListParams = {
  page: number;
  perPage?: number;
  tab?: string;
  type?: string;
  search?: string;
};

export type LeadListResult = {
  items: ManagementLeadOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists leads for the triage queue via `GET /management/leads/`.
 * @param params - Page, tab, type and search parameters.
 * @returns The page of merged lead rows plus totals.
 */
export async function listLeads(params: LeadListParams): Promise<LeadListResult> {
  const query = {
    page: params.page,
    per_page: params.perPage,
    tab: params.tab,
    type: params.type,
    search: params.search,
  } satisfies Record<string, string | number | undefined>;
  const res = await apiFetch<PaginatedData<ManagementLeadOutput>>('/management/leads/', { query });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

/**
 * Tab counts + open total for the Leads queue via `GET /management/leads/stats/`.
 * @param params - Optional type and search so figures reflect the query.
 * @returns The leads stats bundle.
 */
export async function getLeadsStats(
  params: { type?: string; search?: string } = {},
): Promise<LeadsStats> {
  const query: Record<string, string> = {};
  if (params.type) {
    query.type = params.type;
  }
  if (params.search) {
    query.search = params.search;
  }
  return await apiFetch<LeadsStats>('/management/leads/stats/', {
    query: Object.keys(query).length ? query : undefined,
  });
}

/**
 * Confirms a viewing request via `POST /management/viewing-requests/{id}/confirm/`.
 * @param sourceId - The viewing request id.
 */
export async function confirmViewing(sourceId: number): Promise<void> {
  await apiFetch(`/management/viewing-requests/${sourceId}/confirm/`, { method: 'POST', body: {} });
}

/**
 * Cancels a viewing request via `POST /management/viewing-requests/{id}/cancel/`.
 * @param sourceId - The viewing request id.
 */
export async function cancelViewing(sourceId: number): Promise<void> {
  await apiFetch(`/management/viewing-requests/${sourceId}/cancel/`, { method: 'POST', body: {} });
}

/**
 * Proposes a new time for a viewing request via `POST …/propose-time/`.
 * @param sourceId - The viewing request id.
 * @param payload - The new preferred date and slot.
 */
export async function proposeViewingTime(
  sourceId: number,
  payload: { preferred_date: string; preferred_time?: string },
): Promise<void> {
  await apiFetch(`/management/viewing-requests/${sourceId}/propose-time/`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Approves a booking via `POST /management/bookings/{id}/approve/`.
 * @param sourceId - The booking id.
 */
export async function approveBooking(sourceId: number): Promise<void> {
  await apiFetch(`/management/bookings/${sourceId}/approve/`, { method: 'POST', body: {} });
}

/**
 * Rejects a booking via `POST /management/bookings/{id}/reject/`.
 * @param sourceId - The booking id.
 */
export async function rejectBooking(sourceId: number): Promise<void> {
  await apiFetch(`/management/bookings/${sourceId}/reject/`, { method: 'POST', body: {} });
}

export type ConvertPayload = {
  owner_agreement_id?: number;
  monthly_rent?: string;
  deposit?: string;
  start_date?: string;
  end_date?: string;
};

/**
 * Converts an approved booking to a lease via `POST /management/bookings/{id}/convert/`.
 * @param sourceId - The booking id.
 * @param payload - Optional owner-agreement, rent/deposit, and lease-term overrides.
 * @returns The created lease id (when the response carries it).
 */
export async function convertBooking(
  sourceId: number,
  payload: ConvertPayload = {},
): Promise<{ leaseId: number | null }> {
  const res = await apiFetch<{ converted_lease_id?: number | null }>(
    `/management/bookings/${sourceId}/convert/`,
    { method: 'POST', body: payload },
  );
  return { leaseId: res?.converted_lease_id ?? null };
}

/**
 * Detects the backend's active-lease conflict (HTTP 409, `error: "lease_conflict"`),
 * which drives the convert wizard's "cannot convert" state.
 * @param cause - The thrown value from a failed convert.
 * @returns Whether the error is a lease conflict.
 */
export function isLeaseConflict(cause: unknown): boolean {
  return (
    cause instanceof ApiError_ && (cause.status === 409 || cause.body?.error === 'lease_conflict')
  );
}

// ---- Client-side unread tracking (BACKEND-GAP: no read-state model) ----

const SEEN_KEY = 'ideal_leads_seen';

function readSeen(): Record<string, string> {
  if (!globalThis.window) {
    return {};
  }
  try {
    // SAFETY: LocalStorage seen leads parsed as string map
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Whether a lead is unread — true until it has been opened at its current
 * `updated_at` (a later update re-flags it). Keyed `id:updated_at` in localStorage.
 * @param lead - The lead row.
 * @returns True when the lead has not been seen at its latest revision.
 */
export function isLeadUnread(lead: ManagementLeadOutput): boolean {
  return readSeen()[lead.id] !== lead.updated_at;
}

/**
 * Marks a lead seen at its current `updated_at`.
 * @param lead - The lead row that was opened.
 */
export function markLeadSeen(lead: ManagementLeadOutput): void {
  if (!globalThis.window) {
    return;
  }
  const seen = readSeen();
  seen[lead.id] = lead.updated_at;
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

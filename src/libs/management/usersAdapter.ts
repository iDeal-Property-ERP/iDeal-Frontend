import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { UserInvitePayload, UserOutput, UserUpdatePayload } from '@/types/management';

/**
 * Users data adapter — the single isolation point between the Users Workbench
 * and the backend. Real endpoints are used throughout (`GET /management/users/`
 * for reads, `POST /management/users/invite/` and `PATCH /management/users/{id}/`
 * for writes); every fallback for a missing capability is marked `BACKEND-GAP`.
 * No UI component talks to the API directly.
 */

export const USER_ROLES = ['mgmt', 'owner', 'tenant', 'agent'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type UserListParams = {
  page: number;
  perPage?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
};

export type UserListResult = {
  items: UserOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists users for the workbench table via `GET /management/users/`.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listUsers(params: UserListParams): Promise<UserListResult> {
  const query: Record<string, string | number | boolean> = { page: params.page };
  if (params.perPage) {
    query.per_page = params.perPage;
  }
  if (params.search) {
    query.search = params.search;
  }
  if (params.role) {
    query.role = params.role;
  }
  if (params.isActive !== undefined) {
    query.is_active = params.isActive;
  }
  if (params.isVerified !== undefined) {
    query.is_verified = params.isVerified;
  }
  const res = await apiFetch<PaginatedData<UserOutput>>('/management/users/', { query });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

export type UserRoleCounts = {
  all: number;
  mgmt: number;
  owner: number;
  tenant: number;
  agent: number;
};

/**
 * Per-tab record counts for the saved-view (role) tabs.
 * BACKEND-GAP: no aggregate counts endpoint — counts are read from parallel
 * lightweight (`per_page: 1`) list calls using the returned `count`.
 * @param search - Optional active search so tab counts reflect the query.
 * @returns Counts for each role tab.
 */
export async function getUserRoleCounts(search?: string): Promise<UserRoleCounts> {
  const countOf = async (extra: Record<string, string | number>): Promise<number> => {
    try {
      const res = await apiFetch<PaginatedData<UserOutput>>('/management/users/', {
        query: { page: 1, per_page: 1, ...(search ? { search } : {}), ...extra },
      });
      return res.count;
    } catch {
      return 0;
    }
  };
  const [all, mgmt, owner, tenant, agent] = await Promise.all([
    countOf({}),
    countOf({ role: 'mgmt' }),
    countOf({ role: 'owner' }),
    countOf({ role: 'tenant' }),
    countOf({ role: 'agent' }),
  ]);
  return { all, mgmt, owner, tenant, agent };
}

/**
 * Invites a new user via `POST /management/users/invite/`.
 * @param payload - The invite fields (name, email, role, …).
 * @returns The created user id.
 */
export async function inviteUser(payload: UserInvitePayload): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>('/management/users/invite/', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Updates a user via `PATCH /management/users/{id}/`.
 * @param id - The user id.
 * @param payload - The mutable fields (is_active, is_verified, role).
 * @returns The updated user.
 */
export async function updateUser(id: number, payload: UserUpdatePayload): Promise<UserOutput> {
  return await apiFetch<UserOutput>(`/management/users/${id}/`, { method: 'PATCH', body: payload });
}

/**
 * A relative "time ago" bucket derived from an ISO timestamp.
 * BACKEND-GAP: the API exposes no "last active" timestamp — `updated_at` is used
 * as the proxy for the LAST ACTIVE column, so this measures time since the last
 * record change, not literal last sign-in.
 * @param iso - The ISO timestamp (typically `updated_at`).
 * @returns The coarse unit and its count (e.g. `{ unit: 'days', count: 3 }`).
 */
export function relativeTimeFromNow(iso: string): {
  unit: 'today' | 'days' | 'weeks' | 'months' | 'years';
  count: number;
} {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { unit: 'today', count: 0 };
  }
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) {
    return { unit: 'today', count: 0 };
  }
  if (days < 7) {
    return { unit: 'days', count: days };
  }
  if (days < 30) {
    return { unit: 'weeks', count: Math.floor(days / 7) };
  }
  if (days < 365) {
    return { unit: 'months', count: Math.floor(days / 30) };
  }
  return { unit: 'years', count: Math.floor(days / 365) };
}

/**
 * Escapes one CSV cell.
 * @param value - The raw value.
 * @returns The escaped cell.
 */
function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /["\n,]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Exports the given user rows as a downloaded CSV file.
 * BACKEND-GAP: no server export endpoint — the CSV is generated client-side.
 * @param rows - The user rows to export.
 * @param filename - The download filename.
 */
export function exportUsersCsv(rows: UserOutput[], filename: string): void {
  const headers = ['ID', 'First name', 'Last name', 'Email', 'Phone', 'Role', 'Verified', 'Active'];
  const body = rows.map((row) =>
    [
      row.id,
      row.first_name,
      row.last_name,
      row.email,
      row.phone,
      row.role,
      row.is_verified,
      row.is_active,
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

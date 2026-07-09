import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type {
  ManagementOnboardingApprovePayload,
  ManagementOnboardingDetailOutput,
  ManagementOnboardingOutput,
  OnboardingsStats,
} from '@/types/management';

/**
 * Onboardings data adapter — the single isolation point between the Onboardings
 * triage queue and the backend. The lean list feeds the left rail; the detail
 * endpoint is fetched per-selection to fill the right panel (pricing grid,
 * photos, market comps). All writes go through the existing action endpoints.
 */

export type OnboardingListParams = {
  page: number;
  perPage?: number;
  status?: string;
  search?: string;
};

export type OnboardingListResult = {
  items: ManagementOnboardingOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists onboardings for the queue via `GET /management/onboardings/`.
 * @param params - Page, status and search parameters.
 * @returns The page of onboarding rows plus totals.
 */
export async function listOnboardings(params: OnboardingListParams): Promise<OnboardingListResult> {
  const query: Record<string, string | number> = { page: params.page };
  if (params.perPage) {
    query.per_page = params.perPage;
  }
  if (params.status) {
    query.status = params.status;
  }
  if (params.search) {
    query.search = params.search;
  }
  const res = await apiFetch<PaginatedData<ManagementOnboardingOutput>>(
    '/management/onboardings/',
    {
      query,
    },
  );
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

/**
 * Fetches the rich onboarding detail via `GET /management/onboardings/{id}/`.
 * @param id - The onboarding id.
 * @returns The onboarding detail (pricing grid, photos, market comps).
 */
export async function getOnboarding(id: number): Promise<ManagementOnboardingDetailOutput> {
  return await apiFetch<ManagementOnboardingDetailOutput>(`/management/onboardings/${id}/`);
}

/**
 * Tab counts + open total via `GET /management/onboardings/stats/`.
 * @returns The onboardings stats bundle.
 */
export async function getOnboardingsStats(): Promise<OnboardingsStats> {
  return await apiFetch<OnboardingsStats>('/management/onboardings/stats/');
}

/**
 * Approves an onboarding via `POST /management/onboardings/{id}/approve/`.
 * @param id - The onboarding id.
 * @param payload - Pricing, commission, agreement number and term dates.
 */
export async function approveOnboarding(
  id: number,
  payload: ManagementOnboardingApprovePayload,
): Promise<void> {
  await apiFetch(`/management/onboardings/${id}/approve/`, { method: 'POST', body: payload });
}

/**
 * Rejects an onboarding via `POST /management/onboardings/{id}/reject/`.
 * @param id - The onboarding id.
 * @param reviewNotes - Optional reason surfaced to the owner.
 */
export async function rejectOnboarding(id: number, reviewNotes?: string): Promise<void> {
  await apiFetch(`/management/onboardings/${id}/reject/`, {
    method: 'POST',
    body: { review_notes: reviewNotes },
  });
}

/**
 * Requests more info from the owner via `POST …/request-info/`.
 * @param id - The onboarding id.
 * @param note - The message to the owner.
 */
export async function requestOnboardingInfo(id: number, note: string): Promise<void> {
  await apiFetch(`/management/onboardings/${id}/request-info/`, {
    method: 'POST',
    body: { note },
  });
}

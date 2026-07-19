import { apiFetch, apiUpload } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type {
  BrokerageCommissionStats,
  OneOffChannel,
  OneOffDeal,
  OneOffDealStatus,
} from '@/types/management';

export type OneOffDealListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: OneOffDealStatus;
  channel?: OneOffChannel;
};

export type OneOffDealCreatePayload = {
  name: string;
  address?: string;
  seller: { name: string; phone: string; email?: string };
  channel: OneOffChannel;
  commission_type: 'none' | 'fixed' | 'percentage';
  commission_fixed_amount?: string;
  commission_percentage?: string;
  commission_currency: 'USD' | 'UZS';
  ask_price?: string;
  ask_currency?: 'USD' | 'UZS';
};

/**
 * Lists one-off deals for the staff-only brokerage workbench.
 *
 * @param params Optional pagination and filter parameters.
 * @returns A page of one-off brokerage deals.
 */
export async function listOneOffDeals(
  params: OneOffDealListParams = {},
): Promise<PaginatedData<OneOffDeal>> {
  return await apiFetch<PaginatedData<OneOffDeal>>('/management/one-off-deals/', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      search: params.search,
      status: params.status,
      channel: params.channel,
    },
  });
}

/**
 * Creates the one-off property and staff-only deal atomically.
 *
 * @param payload The property, contact, channel, and commission details.
 * @returns The newly created brokerage deal.
 */
export async function createOneOffDeal(payload: OneOffDealCreatePayload): Promise<OneOffDeal> {
  return await apiFetch<OneOffDeal>('/management/one-off-deals/', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Activates a brokerage deal and, when public, publishes its marketplace listing.
 *
 * @param id The brokerage deal identifier.
 * @returns The activated brokerage deal.
 */
export async function activateOneOffDeal(id: number): Promise<OneOffDeal> {
  return await apiFetch<OneOffDeal>(`/management/one-off-deals/${id}/activate/`, {
    method: 'POST',
    body: {},
  });
}

/**
 * Closes a one-off deal as won and creates its expected commission snapshot.
 *
 * @param id The brokerage deal identifier.
 * @param payload The renter, agreed rent, and closure details.
 * @returns The closed brokerage deal.
 */
export async function closeOneOffDealWon(
  id: number,
  payload: {
    renter: { name: string; phone: string; email?: string };
    agreed_monthly_rent: string;
    agreed_currency: 'USD' | 'UZS';
    close_date: string;
    notes?: string;
    keep_property_active?: boolean;
  },
): Promise<OneOffDeal> {
  return await apiFetch<OneOffDeal>(`/management/one-off-deals/${id}/close-won/`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Closes a one-off deal as lost and archives its staff-only record.
 *
 * @param id The brokerage deal identifier.
 * @param payload The closure date and optional notes.
 * @returns The closed brokerage deal.
 */
export async function closeOneOffDealLost(
  id: number,
  payload: { close_date: string; notes?: string; keep_property_active?: boolean },
): Promise<OneOffDeal> {
  return await apiFetch<OneOffDeal>(`/management/one-off-deals/${id}/close-lost/`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Records the one full commission receipt allowed in v1.
 *
 * @param id The brokerage deal identifier.
 * @param payload The immutable commission receipt details.
 * @returns The brokerage deal with its recorded receipt.
 */
export async function recordOneOffReceipt(
  id: number,
  payload: {
    amount: string;
    currency: 'USD' | 'UZS';
    received_date: string;
    method: string;
    reference?: string;
  },
): Promise<OneOffDeal> {
  return await apiFetch<OneOffDeal>(`/management/one-off-deals/${id}/receipt/`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Uploads PDF or image proof for an already-recorded commission receipt.
 *
 * @param id The brokerage deal identifier.
 * @param files The receipt-proof files.
 * @returns The deal with its updated receipt attachments.
 */
export async function uploadOneOffReceiptAttachments(
  id: number,
  files: File[],
): Promise<OneOffDeal> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  return await apiUpload<OneOffDeal>(
    `/management/one-off-deals/${id}/receipt/attachments/`,
    formData,
  );
}

/**
 * Fetches expected and received brokerage revenue without mixing it into rent collections.
 *
 * @returns The brokerage revenue rollup.
 */
export async function getBrokerageCommissionStats(): Promise<BrokerageCommissionStats> {
  return await apiFetch<BrokerageCommissionStats>('/management/brokerage-commissions/stats/');
}

/**
 * Deletes a one-off deal.
 *
 * @param id The deal ID.
 * @returns A promise that resolves when deleted.
 */
export async function deleteOneOffDeal(id: number): Promise<void> {
  await apiFetch(`/management/one-off-deals/${id}/`, {
    method: 'DELETE',
  });
}

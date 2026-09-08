import { apiFetch } from '@/libs/api';
import type { SupportInquiryPayload, SupportInquiryResponse } from '@/types/support';

/**
 * Submits a public support inquiry to the backend.
 * @param payload - User contact details and inquiry message.
 * @returns Server response with inquiry ID and status.
 */
export async function submitSupportInquiry(
  payload: SupportInquiryPayload,
): Promise<SupportInquiryResponse> {
  return await apiFetch<SupportInquiryResponse>('/support/inquiries/', {
    method: 'POST',
    body: payload,
  });
}

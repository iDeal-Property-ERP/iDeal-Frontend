import { apiFetch } from '@/libs/api';
import type {
  ConfirmDeletionPayload,
  ConfirmDeletionResponse,
  DeletionChannelsResponse,
  RequestDeletionOtpPayload,
  RequestDeletionOtpResponse,
} from '@/types/accountDeletion';

/**
 * Fetches available OTP delivery channels for account deletion.
 * @returns Supported OTP channels.
 */
export async function getDeletionChannels(): Promise<DeletionChannelsResponse> {
  return await apiFetch<DeletionChannelsResponse>('/users/deletion/channels/');
}

/**
 * Requests an OTP verification code for public account deletion.
 * @param payload - Phone number and optional delivery channel.
 * @returns OTP dispatch metadata including expiration and resend delay.
 */
export async function requestDeletionOtp(
  payload: RequestDeletionOtpPayload,
): Promise<RequestDeletionOtpResponse> {
  return await apiFetch<RequestDeletionOtpResponse>('/users/deletion/otp/request/', {
    method: 'POST',
    body: {
      phone: payload.phone,
      channel: payload.channel ?? 'telegram',
    },
  });
}

/**
 * Confirms OTP code and deletes the user account.
 * @param payload - Phone number and 6-digit OTP verification code.
 * @returns Deletion status confirmation.
 */
export async function confirmAccountDeletion(
  payload: ConfirmDeletionPayload,
): Promise<ConfirmDeletionResponse> {
  return await apiFetch<ConfirmDeletionResponse>('/users/deletion/confirm/', {
    method: 'POST',
    body: payload,
  });
}

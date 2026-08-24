export type AccountDeletionChannel = 'sms' | 'telegram';

export type DeletionChannelsResponse = {
  channels: AccountDeletionChannel[];
};

export type RequestDeletionOtpPayload = {
  phone: string;
  channel?: AccountDeletionChannel;
};

export type RequestDeletionOtpResponse = {
  channel: string;
  expires_in: number;
  resend_after: number;
};

export type ConfirmDeletionPayload = {
  phone: string;
  code: string;
};

export type ConfirmDeletionResponse = {
  deleted: boolean;
};

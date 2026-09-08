export type SupportInquiryPayload = {
  name: string;
  email: string;
  message: string;
  website_url?: string;
};

export type SupportInquiryResponse = {
  id?: number | null;
  status: string;
  message: string;
};

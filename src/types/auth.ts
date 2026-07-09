import type { Role } from './enums';

export type LoginPayload = {
  username: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
};

export type RefreshPayload = {
  refresh_token: string;
};

export type VerifyPayload = {
  token: string;
};

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  patronymic: string | null;
  username: string;
  phone: string;
  email: string;
  role: Role;
  is_active: boolean;
  is_verified: boolean;
  must_change_password: boolean;
  nationality: string | null;
  is_staff: boolean;
  is_superuser: boolean;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
};

/** Shared API response envelope and pagination types */

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  error: string;
};

export type PaginatedData<T> = {
  count: number;
  num_pages: number;
  per_page: number;
  page: {
    number: number;
    object_list: T[];
  };
};

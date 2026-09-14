import type { PaginatedData } from '@/types/api';

/**
 * Reads the current page of items from a paginated API envelope.
 * @param payload - Paginated data, a bare array, or a missing value.
 * @returns The item list, or an empty array when the envelope is absent.
 */
export function paginatedItems<T>(payload: PaginatedData<T> | T[] | null | undefined): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  const items = payload?.page?.object_list;
  return Array.isArray(items) ? items : [];
}

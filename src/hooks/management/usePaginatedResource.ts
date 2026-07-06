'use client';

import { useEffect, useRef, useState } from 'react';

export type QueryParams = Record<string, string | number | undefined>;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  totalPages: number;
};

type Options = {
  /** Initial query applied on first load. */
  initialQuery?: QueryParams;
};

type Fetcher<T> = (args: { page: number; query: QueryParams }) => Promise<PaginatedResult<T>>;

/**
 * Generic client-side paginated-resource hook — the reusable data spine for
 * every Management workbench. Owns page / query / loading / error state and
 * refetches whenever the page, the serialized query, or an explicit refetch
 * changes. Changing the query always resets to page 1.
 * @param fetcher - Loads one page for the given page number and query.
 * @param options - Optional initial query.
 * @returns Resource state plus page and query setters and a refetch trigger.
 */
export function usePaginatedResource<T>(fetcher: Fetcher<T>, options: Options = {}) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [query, setQueryState] = useState<QueryParams>(options.initialQuery ?? {});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Refs keep the fetcher and live query out of the effect deps so the effect
  // stays keyed on primitives (page / serialized query / reload) — no identity
  // churn, no exhaustive-deps escape hatch.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const queryRef = useRef(query);
  queryRef.current = query;

  const queryKey = JSON.stringify(query);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    const load = async () => {
      try {
        const result = await fetcherRef.current({ page, query: queryRef.current });
        if (active) {
          setData(result.items);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [page, queryKey, reloadKey]);

  /**
   * Replaces the whole query and resets to page 1.
   * @param next - The new query params.
   */
  function setQuery(next: QueryParams) {
    setQueryState(next);
    setPage(1);
  }

  /**
   * Merges a partial patch into the query and resets to page 1.
   * @param patch - The query params to merge in (undefined clears a key).
   */
  function patchQuery(patch: QueryParams) {
    setQueryState((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  return {
    data,
    isLoading,
    error: loadError,
    page,
    setPage,
    total,
    totalPages,
    query,
    setQuery,
    patchQuery,
    refetch: () => setReloadKey((key) => key + 1),
  };
}

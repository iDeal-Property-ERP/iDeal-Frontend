'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'ideal_favorites';

function read(): number[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

/**
 * Client-side favorites for anonymous marketplace browsing (no server account needed).
 * Persists listing ids to localStorage and syncs across hook instances via a storage event.
 * @returns The favorite ids plus `toggle` and `isFavorite` helpers.
 */
export function useFavorites() {
  const [ids, setIds] = useState<number[]>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        setIds(read());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((id: number) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: number) => ids.includes(id), [ids]);

  return { ids, toggle, isFavorite };
}

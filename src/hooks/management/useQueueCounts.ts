'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/libs/api';
import type { QueueCounts } from '@/types/management';

const POLL_MS = 60_000;

/**
 * Fetches the sidebar queue-badge counts for management users. Polls
 * `GET /management/queue-counts/` on mount, every 60s, and whenever `pathname`
 * changes (so acting on a queue refreshes its badge). Only runs when `enabled`
 * (management role); returns an empty map otherwise, so non-mgmt roles never
 * hit the endpoint.
 * @param enabled - Whether the current user is a management user.
 * @param pathname - The active pathname; a change triggers a refresh.
 * @returns The queue-counts map keyed by module (leads/onboardings/…).
 */
export function useQueueCounts(enabled: boolean, pathname: string): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) {
      return () => {
        // Not enabled — no poll to tear down.
      };
    }
    let active = true;
    const load = () => {
      apiFetch<QueueCounts>('/management/queue-counts/')
        .then((data) => {
          if (active) {
            setCounts(data as unknown as Record<string, number>);
          }
        })
        .catch(() => {
          // Badge counts are non-critical; leave the last-known map on failure.
        });
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [enabled, pathname]);

  return enabled ? counts : {};
}

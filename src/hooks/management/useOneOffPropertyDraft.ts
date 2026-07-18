'use client';

import { useCallback, useRef, useState } from 'react';
import {
  createOneOffPropertyDraft,
  updateOneOffProperty,
} from '@/libs/management/propertiesAdapter';
import type { OneOffPropertyDraftPayload } from '@/libs/management/propertiesAdapter';
import type { DraftState } from './usePropertyDraft';

type UseOneOffPropertyDraftResult = {
  draftId: number | null;
  state: DraftState;
  schedule: (values: OneOffPropertyDraftPayload) => void;
  flush: (values?: OneOffPropertyDraftPayload) => Promise<number | null>;
};

const DEBOUNCE_MS = 1500;

/**
 * Autosaves the shared property draft and one-off brokerage draft atomically.
 * @param initialId Existing one-off property identifier, if editing.
 * @returns The one-off draft lifecycle controls.
 */
export function useOneOffPropertyDraft(initialId?: number): UseOneOffPropertyDraftResult {
  const [draftId, setDraftId] = useState<number | null>(initialId ?? null);
  const [state, setState] = useState<DraftState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<OneOffPropertyDraftPayload | null>(null);
  const inFlight = useRef<Promise<number | null> | null>(null);
  const idRef = useRef<number | null>(initialId ?? null);
  const creating = useRef<Promise<void> | null>(null);

  const persist = useCallback(
    async (values: OneOffPropertyDraftPayload): Promise<number | null> => {
      setState('saving');
      try {
        let createdHere = false;
        if (idRef.current === null) {
          if (creating.current) {
            await creating.current;
          }
          if (idRef.current === null) {
            const createPromise = createOneOffPropertyDraft(values).then((created) => {
              idRef.current = created.id;
              setDraftId(created.id);
            });
            creating.current = createPromise;
            try {
              await createPromise;
              createdHere = true;
            } finally {
              creating.current = null;
            }
          }
        }
        if (idRef.current !== null && !createdHere) {
          await updateOneOffProperty(idRef.current, values);
        }
        setState('saved');
        return idRef.current;
      } catch {
        setState('error');
        return idRef.current;
      }
    },
    [],
  );

  const schedule = useCallback(
    (values: OneOffPropertyDraftPayload) => {
      pending.current = values;
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        const next = pending.current;
        pending.current = null;
        if (next) {
          inFlight.current = persist(next);
        }
      }, DEBOUNCE_MS);
    },
    [persist],
  );

  const flush = useCallback(
    async (values?: OneOffPropertyDraftPayload) => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      const next = values ?? pending.current;
      pending.current = null;
      if (inFlight.current) {
        await inFlight.current;
      }
      return next ? await persist(next) : idRef.current;
    },
    [persist],
  );

  return { draftId, state, schedule, flush };
}

'use client';

import { useCallback, useRef, useState } from 'react';
import { createPropertyDraft, updateProperty } from '@/libs/management/propertiesAdapter';
import type { PropertyDraftPayload } from '@/libs/management/propertiesAdapter';

export type DraftState = 'idle' | 'saving' | 'saved' | 'error';

export type UsePropertyDraftResult = {
  draftId: number | null;
  state: DraftState;
  savedAt: number | null;
  /** Queue a debounced autosave from the current form values. */
  schedule: (values: PropertyDraftPayload) => void;
  /** Force any pending save to flush now (call before publish). */
  flush: (values?: PropertyDraftPayload) => Promise<number | null>;
};

const DEBOUNCE_MS = 1500;

/**
 * Autosave lifecycle for the property create form. No draft row is created until
 * the first meaningful change; thereafter changes are debounced into a
 * `PATCH /properties/{id}/`. A draft created here starts on the backend as
 * `status=draft`.
 * @param initialId - Existing draft/property id when editing (skips creation).
 * @returns Draft id, save state, and schedule/flush controls.
 */
export function usePropertyDraft(initialId?: number): UsePropertyDraftResult {
  const [draftId, setDraftId] = useState<number | null>(initialId ?? null);
  const [state, setState] = useState<DraftState>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<PropertyDraftPayload | null>(null);
  const inFlight = useRef<Promise<number | null> | null>(null);
  const idRef = useRef<number | null>(initialId ?? null);
  // Guards against creating two drafts when a second save fires while the first
  // POST /drafts/ is still in flight — later saves await it, then PATCH.
  const creating = useRef<Promise<void> | null>(null);

  const persist = useCallback(async (values: PropertyDraftPayload): Promise<number | null> => {
    setState('saving');
    try {
      const clean: PropertyDraftPayload = {};
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== '') {
          clean[key] = value;
        }
      }
      // If a create is already in flight, wait for it so we PATCH instead of
      // POSTing a duplicate draft.
      if (idRef.current === null && creating.current) {
        await creating.current;
      }
      if (idRef.current === null) {
        const createPromise = createPropertyDraft(clean).then((created) => {
          idRef.current = created.id;
          setDraftId(created.id);
        });
        creating.current = createPromise;
        try {
          await createPromise;
        } finally {
          creating.current = null;
        }
      } else {
        await updateProperty(idRef.current, clean);
      }
      setState('saved');
      setSavedAt(Date.now());
      return idRef.current;
    } catch {
      setState('error');
      return idRef.current;
    }
  }, []);

  const schedule = useCallback(
    (values: PropertyDraftPayload) => {
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
    async (values?: PropertyDraftPayload): Promise<number | null> => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      const next = values ?? pending.current;
      pending.current = null;
      if (inFlight.current) {
        await inFlight.current;
      }
      if (next) {
        inFlight.current = persist(next);
        return await inFlight.current;
      }
      return idRef.current;
    },
    [persist],
  );

  return { draftId, state, savedAt, schedule, flush };
}

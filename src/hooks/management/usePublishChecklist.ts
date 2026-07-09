'use client';

import { useMemo } from 'react';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';

export const MIN_PUBLISH_PHOTOS = 5;

export type ChecklistRowId = 'basics' | 'owner' | 'pricing' | 'photos' | 'verification';

export type ChecklistRow = {
  id: ChecklistRowId;
  done: boolean;
  /** Backend `missing` field codes that belong to this row. */
  codes: string[];
};

/** Maps a backend `missing` field code to the checklist row it belongs to. */
const CODE_TO_ROW: Record<string, ChecklistRowId> = {
  name: 'basics',
  address: 'basics',
  district: 'basics',
  rooms: 'basics',
  area_sqm: 'basics',
  floor: 'basics',
  owner: 'owner',
  ask_price: 'pricing',
  owner_guaranteed_price: 'pricing',
  tenant_charge_price: 'pricing',
  photos: 'photos',
};

export type UsePublishChecklistArgs = {
  values: ManagementPropertyFormData;
  photoCount: number;
  verificationScheduled: boolean;
  /** Field codes the server flagged on the last failed publish attempt. */
  serverMissing: Set<string>;
};

/**
 * Derives the publish checklist rows purely from the form values, photo count,
 * and verification state. A failed publish's server `missing` codes override the
 * client view so the same rows light up.
 * @param args - Form values, photo count, verification flag, server-missing set.
 * @returns The checklist rows plus an all-complete flag.
 */
export function usePublishChecklist(args: UsePublishChecklistArgs): {
  rows: ChecklistRow[];
  allComplete: boolean;
} {
  const { values, photoCount, verificationScheduled, serverMissing } = args;

  return useMemo(() => {
    const serverRows = new Set<ChecklistRowId>();
    for (const code of serverMissing) {
      const row = CODE_TO_ROW[code];
      if (row) {
        serverRows.add(row);
      }
    }

    const basicsDone =
      Boolean(values.name) &&
      Boolean(values.address) &&
      Boolean(values.district_id) &&
      Boolean(values.rooms) &&
      Boolean(values.area_sqm) &&
      Boolean(values.floor) &&
      !serverRows.has('basics');
    const ownerDone = Boolean(values.owner_id) && !serverRows.has('owner');
    const pricingDone =
      Boolean(values.ask_price) &&
      Boolean(values.owner_guaranteed_price) &&
      Boolean(values.tenant_charge_price) &&
      !serverRows.has('pricing');
    const photosDone = photoCount >= MIN_PUBLISH_PHOTOS && !serverRows.has('photos');

    const rows: ChecklistRow[] = [
      { id: 'basics', done: basicsDone, codes: ['district', 'rooms', 'area_sqm', 'floor'] },
      { id: 'owner', done: ownerDone, codes: ['owner'] },
      {
        id: 'pricing',
        done: pricingDone,
        codes: ['ask_price', 'owner_guaranteed_price', 'tenant_charge_price'],
      },
      { id: 'photos', done: photosDone, codes: ['photos'] },
      { id: 'verification', done: verificationScheduled, codes: [] },
    ];

    const allComplete = basicsDone && ownerDone && pricingDone && photosDone;
    return { rows, allComplete };
  }, [values, photoCount, verificationScheduled, serverMissing]);
}

'use client';

/* eslint-disable complexity */
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
const CODE_TO_ROW = {
  name: 'basics',
  address: 'basics',
  district: 'basics',
  rooms: 'basics',
  area_sqm: 'basics',
  floor: 'basics',
  total_floors: 'basics',
  owner: 'owner',
  ask_price: 'pricing',
  owner_guaranteed_price: 'pricing',
  tenant_charge_price: 'pricing',
  photos: 'photos',
} satisfies Record<string, ChecklistRowId>;

export type UsePublishChecklistArgs = {
  values: ManagementPropertyFormData;
  photoCount: number;
  verificationScheduled: boolean;
  engagementType: 'managed' | 'one_off';
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
  const { values, photoCount, verificationScheduled, engagementType, serverMissing } = args;

  return useMemo(() => {
    const serverRows = new Set<ChecklistRowId>();
    for (const code of serverMissing) {
      if (code in CODE_TO_ROW) {
        // SAFETY: Code validated as key of CODE_TO_ROW map
        const row = CODE_TO_ROW[code as keyof typeof CODE_TO_ROW];
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
      Boolean(values.total_floors) &&
      !serverRows.has('basics');
    const ownerDone = Boolean(values.owner_id) && !serverRows.has('owner');
    const pricingDone =
      Boolean(values.ask_price) &&
      Boolean(values.owner_guaranteed_price) &&
      Boolean(values.tenant_charge_price) &&
      !serverRows.has('pricing');
    const photosDone = photoCount >= MIN_PUBLISH_PHOTOS && !serverRows.has('photos');

    const rows: ChecklistRow[] = [
      {
        id: 'basics',
        done: basicsDone,
        codes: ['district', 'rooms', 'area_sqm', 'floor', 'total_floors'],
      },
      ...(engagementType !== 'one_off'
        ? [{ id: 'owner' as const, done: ownerDone, codes: ['owner'] }]
        : []),
      ...(engagementType !== 'one_off'
        ? [
            {
              id: 'pricing' as const,
              done: pricingDone,
              codes: ['ask_price', 'owner_guaranteed_price', 'tenant_charge_price'],
            },
          ]
        : []),
      { id: 'photos', done: photosDone, codes: ['photos'] },
      ...(engagementType !== 'one_off'
        ? [{ id: 'verification' as const, done: verificationScheduled, codes: [] }]
        : []),
    ];

    const allComplete =
      basicsDone && (engagementType === 'one_off' || (ownerDone && pricingDone)) && photosDone;
    return { rows, allComplete };
  }, [values, photoCount, verificationScheduled, engagementType, serverMissing]);
}

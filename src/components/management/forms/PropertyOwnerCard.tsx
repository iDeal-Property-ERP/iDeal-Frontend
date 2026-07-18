'use client';

import type { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { OwnerSelect } from '@/components/ui/entity-selects';
import { EntityField } from '@/components/ui/form-fields';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';

type Translator = ReturnType<typeof useTranslations>;

type PropertyOwnerCardProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
  initialLabel?: string;
};

/**
 * Derives up-to-two-letter initials from a display name.
 * @param label - The owner's full name.
 * @returns The uppercased initials.
 */
function initialsFor(label: string): string {
  const parts = label.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * The right-rail Owner card. When an owner is already linked (edit mode) it shows
 * the Figma "selected" treatment — avatar initials, the owner name, and a Change
 * action — collapsing to the owner combobox when Change is pressed or when no
 * owner is set yet (create). Bound to `owner_id`.
 * @param props - Form control, translator, and an optional preselected owner label.
 * @returns The owner card.
 */
export function PropertyOwnerCard(props: PropertyOwnerCardProps) {
  const { control, t, initialLabel } = props;
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-[16px] border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-semibold tracking-[0.4px] text-muted-foreground uppercase">
        {t('form_owner')} <span className="text-danger">*</span>
      </p>
      <div className="mt-3">
        <EntityField control={control} name="owner_id" label="">
          {(field, invalid) => {
            const hasOwner = field.value !== null && field.value !== undefined;
            const handleOwnerChange = field.onChange;
            // Resting state: a linked owner we can label (edit mode) and not
            // actively changing. Otherwise fall back to the combobox.
            if (hasOwner && initialLabel && !editing) {
              return (
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary-subtle-foreground">
                    {initialsFor(initialLabel)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{initialLabel}</p>
                    {/* BACKEND-GAP: OwnerBrief carries no agreement number or
                        commission %, so the Figma "AGR-… · 20% commission" line
                        is omitted until the API exposes it — never fabricated. */}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setEditing(true)}
                  >
                    {t('form_owner_change')}
                  </Button>
                </div>
              );
            }
            return (
              <OwnerSelect
                id="owner_id"
                value={field.value as number | null | undefined}
                onChange={handleOwnerChange}
                initialLabel={initialLabel}
                aria-invalid={invalid}
                placeholder={t('form_owner_placeholder')}
              />
            );
          }}
        </EntityField>
      </div>
    </div>
  );
}

'use client';

import type { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';
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
 * The right-rail Owner card — an owner combobox bound to `owner_id`, matching the
 * Figma "OWNER · Change" panel.
 * @param props - Form control, translator, and an optional preselected owner label.
 * @returns The owner card.
 */
export function PropertyOwnerCard(props: PropertyOwnerCardProps) {
  const { control, t, initialLabel } = props;
  return (
    <div className="rounded-[16px] border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-semibold tracking-[0.4px] text-muted-foreground uppercase">
        {t('form_owner')}
      </p>
      <div className="mt-3">
        <EntityField control={control} name="owner_id" label="" required>
          {(field, invalid) => (
            <OwnerSelect
              id="owner_id"
              value={field.value as number | null | undefined}
              onChange={field.onChange}
              initialLabel={initialLabel}
              aria-invalid={invalid}
              placeholder={t('form_owner_placeholder')}
            />
          )}
        </EntityField>
      </div>
    </div>
  );
}

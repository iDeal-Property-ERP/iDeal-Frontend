'use client';

import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { ChecklistRow } from '@/hooks/management/usePublishChecklist';

type Translator = ReturnType<typeof useTranslations>;

type PublishChecklistProps = {
  rows: ChecklistRow[];
  t: Translator;
};

/**
 * Renders the leading status icon for a checklist row: check (done), open circle
 * (optional & not done), or alert (required & not done).
 * @param props - Whether the row is done and whether it is optional.
 * @returns The row status icon.
 */
function ChecklistIcon(props: { done: boolean; optional: boolean }) {
  if (props.done) {
    return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />;
  }
  if (props.optional) {
    return <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
  }
  return <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />;
}

/**
 * The right-rail publish checklist. Each row pairs a status icon with a localized
 * label + hint so meaning is never color-only. A failed publish's server `missing`
 * codes flip the matching rows back to incomplete.
 * @param props - The checklist rows and translator.
 * @returns The checklist panel.
 */
export function PublishChecklist(props: PublishChecklistProps) {
  const { rows, t } = props;
  return (
    <div className="rounded-[16px] border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-semibold tracking-[0.4px] text-muted-foreground uppercase">
        {t('checklist_title')}
      </p>
      <ul className="mt-4 space-y-3.5">
        {rows.map((row) => (
          <li key={row.id} className="flex gap-2.5">
            <ChecklistIcon done={row.done} optional={row.id === 'verification'} />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm leading-5 text-foreground">{t(`checklist_${row.id}`)}</span>
              <span className="text-xs leading-4 text-muted-foreground">
                {t(`checklist_${row.id}_${row.done ? 'done' : 'todo'}`)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

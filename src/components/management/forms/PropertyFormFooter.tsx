'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type Translator = ReturnType<typeof useTranslations>;

type PropertyFormFooterProps = {
  t: Translator;
  mode: 'create' | 'edit';
  note: string;
  /** Number of fields flagged after a failed save/publish; drives the count chip. */
  attentionCount: number;
  submitting: boolean;
  onCancel: () => void;
  onSaveDraft?: () => void;
  onPrimary: () => void;
};

/**
 * The sticky form footer. In create mode: an informational note, "Save draft"
 * (ghost), and "Save & schedule verification" (primary). In edit mode: "Cancel"
 * and "Save changes". When fields need attention, an alert-icon count chip sits
 * immediately beside the primary action. Matches the Figma footer bar.
 * @param props - Translator, mode, note, attention count, submit state, and handlers.
 * @returns The footer bar.
 */
export function PropertyFormFooter(props: PropertyFormFooterProps) {
  const { t, mode, note, attentionCount, submitting, onCancel, onPrimary } = props;
  return (
    <div className="flex flex-col gap-3 border-t border-border bg-background/95 px-1 py-3.5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{note}</p>
      <div className="flex items-center gap-2.5">
        {attentionCount > 0 ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-warning">
            <AlertCircle className="size-3.5" />
            {t('form_needs_attention', { count: attentionCount })}
          </span>
        ) : null}
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button onClick={onPrimary} disabled={submitting} className="gap-2">
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {mode === 'create' ? t('form_save_publish') : t('form_save_changes')}
        </Button>
      </div>
    </div>
  );
}

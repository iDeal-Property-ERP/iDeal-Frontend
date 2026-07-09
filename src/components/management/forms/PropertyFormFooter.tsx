'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type Translator = ReturnType<typeof useTranslations>;

type PropertyFormFooterProps = {
  t: Translator;
  mode: 'create' | 'edit';
  note: string;
  submitting: boolean;
  onCancel: () => void;
  onSaveDraft?: () => void;
  onPrimary: () => void;
};

/**
 * The sticky form footer. In create mode: an informational note, "Save draft"
 * (ghost), and "Save & schedule verification" (primary). In edit mode: "Cancel"
 * and "Save changes". Matches the Figma footer bar.
 * @param props - Translator, mode, note, submit state, and action handlers.
 * @returns The footer bar.
 */
export function PropertyFormFooter(props: PropertyFormFooterProps) {
  const { t, mode, note, submitting, onCancel, onSaveDraft, onPrimary } = props;
  return (
    <div className="flex flex-col gap-3 border-t border-border bg-background/95 px-1 py-3.5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{note}</p>
      <div className="flex items-center gap-2.5">
        {mode === 'create' ? (
          <>
            <Button variant="outline" onClick={onSaveDraft} disabled={submitting}>
              {t('form_save_draft')}
            </Button>
            <Button onClick={onPrimary} disabled={submitting} className="gap-2">
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {t('form_save_publish')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button onClick={onPrimary} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('form_save_changes')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

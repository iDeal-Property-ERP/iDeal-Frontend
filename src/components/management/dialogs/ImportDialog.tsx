'use client';

import { CheckCircle2, Download, FileUp, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  downloadPropertyImportTemplate,
  importPropertiesCsv,
  PROPERTY_IMPORT_COLUMNS,
} from '@/libs/management/propertiesAdapter';
import type { PropertyImportResult } from '@/libs/management/propertiesAdapter';

type ImportStep = 'upload' | 'result';

/**
 * The "Import properties" dialog — one dialog with internal step state:
 * (1) Upload: a `.csv` file picker, the expected-columns hint, and a
 * client-generated "Download template" link; (2) Result: the "{n} created"
 * summary plus a compact scrollable per-row error list. The Done CTA closes and
 * triggers the caller's refetch.
 * @param props - Open state, change handler, and the post-import refetch callback.
 * @returns The import dialog element.
 */
export function ImportDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const t = useTranslations('Management');
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PropertyImportResult | null>(null);

  const finish = () => {
    props.onImported();
    props.onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && step === 'result') {
      // Rows may already exist even when the dialog is dismissed via Esc/X.
      props.onImported();
    }
    if (open) {
      setStep('upload');
      setFile(null);
      setResult(null);
    }
    props.onOpenChange(open);
  };

  const submit = async () => {
    if (!file) {
      return;
    }
    setBusy(true);
    try {
      const next = await importPropertiesCsv(file);
      setResult(next);
      setStep('result');
    } catch {
      toast.error(t('imp_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('imp_title')}</DialogTitle>
          <DialogDescription>{t('imp_desc')}</DialogDescription>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[12px] border border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted/60">
              <FileUp className="size-6 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-sm font-medium text-foreground">
                {file ? file.name : t('imp_file_prompt')}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">{t('imp_columns_hint')}</p>
              <p className="rounded-[8px] bg-muted px-2.5 py-2 font-mono text-xs break-words text-muted-foreground">
                {PROPERTY_IMPORT_COLUMNS.join(', ')}
              </p>
            </div>
            <Button
              type="button"
              variant="link"
              className="h-auto justify-start gap-1.5 self-start p-0 text-sm"
              onClick={() => downloadPropertyImportTemplate('properties-template.csv')}
            >
              <Download className="size-3.5" />
              {t('imp_download_template')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 rounded-[12px] bg-success-subtle px-3.5 py-3 text-sm font-medium text-success-subtle-foreground">
              <CheckCircle2 className="size-4 shrink-0" />
              {t('imp_created_summary', { count: result?.created ?? 0 })}
            </div>
            {result && result.errors.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold tracking-[0.06em] text-danger uppercase">
                  {t('imp_errors_label', { count: result.errors.length })}
                </span>
                <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto rounded-[10px] border border-danger/30 bg-danger-subtle/40 px-3 py-2">
                  {result.errors.map((error) => (
                    <li key={`${error.row}-${error.message}`} className="text-xs text-danger">
                      {t('imp_error_row', { row: error.row, message: error.message })}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={submit} disabled={!file || busy} className="gap-2">
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? t('imp_importing') : t('imp_submit')}
              </Button>
            </>
          ) : (
            <Button onClick={finish}>{t('imp_done')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgreementSelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/libs/I18nNavigation';
import { convertBooking, isLeaseConflict } from '@/libs/management/leadsAdapter';
import { cn } from '@/libs/utils';
import type { ManagementLeadOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;
type WizardStep = 'terms' | 'review' | 'success' | 'conflict';

type Terms = {
  agreementId: number | null;
  rent: string;
  deposit: string;
  startDate: string;
  endDate: string;
};

/**
 * The display currency symbol for a lead's currency.
 * @param currency - The backend currency code (or null).
 * @returns A currency prefix.
 */
function currencySymbol(currency: string | null): string {
  return currency === 'UZS' ? "so'm " : '$';
}

/**
 * Validates the terms, returning the set of invalid field keys.
 * @param terms - The current lease terms.
 * @returns The set of invalid field keys.
 */
function invalidTerms(terms: Terms): Set<string> {
  const bad = new Set<string>();
  if (!terms.rent || Number(terms.rent) <= 0) {
    bad.add('rent');
  }
  if (!terms.deposit) {
    bad.add('deposit');
  }
  if (!terms.startDate) {
    bad.add('startDate');
  }
  if (!terms.endDate || terms.endDate <= terms.startDate) {
    bad.add('endDate');
  }
  return bad;
}

/**
 * A pair of 2 progress segments (Terms → Review) shown at the top of the wizard.
 * @param props - The active step.
 * @returns The progress segments.
 */
function WizardSteps(props: { step: WizardStep }) {
  const active = props.step === 'terms' ? 0 : 1;
  return (
    <div className="flex gap-1.5">
      {[0, 1].map((index) => (
        <span
          key={index}
          className={cn('h-1 flex-1 rounded-full', index <= active ? 'bg-primary' : 'bg-border')}
        />
      ))}
    </div>
  );
}

/**
 * The Terms step: owner agreement, lease dates, rent, and deposit with inline
 * validation.
 * @param props - Lead, terms state, setter, validation set, and translator.
 * @returns The terms form.
 */
function TermsStep(props: {
  lead: ManagementLeadOutput;
  terms: Terms;
  setTerms: (next: Terms) => void;
  invalid: Set<string>;
  t: Translator;
}) {
  const { terms, setTerms, invalid, t } = props;
  const set = (patch: Partial<Terms>) => setTerms({ ...terms, ...patch });
  const pricePlaceholder = `${currencySymbol(props.lead.currency)}0`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>{t('convert_agreement')}</Label>
        <AgreementSelect
          value={terms.agreementId}
          onChange={(value) => set({ agreementId: value })}
          placeholder={t('convert_agreement_auto')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conv-start">{t('convert_start')}</Label>
          <Input
            id="conv-start"
            type="date"
            value={terms.startDate}
            aria-invalid={invalid.has('startDate')}
            onChange={(event) => set({ startDate: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conv-end">{t('convert_end')}</Label>
          <Input
            id="conv-end"
            type="date"
            value={terms.endDate}
            aria-invalid={invalid.has('endDate')}
            onChange={(event) => set({ endDate: event.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conv-rent">{t('field_monthly_rent')}</Label>
          <Input
            id="conv-rent"
            inputMode="decimal"
            placeholder={pricePlaceholder}
            value={terms.rent}
            aria-invalid={invalid.has('rent')}
            onChange={(event) => set({ rent: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conv-deposit">{t('field_deposit')}</Label>
          <Input
            id="conv-deposit"
            inputMode="decimal"
            placeholder={pricePlaceholder}
            value={terms.deposit}
            aria-invalid={invalid.has('deposit')}
            onChange={(event) => set({ deposit: event.target.value })}
          />
        </div>
      </div>
      {invalid.size > 0 ? (
        <p className="text-sm text-danger">{t('form_needs_attention', { count: invalid.size })}</p>
      ) : null}
    </div>
  );
}

/**
 * The Review step: a read-only summary of the lease about to be created.
 * @param props - Lead, terms, and translator.
 * @returns The review summary.
 */
function ReviewStep(props: { lead: ManagementLeadOutput; terms: Terms; t: Translator }) {
  const { lead, terms, t } = props;
  const sym = currencySymbol(lead.currency);
  const rows: [string, string][] = [
    [t('convert_review_tenant'), lead.name],
    [t('convert_review_property'), lead.property_name],
    [t('convert_review_term'), `${terms.startDate} → ${terms.endDate}`],
    [t('field_monthly_rent'), `${sym}${terms.rent}`],
    [t('field_deposit'), `${sym}${terms.deposit}`],
  ];
  return (
    <dl className="divide-y divide-border rounded-[12px] border border-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The wizard's step-dependent action buttons.
 * @param props - Step, translator, busy flag, and the per-step handlers.
 * @returns The footer button row.
 */
function WizardFooter(props: {
  step: WizardStep;
  t: Translator;
  busy: boolean;
  onCancel: () => void;
  onReview: () => void;
  onBack: () => void;
  onCreate: () => void;
  onOpenLease: () => void;
}) {
  const { step, t, busy } = props;
  return (
    <div className="mt-1 flex justify-end gap-2.5">
      {step === 'terms' ? (
        <>
          <Button variant="outline" onClick={props.onCancel}>
            {t('cancel')}
          </Button>
          <Button onClick={props.onReview} className="gap-2">
            {t('convert_next_review')}
            <ArrowRight className="size-4" />
          </Button>
        </>
      ) : null}
      {step === 'review' ? (
        <>
          <Button variant="outline" onClick={props.onBack} disabled={busy}>
            {t('back')}
          </Button>
          <Button onClick={props.onCreate} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {t('convert_create_lease')}
          </Button>
        </>
      ) : null}
      {step === 'success' ? (
        <>
          <Button variant="outline" onClick={props.onCancel}>
            {t('convert_back_to_leads')}
          </Button>
          <Button onClick={props.onOpenLease} className="gap-2">
            {t('convert_open_lease')}
            <ArrowRight className="size-4" />
          </Button>
        </>
      ) : null}
      {step === 'conflict' ? (
        <>
          <Button variant="outline" onClick={props.onCancel}>
            {t('close')}
          </Button>
          <Button onClick={props.onOpenLease}>{t('convert_view_lease')}</Button>
        </>
      ) : null}
    </div>
  );
}

/**
 * The "Convert to lease" wizard for an approved booking — a stepped dialog
 * (Terms → Review → Success | Conflict). Creates the lease and its first deposit
 * invoice, or surfaces the active-lease conflict edge case. Replaces the former
 * single-step convert dialog.
 * @param props - The lead, open state, change handler, and success callback.
 * @returns The convert wizard (or null with no lead).
 */
export function ConvertToLeaseWizard(props: {
  lead: ManagementLeadOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const router = useRouter();
  const { lead } = props;

  const [step, setStep] = useState<WizardStep>('terms');
  const [terms, setTerms] = useState<Terms>({
    agreementId: null,
    rent: lead?.monthly_rent_offer ?? '',
    deposit: lead?.monthly_rent_offer ?? '',
    startDate: lead?.requested_start_date ?? '',
    endDate: lead?.requested_end_date ?? '',
  });
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [leaseId, setLeaseId] = useState<number | null>(null);

  if (!lead) {
    return null;
  }

  const reset = () => {
    setStep('terms');
    setInvalid(new Set());
    setLeaseId(null);
  };

  const close = () => {
    props.onOpenChange(false);
    reset();
  };

  const toReview = () => {
    const bad = invalidTerms(terms);
    setInvalid(bad);
    if (bad.size === 0) {
      setStep('review');
    }
  };

  const create = async () => {
    setBusy(true);
    try {
      const { leaseId: created } = await convertBooking(lead.source_id, {
        owner_agreement_id: terms.agreementId ?? undefined,
        monthly_rent: terms.rent || undefined,
        deposit: terms.deposit || undefined,
        start_date: terms.startDate || undefined,
        end_date: terms.endDate || undefined,
      });
      setLeaseId(created);
      setStep('success');
      props.onSuccess();
    } catch (error) {
      if (isLeaseConflict(error)) {
        setStep('conflict');
      } else {
        toast.error(t('lead_convert_failed'));
      }
    } finally {
      setBusy(false);
    }
  };

  const openLease = () => {
    close();
    router.push(leaseId ? `/management/leases?highlight=${leaseId}` : '/management/leases');
  };

  const TITLE_KEY = {
    terms: 'lead_convert',
    review: 'lead_convert',
    success: 'convert_success_title',
    conflict: 'convert_conflict_title',
  } as const;
  const title = t(TITLE_KEY[step]);

  return (
    <Dialog open={props.open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {step === 'terms' || step === 'review' ? <WizardSteps step={step} /> : null}

        {step === 'terms' ? (
          <TermsStep lead={lead} terms={terms} setTerms={setTerms} invalid={invalid} t={t} />
        ) : null}
        {step === 'review' ? <ReviewStep lead={lead} terms={terms} t={t} /> : null}

        {step === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success-subtle text-success motion-safe:animate-in motion-safe:duration-200 motion-safe:zoom-in-50">
              <CheckCircle2 className="size-7" />
            </span>
            <p className="text-lg font-semibold text-foreground">{t('convert_success_title')}</p>
            <p className="text-sm text-muted-foreground">
              {t('convert_success_desc', { name: lead.name, property: lead.property_name })}
            </p>
          </div>
        ) : null}

        {step === 'conflict' ? (
          <div className="flex flex-col gap-3 rounded-[12px] bg-danger-subtle px-4 py-4 text-danger-subtle-foreground">
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle className="size-5" />
              {t('convert_conflict_title')}
            </span>
            <p className="text-sm">
              {t('convert_conflict_desc', { property: lead.property_name })}
            </p>
          </div>
        ) : null}

        <WizardFooter
          step={step}
          t={t}
          busy={busy}
          onCancel={close}
          onReview={toReview}
          onBack={() => setStep('terms')}
          onCreate={() => void create()}
          onOpenLease={openLease}
        />
      </DialogContent>
    </Dialog>
  );
}

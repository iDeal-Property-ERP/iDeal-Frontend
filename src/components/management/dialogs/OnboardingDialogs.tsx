'use client';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  approveOnboarding,
  rejectOnboarding,
  requestOnboardingInfo,
} from '@/libs/management/onboardingsAdapter';
import type { ManagementOnboardingDetailOutput } from '@/types/management';

function addMonths(iso: string, months: number): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}
const TODAY = () => new Date().toISOString().slice(0, 10);

/**
 * The "Approve onboarding" drawer — pricing (guaranteed / tenant charge,
 * prefilled from the suggested price), commission, agreement number, and term
 * dates → `approveOnboarding`, which generates the owner agreement.
 * @param props - The onboarding detail, open state, change handler, and success callback.
 * @returns The approve drawer element (or null with no detail).
 */
export function ApproveOnboardingDrawer(props: {
  detail: ManagementOnboardingDetailOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { detail } = props;
  const [commission, setCommission] = useState('20');
  const [guaranteed, setGuaranteed] = useState(detail?.suggested_price ?? '');
  const [charge, setCharge] = useState(detail?.ask_price ?? '');
  const [agreementNo, setAgreementNo] = useState('');
  const [start, setStart] = useState(TODAY());
  const [end, setEnd] = useState(addMonths(TODAY(), 12));
  const [busy, setBusy] = useState(false);

  if (!detail) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await approveOnboarding(detail.id, {
        commission_rate: commission,
        start_date: start,
        end_date: end,
        agreement_number: agreementNo || undefined,
        owner_guaranteed_price: guaranteed || undefined,
        tenant_charge_price: charge || undefined,
      });
      toast.success(t('onb_approved_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('onb_approve_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('onb_approve_title')}</DialogTitle>
          <DialogDescription>
            {t('onb_approve_desc', { property: detail.property_name })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onb-guaranteed">{t('onb_field_guaranteed')}</Label>
              <Input
                id="onb-guaranteed"
                inputMode="decimal"
                placeholder="$0"
                value={guaranteed}
                onChange={(e) => setGuaranteed(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onb-charge">{t('onb_field_charge')}</Label>
              <Input
                id="onb-charge"
                inputMode="decimal"
                placeholder="$0"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onb-commission">{t('onb_field_commission')}</Label>
              <Input
                id="onb-commission"
                inputMode="decimal"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onb-agreement">{t('onb_field_agreement_no')}</Label>
              <Input
                id="onb-agreement"
                value={agreementNo}
                onChange={(e) => setAgreementNo(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onb-start">{t('onb_field_start')}</Label>
              <Input
                id="onb-start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onb-end">{t('onb_field_end')}</Label>
              <Input
                id="onb-end"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('onb_approve_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Reject onboarding" dialog — a note to the owner → `rejectOnboarding`.
 * @param props - The onboarding detail, open state, change handler, and success callback.
 * @returns The reject dialog element (or null with no detail).
 */
export function RejectOnboardingDialog(props: {
  detail: ManagementOnboardingDetailOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { detail } = props;
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!detail) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await rejectOnboarding(detail.id, note || undefined);
      toast.success(t('onb_rejected_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('onb_reject_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('onb_reject_title')}</DialogTitle>
          <DialogDescription>{t('onb_reject_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-reject-note">{t('onb_reject_reason')}</Label>
          <Textarea id="onb-reject-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {t('onb_reject_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Request more info" dialog — a message to the owner → `requestOnboardingInfo`.
 * @param props - The onboarding detail, open state, change handler, and success callback.
 * @returns The request-info dialog element (or null with no detail).
 */
export function RequestInfoDialog(props: {
  detail: ManagementOnboardingDetailOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { detail } = props;
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!detail) {
    return null;
  }

  const submit = async () => {
    if (!note.trim()) {
      return;
    }
    setBusy(true);
    try {
      await requestOnboardingInfo(detail.id, note.trim());
      toast.success(t('onb_info_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('onb_info_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('onb_info_title')}</DialogTitle>
          <DialogDescription>{t('onb_info_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-info-note">{t('onb_info_note')}</Label>
          <Textarea id="onb-info-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy || !note.trim()}>
            {t('onb_info_send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

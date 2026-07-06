'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { MethodSegmented } from '@/components/management/MethodSegmented';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AgreementSelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cancelPayout, createPayout, holdPayout } from '@/libs/management/payoutsAdapter';
import type { ManagementPayoutOutput } from '@/types/management';

const TODAY = () => new Date().toISOString().slice(0, 10);

/** The payout methods offered in the Schedule-payout dialog. */
const PAYOUT_METHODS = ['bank_transfer', 'card', 'cash'] as const;

/**
 * The "Schedule payout" dialog (Figma `dialog/schedule-payout`) — a manual owner
 * payout outside the monthly auto-run: owner-agreement picker, amount + currency,
 * scheduled date, and a Bank/Card/Cash method segmented control.
 * @param props - Open state, change handler, and the success callback.
 * @returns The schedule-payout dialog element.
 */
export function SchedulePayoutDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const [agreementId, setAgreementId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState(TODAY());
  const [method, setMethod] = useState<string>('bank_transfer');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!agreementId || !amount) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await createPayout({
        owner_agreement_id: agreementId,
        amount,
        currency: 'USD',
        scheduled_date: scheduledDate,
        method,
      });
      toast.success(t('payout_scheduled_ok'));
      props.onSuccess();
      props.onOpenChange(false);
      setAgreementId(null);
      setAmount('');
    } catch {
      toast.error(t('payout_schedule_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('schedule_payout')}</DialogTitle>
          <DialogDescription>{t('schedule_payout_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_owner_agreement')} *</Label>
            <AgreementSelect value={agreementId} onChange={setAgreementId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-amount">{t('payment_amount')} *</Label>
              <Input
                id="po-amount"
                inputMode="decimal"
                placeholder="$0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-date">{t('payout_scheduled')}</Label>
              <Input
                id="po-date"
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
            </div>
          </div>
          <MethodSegmented
            label={t('field_method')}
            options={PAYOUT_METHODS.map((value) => ({ value, label: t(`method_${value}`) }))}
            value={method}
            onChange={setMethod}
          />
          <p className="text-xs text-muted-foreground">{t('schedule_payout_note')}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('schedule_payout')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Hold payout" dialog (Figma `dialog/hold-payout`) — an amber caution flow:
 * the rent stays recorded, the owner isn't paid until released, and it can be
 * released any time. Requires a reason. Non-destructive (navy/amber, not red).
 * @param props - The payout, open state, change handler, and success callback.
 * @returns The hold-payout dialog element (or null with no payout).
 */
export function HoldPayoutDialog(props: {
  payout: ManagementPayoutOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { payout } = props;
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!payout) {
    return null;
  }

  const submit = async () => {
    if (!reason.trim()) {
      toast.error(t('payout_hold_reason_required'));
      return;
    }
    setBusy(true);
    try {
      await holdPayout(payout.id, reason.trim());
      toast.success(t('payout_held_ok'));
      props.onSuccess();
      props.onOpenChange(false);
      setReason('');
    } catch {
      toast.error(t('payout_hold_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('hold_payout_q', { name: payout.owner_name })}</DialogTitle>
          <DialogDescription>
            {t('hold_payout_sub', {
              amount: payout.amount,
              currency: payout.currency,
            })}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 rounded-[10px] bg-warning-subtle px-3.5 py-3 text-xs text-warning-subtle-foreground">
          <li>{t('hold_payout_c1')}</li>
          <li>{t('hold_payout_c2')}</li>
          <li>{t('hold_payout_c3')}</li>
        </ul>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hold-reason">{t('field_reason')} *</Label>
          <Textarea
            id="hold-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('hold_payout_reason_ph')}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('keep_scheduled')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('hold_payout')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Cancel payout" destructive dialog (Figma `dialog/cancel-payout`) — the
 * three-line warning (rent stays recorded, a replacement must be scheduled
 * manually, the owner isn't notified) plus a reason, with a red confirm.
 * @param props - The payout, open state, change handler, and success callback.
 * @returns The cancel-payout dialog element (or null with no payout).
 */
export function CancelPayoutDialog(props: {
  payout: ManagementPayoutOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { payout } = props;
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!payout) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await cancelPayout(payout.id, reason.trim() || undefined);
      toast.success(t('payout_cancelled_ok'));
      props.onSuccess();
      props.onOpenChange(false);
      setReason('');
    } catch {
      toast.error(t('payout_cancel_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('cancel_payout_q', { name: payout.owner_name })}</DialogTitle>
          <DialogDescription>
            {t('cancel_payout_sub', { amount: payout.amount, currency: payout.currency })}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 rounded-[10px] bg-warning-subtle px-3.5 py-3 text-xs text-warning-subtle-foreground">
          <li>{t('cancel_payout_c1')}</li>
          <li>{t('cancel_payout_c2')}</li>
          <li>{t('cancel_payout_c3')}</li>
        </ul>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-reason">{t('field_reason')}</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('cancel_payout_reason_ph')}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('keep_payout')}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {t('cancel_payout')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

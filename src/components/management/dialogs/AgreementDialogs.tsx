'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OwnerSelect, PropertySelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createAgreement,
  renewAgreement,
  terminateAgreement,
} from '@/libs/management/agreementsAdapter';
import type { ManagementAgreementOutput } from '@/types/management';

/**
 * Adds N months to an ISO date, returning a new ISO date string.
 * @param iso - The base ISO date.
 * @param months - Months to add.
 * @returns The resulting ISO date (yyyy-mm-dd).
 */
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
 * The "New agreement" creation dialog — owner, property, agreement number, dates,
 * commission, and terms → `createAgreement`. Errors surface as a toast; on success
 * it closes and notifies the caller to refetch.
 * @param props - Open state, change handler, and success callback.
 * @returns The new-agreement dialog element.
 */
export function NewAgreementDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [agreementNumber, setAgreementNumber] = useState('');
  const [signedDate, setSignedDate] = useState(TODAY());
  const [startDate, setStartDate] = useState(TODAY());
  const [endDate, setEndDate] = useState(addMonths(TODAY(), 12));
  const [commission, setCommission] = useState('');
  const [grossFloor, setGrossFloor] = useState('');
  const [payoutDay, setPayoutDay] = useState('25');
  const [terms, setTerms] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!ownerId || !propertyId || !agreementNumber || !commission || !grossFloor) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await createAgreement({
        owner_id: ownerId,
        property_id: propertyId,
        agreement_number: agreementNumber,
        signed_date: signedDate,
        start_date: startDate,
        end_date: endDate,
        commission_rate: commission,
        gross_floor_amount: grossFloor,
        currency: 'USD',
        payout_day: Number(payoutDay),
        terms: terms || undefined,
      });
      toast.success(t('agr_created'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('agr_create_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('new_agreement')}</DialogTitle>
          <DialogDescription>{t('new_agreement_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_owner')} *</Label>
            <OwnerSelect value={ownerId} onChange={setOwnerId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_property')} *</Label>
            <PropertySelect value={propertyId} onChange={setPropertyId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agr-number">{t('field_agreement_number')} *</Label>
              <Input
                id="agr-number"
                placeholder="TM-2026-001"
                value={agreementNumber}
                onChange={(event) => setAgreementNumber(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agr-commission">{t('field_commission_rate')} *</Label>
              <Input
                id="agr-commission"
                inputMode="decimal"
                placeholder="15"
                value={commission}
                onChange={(event) => setCommission(event.target.value)}
              />
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="agr-floor">{t('field_gross_floor')} *</Label>
                <Input
                  id="agr-floor"
                  inputMode="decimal"
                  placeholder="500"
                  value={grossFloor}
                  onChange={(event) => setGrossFloor(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="agr-payout-day">{t('field_payout_day')}</Label>
                <Input
                  id="agr-payout-day"
                  inputMode="numeric"
                  min="1"
                  max="31"
                  value={payoutDay}
                  onChange={(event) => setPayoutDay(event.target.value)}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('settlement_preview', {
                floor: grossFloor || '0',
                commission: commission || '0',
                payout: ((Number(grossFloor || 0) * (100 - Number(commission || 0))) / 100).toFixed(
                  2,
                ),
              })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agr-signed">{t('field_signed_date')}</Label>
              <Input
                id="agr-signed"
                type="date"
                value={signedDate}
                onChange={(event) => setSignedDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agr-start">{t('field_start_date')}</Label>
              <Input
                id="agr-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agr-end">{t('field_end_date')}</Label>
              <Input
                id="agr-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agr-terms">{t('field_terms')}</Label>
            <Textarea
              id="agr-terms"
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
              placeholder={t('agr_terms_ph')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('create_agreement')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Renew agreement" dialog — new term and commission → `renewAgreement`.
 * The new term starts where the current agreement ends.
 * @param props - The agreement, open state, change handler, and success callback.
 * @returns The renew-agreement dialog element (or null with no agreement).
 */
export function RenewAgreementDialog(props: {
  agreement: ManagementAgreementOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { agreement } = props;
  const [termMonths, setTermMonths] = useState(12);
  const [commission, setCommission] = useState(agreement?.commission_rate ?? '');
  const [busy, setBusy] = useState(false);

  if (!agreement) {
    return null;
  }

  const start = addMonths(agreement.end_date, 0);
  const submit = async () => {
    setBusy(true);
    try {
      await renewAgreement(agreement.id, {
        new_start_date: start,
        new_end_date: addMonths(start, termMonths),
        commission_rate: commission || agreement.commission_rate,
      });
      toast.success(t('agr_renewed'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('agr_renew_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('renew_agreement')}</DialogTitle>
          <DialogDescription>
            {t('renew_agreement_desc', {
              number: agreement.agreement_number,
              owner: agreement.owner_name,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agr-renew-term">{t('field_new_term')}</Label>
              <Input
                id="agr-renew-term"
                type="number"
                min={1}
                value={termMonths}
                onChange={(event) => setTermMonths(Number(event.target.value) || 12)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agr-renew-commission">{t('field_commission_rate')} *</Label>
              <Input
                id="agr-renew-commission"
                inputMode="decimal"
                value={commission}
                onChange={(event) => setCommission(event.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('renew_agreement_note')}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('renew_agreement')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Terminate agreement" destructive dialog — reason and an explicit
 * acknowledgment checkbox → `terminateAgreement`.
 * @param props - The agreement, open state, change handler, and success callback.
 * @returns The terminate-agreement dialog element (or null with no agreement).
 */
export function TerminateAgreementDialog(props: {
  agreement: ManagementAgreementOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { agreement } = props;
  const [endDate, setEndDate] = useState(TODAY());
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!agreement) {
    return null;
  }

  const submit = async () => {
    if (!ack) {
      return;
    }
    setBusy(true);
    try {
      await terminateAgreement(agreement.id, { end_date: endDate, reason });
      toast.success(t('agr_terminated'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('agr_terminate_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('terminate_agreement_q')}</DialogTitle>
          <DialogDescription>
            {t('terminate_agreement_desc', {
              number: agreement.agreement_number,
              owner: agreement.owner_name,
            })}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 rounded-[10px] bg-danger-subtle px-3.5 py-3 text-xs text-danger-subtle-foreground">
          <li>{t('terminate_agreement_c1')}</li>
          <li>{t('terminate_agreement_c2')}</li>
          <li>{t('terminate_agreement_c3')}</li>
        </ul>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agr-term-end">{t('field_end_date')} *</Label>
            <Input
              id="agr-term-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agr-term-reason">{t('field_reason')} *</Label>
            <Textarea
              id="agr-term-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t('terminate_agreement_reason_ph')}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={ack} onCheckedChange={(value) => setAck(value === true)} />
            {t('terminate_agreement_ack')}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('keep_agreement')}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy || !ack}>
            {t('terminate_agreement')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

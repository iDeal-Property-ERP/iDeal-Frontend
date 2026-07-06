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
import { AgreementSelect, PropertySelect, TenantSelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createLease, renewLease, terminateLease } from '@/libs/management/leasesAdapter';
import type { ManagementLeaseOutput } from '@/types/management';

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
 * The "New lease" creation dialog — property, owner agreement, tenant, dates,
 * rent, and deposit → `createLease`. Errors surface as a toast; on success it
 * closes and notifies the caller to refetch.
 * @param props - Open state, change handler, and success callback.
 * @returns The new-lease dialog element.
 */
export function NewLeaseDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [agreementId, setAgreementId] = useState<number | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(TODAY());
  const [endDate, setEndDate] = useState(addMonths(TODAY(), 12));
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!propertyId || !agreementId || !tenantId || !rent) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await createLease({
        property_id: propertyId,
        owner_agreement_id: agreementId,
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
        monthly_rent: rent,
        deposit: deposit || rent,
      });
      toast.success(t('lease_created'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('lease_create_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('new_lease')}</DialogTitle>
          <DialogDescription>{t('new_lease_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_property')} *</Label>
            <PropertySelect value={propertyId} onChange={setPropertyId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_owner_agreement')} *</Label>
            <AgreementSelect value={agreementId} onChange={setAgreementId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_tenant')} *</Label>
            <TenantSelect value={tenantId} onChange={setTenantId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lease-start">{t('field_start_date')}</Label>
              <Input
                id="lease-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lease-end">{t('field_end_date')}</Label>
              <Input
                id="lease-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lease-rent">{t('field_monthly_rent')} *</Label>
              <Input
                id="lease-rent"
                inputMode="decimal"
                placeholder="$0"
                value={rent}
                onChange={(event) => setRent(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lease-deposit">{t('field_deposit')}</Label>
              <Input
                id="lease-deposit"
                inputMode="decimal"
                placeholder="$0"
                value={deposit}
                onChange={(event) => setDeposit(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('create_lease')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Renew lease" dialog — new term, start date, rent, and deposit →
 * `renewLease`. Pre-fills from the expiring lease.
 * @param props - The lease, open state, change handler, and success callback.
 * @returns The renew-lease dialog element (or null with no lease).
 */
export function RenewLeaseDialog(props: {
  lease: ManagementLeaseOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { lease } = props;
  const [termMonths, setTermMonths] = useState(12);
  const [rent, setRent] = useState(lease?.monthly_rent ?? '');
  const [busy, setBusy] = useState(false);

  if (!lease) {
    return null;
  }

  const start = addMonths(lease.end_date, 0);
  const submit = async () => {
    setBusy(true);
    try {
      await renewLease(lease.id, {
        new_start_date: start,
        new_end_date: addMonths(start, termMonths),
        new_monthly_rent: rent || lease.monthly_rent,
        deposit: lease.deposit,
      });
      toast.success(t('lease_renewed'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('lease_renew_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('renew_lease')}</DialogTitle>
          <DialogDescription>
            {t('renew_lease_desc', { id: lease.id, tenant: lease.tenant_name })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="renew-term">{t('field_new_term')}</Label>
              <Input
                id="renew-term"
                type="number"
                min={1}
                value={termMonths}
                onChange={(event) => setTermMonths(Number(event.target.value) || 12)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="renew-rent">{t('field_monthly_rent')} *</Label>
              <Input
                id="renew-rent"
                inputMode="decimal"
                value={rent}
                onChange={(event) => setRent(event.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('renew_lease_note')}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('renew_lease')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Terminate lease" destructive dialog — end date, reason, and an explicit
 * acknowledgment checkbox → `terminateLease`.
 * @param props - The lease, open state, change handler, and success callback.
 * @returns The terminate-lease dialog element (or null with no lease).
 */
export function TerminateLeaseDialog(props: {
  lease: ManagementLeaseOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { lease } = props;
  const [endDate, setEndDate] = useState(TODAY());
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!lease) {
    return null;
  }

  const submit = async () => {
    if (!ack) {
      return;
    }
    setBusy(true);
    try {
      await terminateLease(lease.id, { end_date: endDate, reason });
      toast.success(t('lease_terminated'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('lease_terminate_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('terminate_lease_q')}</DialogTitle>
          <DialogDescription>
            {t('terminate_lease_desc', { id: lease.id, tenant: lease.tenant_name })}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 rounded-[10px] bg-danger-subtle px-3.5 py-3 text-xs text-danger-subtle-foreground">
          <li>{t('terminate_lease_c1')}</li>
          <li>{t('terminate_lease_c2')}</li>
          <li>{t('terminate_lease_c3')}</li>
        </ul>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-end">{t('field_end_date')} *</Label>
            <Input
              id="term-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-reason">{t('field_reason')} *</Label>
            <Textarea
              id="term-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t('terminate_lease_reason_ph')}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={ack} onCheckedChange={(value) => setAck(value === true)} />
            {t('terminate_lease_ack')}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('keep_lease')}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy || !ack}>
            {t('terminate_lease')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

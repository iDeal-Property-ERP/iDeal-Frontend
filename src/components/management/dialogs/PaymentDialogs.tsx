'use client';

import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/components/management/format';
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
import { LeaseSelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/libs/auth';
import { listLeases } from '@/libs/management/leasesAdapter';
import { createPayment } from '@/libs/management/paymentsAdapter';
import type { ManagementPaymentOutput } from '@/types/management';

const TODAY = () => new Date().toISOString().slice(0, 10);

/** The payment methods offered in the Record-payment dialog (Figma order). */
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'click', 'payme'] as const;

/**
 * The "Record payment" dialog (Figma `dialog/record-payment`) — a lease picker
 * that autofills amount + currency from the lease's rent, a paid-on date, a
 * Cash/Bank/Click/Payme method segmented control, and a reference number that is
 * required for bank transfers (mirrored server-side). Records a PAID payment,
 * which accrues the owner payout.
 * @param props - Open state, change handler, and the success callback.
 * @returns The record-payment dialog element.
 */
export function RecordPaymentDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { user } = useAuth();
  const [leaseId, setLeaseId] = useState<number | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  // Leases don't carry a currency; management rent is recorded in USD.
  const currency = 'USD';
  const [paidOn, setPaidOn] = useState(TODAY());
  const [method, setMethod] = useState<string>('cash');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  // Resolve the lease's tenant + suggested rent when a lease is chosen.
  useEffect(() => {
    let active = true;
    if (leaseId) {
      void listLeases({ page: 1, search: String(leaseId) }).then((res) => {
        const lease = res.items.find((row) => row.id === leaseId);
        if (active && lease) {
          setTenantId(lease.tenant_id);
          setAmount((current) => current || lease.monthly_rent);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [leaseId]);

  const needsReference = method === 'bank_transfer';

  const submit = async () => {
    if (!leaseId || !tenantId || !amount || !user) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    if (needsReference && !reference.trim()) {
      toast.error(t('payment_ref_required'));
      return;
    }
    setBusy(true);
    try {
      await createPayment({
        lease_id: leaseId,
        tenant_id: tenantId,
        paid_by_id: user.id,
        amount,
        currency,
        payment_date: paidOn,
        due_date: paidOn,
        status: 'paid',
        method,
        gateway_ref: reference.trim() || null,
      });
      toast.success(t('payment_recorded'));
      props.onSuccess();
      props.onOpenChange(false);
      setLeaseId(null);
      setAmount('');
      setReference('');
    } catch {
      toast.error(t('payment_record_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('record_payment')}</DialogTitle>
          <DialogDescription>{t('record_payment_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_lease')} *</Label>
            <LeaseSelect value={leaseId} onChange={setLeaseId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-amount">{t('payment_amount')} *</Label>
              <Input
                id="pay-amount"
                inputMode="decimal"
                placeholder="$0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-date">{t('paid_on')}</Label>
              <Input
                id="pay-date"
                type="date"
                value={paidOn}
                onChange={(event) => setPaidOn(event.target.value)}
              />
            </div>
          </div>
          <MethodSegmented
            label={t('field_method')}
            options={PAYMENT_METHODS.map((value) => ({ value, label: t(`method_${value}`) }))}
            value={method}
            onChange={setMethod}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-ref">
              {t('reference_number')}
              {needsReference ? ' *' : ''}
            </Label>
            <Input
              id="pay-ref"
              placeholder="TRX-"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
            {needsReference ? (
              <span className="text-xs text-muted-foreground">{t('payment_ref_hint')}</span>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('record_payment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sums payment amounts as a display total (mixed currencies are summed
 * numerically and labelled with the first row's currency — a best-effort
 * summary, matching the dialog's informational total).
 * @param rows - The selected payments.
 * @returns The formatted total.
 */
function totalOf(rows: ManagementPaymentOutput[]): string {
  const sum = rows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  return formatCurrency(sum, rows[0]?.currency ?? 'USD');
}

/**
 * The "Mark N payments as paid?" confirmation (Figma `dialog/bulk-mark-paid`) —
 * shows the total, a per-payment list, and the note that each gets today's date.
 * Confirming runs the bulk action immediately.
 * @param props - Open state, the selected payments, labels, and the confirm handler.
 * @returns The bulk-mark-paid dialog element.
 */
export function BulkMarkPaidDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: ManagementPaymentOutput[];
  overdueSubline: (payment: ManagementPaymentOutput) => string;
  onConfirm: () => void;
}) {
  const t = useTranslations('Management');
  const count = props.payments.length;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('bulk_mark_paid_q', { count })}</DialogTitle>
          <DialogDescription>
            {t('bulk_mark_paid_desc', { total: totalOf(props.payments) })}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-[12px] bg-muted/50 px-3.5 py-3">
          {props.payments.map((payment) => (
            <li key={payment.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <span className="text-foreground">{payment.tenant_name}</span>
              <span className="text-muted-foreground">
                — {formatCurrency(payment.amount, payment.currency)} ·{' '}
                {props.overdueSubline(payment)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{t('bulk_mark_paid_note')}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              props.onConfirm();
              props.onOpenChange(false);
            }}
          >
            {t('bulk_mark_paid_confirm', { count })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

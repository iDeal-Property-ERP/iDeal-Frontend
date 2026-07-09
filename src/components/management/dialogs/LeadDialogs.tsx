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
import {
  approveBooking,
  cancelViewing,
  proposeViewingTime,
  rejectBooking,
} from '@/libs/management/leadsAdapter';
import { cn } from '@/libs/utils';
import type { ManagementLeadOutput } from '@/types/management';

const TIME_SLOTS = ['10:00', '13:00', '15:00', '18:00'];
const TODAY = () => new Date().toISOString().slice(0, 10);

/**
 * The "Propose new time" dialog for a viewing lead — a date field plus a chip
 * grid of time slots → `proposeViewingTime`. A confirmed viewing returns to New
 * server-side until the prospect re-confirms.
 * @param props - The lead, open state, change handler, and success callback.
 * @returns The propose-time dialog element (or null with no lead).
 */
export function ProposeTimeDialog(props: {
  lead: ManagementLeadOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { lead } = props;
  const [date, setDate] = useState(lead?.preferred_date ?? TODAY());
  const [slot, setSlot] = useState<string | null>(lead?.preferred_time ?? null);
  const [busy, setBusy] = useState(false);

  if (!lead) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await proposeViewingTime(lead.source_id, {
        preferred_date: date,
        preferred_time: slot ?? undefined,
      });
      toast.success(t('lead_propose_done'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('lead_propose_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('lead_propose_time')}</DialogTitle>
          <DialogDescription>{t('lead_propose_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="propose-date">{t('lead_field_date')}</Label>
            <Input
              id="propose-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('lead_field_time')}</Label>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={cn(
                    'rounded-[10px] border px-3.5 py-2 text-sm font-medium transition-colors',
                    slot === s
                      ? 'border-transparent bg-primary-subtle text-primary-subtle-foreground'
                      : 'border-border text-muted-foreground hover:border-ring/40',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('lead_send_proposal')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The destructive "Cancel lead" confirmation — lists consequences, takes an
 * optional reason, and cancels the underlying viewing/booking.
 * @param props - The lead, open state, change handler, and success callback.
 * @returns The cancel-lead dialog element (or null with no lead).
 */
export function CancelLeadDialog(props: {
  lead: ManagementLeadOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { lead } = props;
  const [busy, setBusy] = useState(false);

  if (!lead) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await (lead.type === 'viewing'
        ? cancelViewing(lead.source_id)
        : rejectBooking(lead.source_id));
      toast.success(t('lead_cancel_done'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('lead_cancel_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('lead_cancel_q', { name: lead.name })}</DialogTitle>
          <DialogDescription>{lead.property_name}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 rounded-[10px] bg-danger-subtle px-3.5 py-3 text-xs text-danger-subtle-foreground">
          <li>{t('lead_cancel_c1')}</li>
          <li>{t('lead_cancel_c2')}</li>
          <li>{t('lead_cancel_c3')}</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('lead_keep')}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {t('lead_cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Approve booking — confirm" dialog — shows the booking summary (prospect,
 * property, requested dates, offer) before approving via `approveBooking`.
 * @param props - The lead, open state, change handler, and success callback.
 * @returns The approve-confirm dialog element (or null with no lead).
 */
export function ApproveBookingDialog(props: {
  lead: ManagementLeadOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { lead } = props;
  const [busy, setBusy] = useState(false);

  if (!lead) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await approveBooking(lead.source_id);
      toast.success(t('lead_approve_done'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('lead_approve_failed'));
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, string][] = [
    [t('convert_review_property'), lead.property_name],
    [
      t('convert_review_term'),
      `${lead.requested_start_date ?? '—'} → ${lead.requested_end_date ?? '—'}`,
    ],
    [t('lead_offer'), lead.monthly_rent_offer ? `$${lead.monthly_rent_offer}` : '—'],
  ];

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('lead_approve_q', { name: lead.name })}</DialogTitle>
          <DialogDescription>{t('lead_approve_desc')}</DialogDescription>
        </DialogHeader>
        <dl className="divide-y divide-border rounded-[10px] border border-border">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('lead_approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

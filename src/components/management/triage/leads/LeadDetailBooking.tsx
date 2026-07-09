'use client';

import { ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { ManagementLeadOutput } from '@/types/management';
import type { LeadAction } from './LeadDetail';

/**
 * The booking-specific middle section of the lead detail — requested move-in
 * range, monthly rent offer, and the tenant's message.
 * @param props - The booking lead.
 * @returns The booking detail section.
 */
export function LeadDetailBooking(props: { lead: ManagementLeadOutput }) {
  const t = useTranslations('Management');
  const { lead } = props;
  const range = [lead.requested_start_date, lead.requested_end_date].filter(Boolean).join(' → ');

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1 rounded-[12px] border border-border bg-background px-3.5 py-3">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {t('lead_move_in_range')}
          </span>
          <span className="text-sm font-medium text-foreground">{range || '—'}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[12px] border border-border bg-background px-3.5 py-3">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {t('lead_rent_offer')}
          </span>
          <span className="text-sm font-medium text-foreground">
            {lead.monthly_rent_offer ? `$${lead.monthly_rent_offer}/mo` : '—'}
          </span>
        </div>
      </div>
      {lead.message ? (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {t('lead_message_label')}
          </span>
          <p className="text-sm leading-5 text-foreground">“{lead.message}”</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The booking-specific action footer — a state machine: requested → Approve /
 * Reject; approved → Convert to lease; converted/rejected/cancelled → terminal.
 * @param props - The lead and the action dispatcher.
 * @returns The booking footer element.
 */
LeadDetailBooking.Footer = function Footer(props: {
  lead: ManagementLeadOutput;
  onAction: (lead: ManagementLeadOutput, action: LeadAction) => void;
}) {
  const t = useTranslations('Management');
  const { lead } = props;

  if (lead.status === 'approved') {
    return (
      <div className="flex items-center justify-between gap-3">
        <Button onClick={() => props.onAction(lead, 'convert')}>
          <ArrowRightLeft className="size-4" />
          {t('lead_convert')}
        </Button>
        <button
          type="button"
          onClick={() => props.onAction(lead, 'reject')}
          className="text-sm font-medium text-danger"
        >
          {t('lead_reject')}
        </button>
      </div>
    );
  }

  const terminal =
    lead.status === 'converted' || lead.status === 'rejected' || lead.status === 'cancelled';

  return (
    <div className="flex items-center justify-between gap-3">
      <Button onClick={() => props.onAction(lead, 'approve')} disabled={terminal}>
        <CheckCircle2 className="size-4" />
        {t('lead_approve')}
      </Button>
      <button
        type="button"
        onClick={() => props.onAction(lead, 'reject')}
        disabled={terminal}
        className="text-sm font-medium text-danger disabled:text-muted-foreground"
      >
        {t('lead_reject')}
      </button>
    </div>
  );
};

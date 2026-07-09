'use client';

import { CalendarClock, CheckCircle2, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { ManagementLeadOutput } from '@/types/management';
import type { LeadAction } from './LeadDetail';

/**
 * The viewing-specific middle section of the lead detail — the preferred date +
 * time chips and the prospect's message.
 * @param props - The viewing lead.
 * @returns The viewing detail section.
 */
export function LeadDetailViewing(props: { lead: ManagementLeadOutput }) {
  const t = useTranslations('Management');
  const { lead } = props;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t('lead_preferred_time')}
        </span>
        <div className="flex flex-wrap gap-2">
          {lead.preferred_date ? (
            <span className="flex items-center gap-1.5 rounded-[10px] bg-primary-subtle px-3 py-2 text-sm font-medium text-primary-subtle-foreground">
              <CalendarClock className="size-4" />
              {lead.preferred_date}
            </span>
          ) : null}
          {lead.preferred_time ? (
            <span className="flex items-center gap-1.5 rounded-[10px] bg-primary-subtle px-3 py-2 text-sm font-medium text-primary-subtle-foreground">
              <Clock className="size-4" />
              {lead.preferred_time}
            </span>
          ) : null}
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
 * The viewing-specific action footer — Confirm viewing / Propose new time /
 * Cancel lead. Actions dim once the viewing is confirmed or cancelled.
 * @param props - The lead and the action dispatcher.
 * @returns The viewing footer element.
 */
LeadDetailViewing.Footer = function Footer(props: {
  lead: ManagementLeadOutput;
  onAction: (lead: ManagementLeadOutput, action: LeadAction) => void;
}) {
  const t = useTranslations('Management');
  const { lead } = props;
  const closed = lead.status === 'cancelled';
  const confirmed = lead.status === 'confirmed';

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Button onClick={() => props.onAction(lead, 'confirm')} disabled={closed || confirmed}>
          <CheckCircle2 className="size-4" />
          {t('lead_confirm_viewing')}
        </Button>
        <Button variant="outline" onClick={() => props.onAction(lead, 'propose')} disabled={closed}>
          <CalendarClock className="size-4" />
          {t('lead_propose_time')}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => props.onAction(lead, 'cancel')}
        disabled={closed}
        className="text-sm font-medium text-danger disabled:text-muted-foreground"
      >
        {t('lead_cancel')}
      </button>
    </div>
  );
};

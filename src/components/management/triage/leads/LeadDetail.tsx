'use client';

import { Mail, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { StatusPill, leadStatusTone } from '@/components/management/columns/StatusPill';
import { ActivityTimeline } from '@/components/management/record-panel/ActivityTimeline';
import type { ActivityEvent } from '@/components/management/record-panel/ActivityTimeline';
import { LeadPropertyCard } from '@/components/management/triage/leads/LeadPropertyCard';
import { titleCase } from '@/libs/management/format';
import type { ManagementLeadOutput } from '@/types/management';
import { LeadDetailBooking } from './LeadDetailBooking';
import { LeadDetailViewing } from './LeadDetailViewing';

export type LeadAction = 'confirm' | 'propose' | 'cancel' | 'approve' | 'reject' | 'convert';

/**
 * The lead detail panel — a shared prospect header (avatar, name, status pill,
 * phone/email with tel:/sms: quick actions) and requested-property card, with
 * the type-specific middle section and sticky action footer delegated to
 * {@link LeadDetailViewing} or {@link LeadDetailBooking}. The page only receives
 * an `onAction(lead, action)` callback, so the two state machines stay isolated.
 * @param props - The lead and the action dispatcher.
 * @returns The lead detail element.
 */
export function LeadDetail(props: {
  lead: ManagementLeadOutput;
  onAction: (lead: ManagementLeadOutput, action: LeadAction) => void;
}) {
  const t = useTranslations('Management');
  const { lead } = props;
  const contact = [lead.phone, lead.email].filter(Boolean).join(' · ');

  // Client-side activity timeline (no server audit trail — BACKEND-GAP). Built
  // inline so next-intl's t() namespace is statically resolvable.
  const activity: ActivityEvent[] = [
    {
      id: 'created',
      title:
        lead.type === 'booking' ? t('lead_evt_booking_created') : t('lead_evt_viewing_created'),
      time: new Date(lead.created_at).toLocaleString(),
      tone: 'accent',
    },
    ...(lead.reviewed_by_name
      ? [
          {
            id: 'reviewed',
            title: t('lead_evt_reviewed', { name: lead.reviewed_by_name }),
            time: new Date(lead.updated_at).toLocaleString(),
            tone: 'muted' as const,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AvatarInitials name={lead.name} size={44} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-[22px] leading-7 font-bold text-foreground">
                  {lead.name}
                </span>
                <StatusPill tone={leadStatusTone(lead.status)} label={titleCase(lead.status)} />
              </div>
              {contact ? <span className="text-sm text-muted-foreground">{contact}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                aria-label={t('lead_call')}
                className="flex size-10 items-center justify-center rounded-[10px] border border-border text-foreground hover:bg-muted"
              >
                <Phone className="size-4" />
              </a>
            ) : null}
            {lead.phone ? (
              <a
                href={`sms:${lead.phone}`}
                aria-label={t('lead_message')}
                className="flex size-10 items-center justify-center rounded-[10px] border border-border text-foreground hover:bg-muted"
              >
                <Mail className="size-4" />
              </a>
            ) : null}
          </div>
        </div>

        <LeadPropertyCard lead={lead} />

        {lead.type === 'viewing' ? (
          <LeadDetailViewing lead={lead} />
        ) : (
          <LeadDetailBooking lead={lead} />
        )}

        <ActivityTimeline heading={t('lead_activity')} events={activity} />
      </div>

      <div className="shrink-0 border-t border-border px-6 py-3.5">
        {lead.type === 'viewing' ? (
          <LeadDetailViewing.Footer lead={lead} onAction={props.onAction} />
        ) : (
          <LeadDetailBooking.Footer lead={lead} onAction={props.onAction} />
        )}
      </div>
    </div>
  );
}

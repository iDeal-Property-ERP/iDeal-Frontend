'use client';

import { Building2, CalendarClock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { StatusPill } from '@/components/management/columns/StatusPill';
import { QueueCard } from '@/components/management/triage/QueueCard';
import { relativeTime } from '@/libs/management/format';
import type { ManagementLeadOutput } from '@/types/management';

/**
 * A lead row in the triage left rail — avatar, prospect name, a Viewing/Booking
 * type pill, unread dot, the requested property, a slot/move-in line, and an age
 * chip. Selection styling and the unread dot come from the shared QueueCard.
 * @param props - The lead, its selected/unread state, and the select handler.
 * @returns The lead queue card element.
 */
export function LeadQueueCard(props: {
  lead: ManagementLeadOutput;
  selected: boolean;
  unread: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations('Management');
  const { lead } = props;

  const timing =
    lead.type === 'viewing'
      ? [lead.preferred_date, lead.preferred_time].filter(Boolean).join(' · ')
      : [
          lead.requested_start_date ? t('lead_move_in', { date: lead.requested_start_date }) : null,
          lead.monthly_rent_offer ? `$${lead.monthly_rent_offer}/mo` : null,
        ]
          .filter(Boolean)
          .join(' · ');

  return (
    <QueueCard selected={props.selected} unread={props.unread} onSelect={props.onSelect}>
      <div className="flex items-start gap-3">
        <AvatarInitials name={lead.name} size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 pr-4">
            <span className="truncate text-sm font-medium text-foreground">{lead.name}</span>
            {lead.status === 'converted' ? (
              <StatusPill tone="success" label={t('lead_converted')} />
            ) : (
              <StatusPill
                tone={lead.type === 'booking' ? 'accent' : 'info'}
                label={lead.type === 'booking' ? t('lead_type_booking') : t('lead_type_viewing')}
              />
            )}
          </div>
          <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" />
            {lead.property_name}
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <CalendarClock className="size-3.5 shrink-0" />
              {timing}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {relativeTime(lead.created_at)}
            </span>
          </div>
        </div>
      </div>
    </QueueCard>
  );
}

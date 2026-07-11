'use client';

import { ChevronLeft, Mail, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { StatusPill, leadStatusTone } from '@/components/management/columns/StatusPill';
import type { LeadAction } from '@/components/management/triage/leads/LeadDetail';
import { LeadDetailBooking } from '@/components/management/triage/leads/LeadDetailBooking';
import { LeadDetailViewing } from '@/components/management/triage/leads/LeadDetailViewing';
import { LeadPropertyCard } from '@/components/management/triage/leads/LeadPropertyCard';
import { LeadQueueCard } from '@/components/management/triage/leads/LeadQueueCard';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { titleCase } from '@/libs/management/format';
import type { ManagementLeadOutput } from '@/types/management';

/**
 * The compact mobile lead detail — a centered title bar with a round back button,
 * a prospect header, prominent labeled Call/Message buttons, the requested-property
 * card, the type-specific requested-time/message section, and a sticky action
 * footer. Reuses the shared body/footer sub-components so the state machines and
 * data bindings stay identical to desktop; only the chrome is mobile-specific
 * (no activity timeline, labeled contact buttons). See Figma 377:129 / 380:650.
 * @param props - The selected lead, the back handler, and the action dispatcher.
 * @returns The mobile lead detail element.
 */
function MobileLeadDetail(props: {
  lead: ManagementLeadOutput;
  onBack: () => void;
  onAction: (lead: ManagementLeadOutput, action: LeadAction) => void;
}) {
  const t = useTranslations('Management');
  const { lead } = props;

  return (
    <div className="flex min-h-[calc(100svh-8rem)] flex-col">
      <div className="relative flex h-11 items-center justify-center">
        <button
          type="button"
          onClick={props.onBack}
          aria-label={t('lead_back')}
          className="absolute left-0 flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-base font-semibold text-foreground">{t('lead_detail_title')}</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 pt-4">
        <div className="flex items-start gap-3">
          <AvatarInitials name={lead.name} size={48} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-[22px] leading-7 font-bold text-foreground">
                {lead.name}
              </span>
              <StatusPill tone={leadStatusTone(lead.status)} label={titleCase(lead.status)} />
            </div>
            {lead.phone ? (
              <span className="text-sm text-muted-foreground">{lead.phone}</span>
            ) : null}
          </div>
        </div>

        {lead.phone ? (
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${lead.phone}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-border bg-card text-[15px] font-semibold text-foreground"
            >
              <Phone className="size-[18px]" />
              {t('lead_call')}
            </a>
            <a
              href={`sms:${lead.phone}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-border bg-card text-[15px] font-semibold text-foreground"
            >
              <Mail className="size-[18px]" />
              {t('lead_message')}
            </a>
          </div>
        ) : null}

        <LeadPropertyCard lead={lead} />

        {lead.type === 'viewing' ? (
          <LeadDetailViewing lead={lead} />
        ) : (
          <LeadDetailBooking lead={lead} />
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-border bg-background px-4 py-3.5">
        {lead.type === 'viewing' ? (
          <LeadDetailViewing.Footer lead={lead} onAction={props.onAction} />
        ) : (
          <LeadDetailBooking.Footer lead={lead} onAction={props.onAction} />
        )}
      </div>
    </div>
  );
}

/**
 * The mobile Leads experience — a tab bar over a scrollable card list that pushes
 * to a compact full-screen detail. The list reuses {@link LeadQueueCard}; the
 * detail is a mobile-specific compact layout (see {@link MobileLeadDetail}). The
 * parent owns data, selection, and actions.
 * @param props - Leads, tabs, selection state, action dispatcher, and unread test.
 * @returns The mobile leads view.
 */
export function LeadsMobileView(props: {
  leads: ManagementLeadOutput[];
  views: SavedView[];
  activeView: string;
  onViewChange: (id: string) => void;
  selected: ManagementLeadOutput | null;
  onSelect: (lead: ManagementLeadOutput | null) => void;
  onAction: (lead: ManagementLeadOutput, action: LeadAction) => void;
  isUnread: (lead: ManagementLeadOutput) => boolean;
}) {
  if (props.selected) {
    return (
      <MobileLeadDetail
        lead={props.selected}
        onBack={() => props.onSelect(null)}
        onAction={props.onAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SavedViewTabs views={props.views} active={props.activeView} onChange={props.onViewChange} />
      <div className="flex flex-col gap-2">
        {props.leads.map((lead) => (
          <LeadQueueCard
            key={lead.id}
            lead={lead}
            selected={false}
            unread={props.isUnread(lead)}
            onSelect={() => props.onSelect(lead)}
          />
        ))}
      </div>
    </div>
  );
}

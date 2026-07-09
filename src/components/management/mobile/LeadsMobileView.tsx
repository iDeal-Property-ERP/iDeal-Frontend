'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LeadDetail } from '@/components/management/triage/leads/LeadDetail';
import type { LeadAction } from '@/components/management/triage/leads/LeadDetail';
import { LeadQueueCard } from '@/components/management/triage/leads/LeadQueueCard';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import type { ManagementLeadOutput } from '@/types/management';

/**
 * The mobile Leads experience — a tab bar over a scrollable card list that pushes
 * to a full-screen detail. Reuses {@link LeadQueueCard} and {@link LeadDetail}
 * so behaviour matches desktop; the parent owns data, selection, and actions.
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
  const t = useTranslations('Management');

  if (props.selected) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => props.onSelect(null)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
          {t('lead_back')}
        </button>
        <div className="rounded-[16px] border border-border bg-card">
          <LeadDetail lead={props.selected} onAction={props.onAction} />
        </div>
      </div>
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

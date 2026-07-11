'use client';

import { FileText, Handshake, PanelRightClose, Pencil, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AvatarInitials, initialsOf } from '@/components/management/columns/AvatarInitials';
import { agentStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatMoney } from '@/components/management/format';
import { EmptyState } from '@/components/management/states/EmptyState';
import { Button } from '@/components/ui/button';
import { getAgentDeals } from '@/libs/management/agentsAdapter';
import type { AgentDealOutput, AgentOutput } from '@/types/management';
import type { ActivityEvent } from './ActivityTimeline';
import { ActivityTimeline } from './ActivityTimeline';
import { OwnerAgreementCard } from './OwnerAgreementCard';
import { PricingTrio } from './PricingTrio';
import { RecordPanel } from './RecordPanel';
import { RecordPanelTabs } from './RecordPanelTabs';

/**
 * Formats an ISO date to a short "Jun 20, 2025" label.
 * @param iso - The ISO date string (or null).
 * @returns The formatted date, or an empty string when unparseable.
 */
function longDate(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Maps a deal status to a pill tone.
 * @param value - The backend deal status.
 * @returns The matching pill tone.
 */
function dealTone(value: string) {
  const s = value.toLowerCase();
  if (s === 'closed') {
    return 'success' as const;
  }
  if (s === 'pending') {
    return 'pending' as const;
  }
  return 'neutral' as const;
}

/**
 * The tab body for the agent record panel — the recent-deals list (with loading
 * and empty states), the overview/activity timeline, or a per-tab empty state.
 * Kept a self-contained sub-component so the parent panel avoids nested ternaries.
 * @param props - The active tab id, deals plus loading flag, and activity events.
 * @returns The tab body element.
 */
function AgentTabBody(props: {
  activeTab: string;
  deals: AgentDealOutput[];
  dealsLoading: boolean;
  activity: ActivityEvent[];
}) {
  const t = useTranslations('Management');
  const { activeTab, deals, dealsLoading, activity } = props;

  const dealStatusLabel = (value: string): string => {
    const s = value.toLowerCase();
    if (s === 'closed') {
      return t('agt_deal_closed');
    }
    if (s === 'pending') {
      return t('agt_deal_pending');
    }
    if (s === 'cancelled') {
      return t('agt_deal_cancelled');
    }
    return value;
  };

  if (activeTab === 'deals') {
    if (dealsLoading) {
      return (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={`deal-skeleton-${index}`} className="h-[64px] rounded-[12px] bg-muted/40" />
          ))}
        </div>
      );
    }
    if (deals.length > 0) {
      return (
        <ul className="flex flex-col gap-2">
          {deals.map((deal) => (
            <li
              key={deal.id}
              className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-background px-4 py-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {deal.property_name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {longDate(deal.deal_date)} · {formatMoney(deal.rent_amount)}
                </span>
              </div>
              <StatusPill tone={dealTone(deal.status)} label={dealStatusLabel(deal.status)} />
            </li>
          ))}
        </ul>
      );
    }
    return (
      <EmptyState icon={Handshake} title={t('agt_empty_deals')} tone="muted" className="py-10" />
    );
  }
  if (activeTab === 'overview' || activeTab === 'activity') {
    return <ActivityTimeline heading={t('recent_activity')} events={activity} />;
  }
  return (
    <EmptyState
      icon={activeTab === 'commission' ? Handshake : FileText}
      title={activeTab === 'commission' ? t('agt_empty_commission') : t('empty_documents')}
      tone="muted"
      className="py-10"
    />
  );
}

/**
 * The Agent instance of the record panel (archetype D) — fills the reusable
 * RecordPanel with an agent's header, deals/volume/commission trio, the contact
 * card, tabs, and their recent deal log (fetched on open), plus a sticky Record
 * deal / Edit agent footer. There is no hero photo for a partner agent.
 * @param props - The agent, open/close state, record-deal callback, and label.
 * @returns The agent record panel element.
 */
export function AgentRecordPanel(props: {
  agent: AgentOutput | null;
  open: boolean;
  onClose: () => void;
  onRecordDeal: () => void;
  onEdit: () => void;
  statusLabel: (isActive: boolean) => string;
  isTopAgent?: boolean;
}) {
  const t = useTranslations('Management');
  const { agent } = props;
  const [activeTab, setActiveTab] = useState('overview');
  const [deals, setDeals] = useState<AgentDealOutput[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);

  const agentId = agent?.id ?? null;
  const isOpen = props.open;

  useEffect(() => {
    let active = true;
    if (isOpen && agentId !== null) {
      setDealsLoading(true);
      const load = async () => {
        try {
          const rows = await getAgentDeals(agentId);
          if (active) {
            setDeals(rows);
          }
        } catch {
          if (active) {
            setDeals([]);
          }
        } finally {
          if (active) {
            setDealsLoading(false);
          }
        }
      };
      void load();
    }
    return () => {
      active = false;
    };
  }, [isOpen, agentId]);

  useEffect(() => {
    setActiveTab('overview');
  }, [agentId]);

  if (!agent) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'deals', label: t('agt_tab_deals') },
    { id: 'commission', label: t('agt_tab_commission') },
    { id: 'documents', label: t('tab_documents') },
    { id: 'activity', label: t('tab_activity') },
  ];

  const activity: ActivityEvent[] = [
    {
      id: 'joined',
      title: t('agt_activity_joined'),
      time: longDate(agent.created_at),
      tone: 'accent',
    },
    {
      id: 'updated',
      title: t('agt_activity_updated'),
      time: longDate(agent.updated_at),
      tone: 'muted',
    },
  ];

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {agent.user_name}
          </h2>
          <StatusPill
            tone={agentStatusTone(agent.is_active)}
            label={props.statusLabel(agent.is_active)}
          />
          {props.isTopAgent ? (
            <span className="inline-flex items-center rounded-full bg-accent-brand-subtle px-2.5 py-1 text-xs font-medium text-accent-brand-subtle-foreground">
              {t('agt_top_agent')}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {t('agt_detail_summary', { count: agent.total_deals, rate: agent.commission_rate })}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="max-lg:hidden"
          aria-label={t('record_close')}
          onClick={props.onClose}
        >
          <PanelRightClose className="size-4" />
        </Button>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
          onClick={props.onRecordDeal}
        >
          <Plus className="size-[15px]" />
          {t('agt_record_deal')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
          onClick={props.onEdit}
        >
          <Pencil className="size-[15px]" />
          {t('agt_edit_agent')}
        </Button>
      </div>
    </div>
  );

  return (
    <RecordPanel
      open={props.open}
      onClose={props.onClose}
      title={t('record_type_agent')}
      header={header}
      footer={footer}
    >
      <PricingTrio
        items={[
          {
            label: t('agt_deals_ytd'),
            value: String(agent.total_deals),
            caption: t('agt_deals_ytd_caption'),
          },
          {
            label: t('agt_volume'),
            value: formatMoney(agent.total_revenue),
            caption: t('agt_volume_caption'),
          },
          {
            label: t('agt_commission'),
            value: `${agent.commission_rate}%`,
            caption: t('agt_commission_caption'),
          },
        ]}
      />

      <OwnerAgreementCard
        initials={initialsOf(agent.user_name)}
        ownerLine={t('agt_contact_line', { name: agent.user_name })}
        detailLine={t('agt_detail_summary', {
          count: agent.total_deals,
          rate: agent.commission_rate,
        })}
        statusLabel={agent.is_active ? props.statusLabel(agent.is_active) : undefined}
      />

      <RecordPanelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <AgentTabBody
        activeTab={activeTab}
        deals={deals}
        dealsLoading={dealsLoading}
        activity={activity}
      />
    </RecordPanel>
  );
}

/**
 * A small inline avatar row (exported for reuse by agent list cells).
 * @param props - The agent name.
 * @returns The avatar-with-name cell.
 */
export function AgentCell(props: { name: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <AvatarInitials name={props.name} size={28} />
      <span className="truncate text-foreground">{props.name}</span>
    </span>
  );
}

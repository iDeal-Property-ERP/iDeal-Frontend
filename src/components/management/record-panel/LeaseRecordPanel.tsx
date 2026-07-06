'use client';

import { Building2, FileText, PanelRightClose, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AvatarInitials, initialsOf } from '@/components/management/columns/AvatarInitials';
import { leaseStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatMoney } from '@/components/management/format';
import { EmptyState } from '@/components/management/states/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';
import type { ManagementLeaseOutput } from '@/types/management';
import type { ActivityEvent } from './ActivityTimeline';
import { ActivityTimeline } from './ActivityTimeline';
import { OwnerAgreementCard } from './OwnerAgreementCard';
import { PricingTrio } from './PricingTrio';
import { RecordPanel } from './RecordPanel';
import { RecordPanelTabs } from './RecordPanelTabs';
import { VacancyAlert } from './VacancyAlert';

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
 * Whole days from today until an ISO date (negative when past).
 * @param iso - The ISO date string.
 * @returns The day delta, or null when unparseable.
 */
function daysUntil(iso: string): number | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const ms = date.getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * The Lease instance of the record panel (archetype D) — fills the reusable
 * RecordPanel with a lease's header, property hero, rent/deposit/term trio,
 * an expiry alert, the tenant card, tabs, and derived activity, plus a sticky
 * Edit / Renew footer with Terminate in the overflow.
 * @param props - The lease, open/close state, and renew/terminate callbacks.
 * @returns The lease record panel element.
 */
export function LeaseRecordPanel(props: {
  lease: ManagementLeaseOutput | null;
  open: boolean;
  onClose: () => void;
  onRenew: () => void;
  onTerminate: () => void;
  statusLabel: (status: string) => string;
}) {
  const t = useTranslations('Management');
  const { lease } = props;
  const [activeTab, setActiveTab] = useState('overview');

  if (!lease) {
    return null;
  }

  const days = daysUntil(lease.end_date);
  const isExpiringSoon = /active/iu.test(lease.status) && days !== null && days >= 0 && days <= 60;
  const term = Math.max(
    0,
    Math.round(
      (new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44),
    ),
  );

  const tabs = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'payments', label: t('tab_payments') },
    { id: 'documents', label: t('tab_documents') },
    { id: 'inventory', label: t('tab_inventory') },
    { id: 'activity', label: t('tab_activity') },
  ];

  const activity: ActivityEvent[] = [
    {
      id: 'signed',
      title: t('lease_activity_signed'),
      time: longDate(lease.start_date),
      tone: 'accent',
    },
    { id: 'ends', title: t('lease_activity_ends'), time: longDate(lease.end_date), tone: 'muted' },
    {
      id: 'updated',
      title: t('lease_activity_updated'),
      time: longDate(lease.updated_at),
      tone: 'muted',
    },
  ];

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {t('lease_code', { id: lease.id })}
          </h2>
          <StatusPill
            tone={leaseStatusTone(lease.status)}
            label={props.statusLabel(lease.status)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {lease.property_name} · {t('lease_signed_on', { date: longDate(lease.start_date) })}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {t('term_months', { count: term })}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
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
          onClick={props.onRenew}
        >
          <RefreshCw className="size-[15px]" />
          {t('lease_renew')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
          onClick={props.onTerminate}
        >
          {t('lease_terminate')}
        </Button>
      </div>
    </div>
  );

  return (
    <RecordPanel open={props.open} onClose={props.onClose} header={header} footer={footer}>
      <div className="flex h-[180px] w-full items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
        <Building2 className="size-10" strokeWidth={1.5} />
      </div>

      <PricingTrio
        items={[
          {
            label: t('lease_rent'),
            value: formatMoney(lease.monthly_rent),
            caption: t('lease_rent_caption'),
          },
          {
            label: t('lease_deposit'),
            value: formatMoney(lease.deposit),
            caption: t('lease_deposit_caption'),
          },
          {
            label: t('lease_term'),
            value: t('term_months', { count: term }),
            caption: t('lease_term_caption', { date: longDate(lease.end_date) }),
          },
        ]}
      />

      {isExpiringSoon ? (
        <VacancyAlert
          title={t('lease_expiry_title', { days })}
          detail={t('lease_expiry_detail', { date: longDate(lease.end_date) })}
          actionLabel={t('lease_start_renewal')}
          onAction={props.onRenew}
        />
      ) : null}

      <OwnerAgreementCard
        initials={initialsOf(lease.tenant_name)}
        ownerLine={t('lease_tenant_line', { name: lease.tenant_name })}
        detailLine={t('lease_property_line', { name: lease.property_name })}
        statusLabel={/active/iu.test(lease.status) ? props.statusLabel(lease.status) : undefined}
      />

      <RecordPanelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' || activeTab === 'activity' ? (
        <ActivityTimeline heading={t('recent_activity')} events={activity} />
      ) : (
        <EmptyState
          icon={activeTab === 'payments' ? FileText : Building2}
          title={t(`empty_${activeTab}` as 'empty_payments')}
          tone="muted"
          className="py-10"
        />
      )}
    </RecordPanel>
  );
}

/**
 * A small inline avatar row (exported for reuse by lease list cells).
 * @param props - The tenant name.
 * @returns The avatar-with-name cell.
 */
export function TenantCell(props: { name: string; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', props.className)}>
      <AvatarInitials name={props.name} size={28} />
      <span className="truncate text-foreground">{props.name}</span>
    </span>
  );
}

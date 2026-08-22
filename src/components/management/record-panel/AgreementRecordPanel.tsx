'use client';

import { Building2, FileText, PanelRightClose, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AvatarInitials, initialsOf } from '@/components/management/columns/AvatarInitials';
import { agreementStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatMoney } from '@/components/management/format';
import { EmptyState } from '@/components/management/states/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';
import type { ManagementAgreementOutput } from '@/types/management';
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
 * The Owner Agreement instance of the record panel (archetype D) — fills the
 * reusable RecordPanel with an agreement's header, property hero, a
 * commission / owner-guaranteed / tenant-charge trio (with the monthly margin as
 * the tenant-charge caption), an expiry alert, the owner card, tabs, and derived
 * activity, plus a sticky Renew / Terminate footer.
 * @param props - The agreement, open/close state, and renew/terminate callbacks.
 * @returns The agreement record panel element.
 */
export function AgreementRecordPanel(props: {
  agreement: ManagementAgreementOutput | null;
  open: boolean;
  onClose: () => void;
  onRenew: () => void;
  onTerminate: () => void;
  statusLabel: (status: string) => string;
}) {
  const t = useTranslations('Management');
  const { agreement } = props;
  const [activeTab, setActiveTab] = useState('overview');

  if (!agreement) {
    return null;
  }

  const days = daysUntil(agreement.end_date);
  const isExpiringSoon =
    /active/iu.test(agreement.status) && days !== null && days >= 0 && days <= 90;
  const term = Math.max(
    0,
    Math.round(
      (new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44),
    ),
  );

  const tabs = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'payouts', label: t('agr_tab_payouts') },
    { id: 'properties', label: t('agr_tab_properties') },
    { id: 'documents', label: t('tab_documents') },
    { id: 'activity', label: t('tab_activity') },
  ];

  const activity: ActivityEvent[] = [
    {
      id: 'signed',
      title: t('agr_activity_signed'),
      time: longDate(agreement.signed_date),
      tone: 'accent',
    },
    {
      id: 'start',
      title: t('agr_activity_started'),
      time: longDate(agreement.start_date),
      tone: 'muted',
    },
    {
      id: 'ends',
      title: t('agr_activity_ends'),
      time: longDate(agreement.end_date),
      tone: 'muted',
    },
    {
      id: 'updated',
      title: t('agr_activity_updated'),
      time: longDate(agreement.updated_at),
      tone: 'muted',
    },
  ];

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {t('agr_code', { number: agreement.agreement_number })}
          </h2>
          <StatusPill
            tone={agreementStatusTone(agreement.status)}
            label={props.statusLabel(agreement.status)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {agreement.property_name} ·{' '}
            {t('agr_signed_on', { date: longDate(agreement.signed_date) })}
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
          onClick={props.onRenew}
        >
          <RefreshCw className="size-[15px]" />
          {t('agr_renew')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
          onClick={props.onTerminate}
        >
          {t('agr_terminate')}
        </Button>
      </div>
    </div>
  );

  return (
    <RecordPanel
      open={props.open}
      onClose={props.onClose}
      title={t('record_type_agreement')}
      header={header}
      footer={footer}
    >
      <div className="flex h-[180px] w-full items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
        <Building2 className="size-10" strokeWidth={1.5} />
      </div>

      <PricingTrio
        items={[
          {
            label: t('agr_commission'),
            value: t('agr_commission_value', { rate: agreement.commission_rate }),
            caption: t('agr_commission_caption'),
          },
          {
            label: t('field_gross_floor'),
            value: formatMoney(agreement.gross_floor_amount, agreement.currency),
            caption: t('settlement_floor_caption'),
          },
          {
            label: t('field_payout_day'),
            value: t('settlement_payout_day_value', { day: agreement.payout_day }),
            caption: t('settlement_payout_day_caption'),
          },
        ]}
      />

      {isExpiringSoon ? (
        <VacancyAlert
          title={t('agr_expiry_title', { days })}
          detail={t('agr_expiry_detail', { date: longDate(agreement.end_date) })}
          actionLabel={t('agr_start_renewal')}
          onAction={props.onRenew}
        />
      ) : null}

      <OwnerAgreementCard
        initials={initialsOf(agreement.owner_name)}
        ownerLine={t('agr_owner_line', { name: agreement.owner_name })}
        detailLine={t('agr_detail_line', { number: agreement.agreement_number })}
        statusLabel={
          /active/iu.test(agreement.status) ? props.statusLabel(agreement.status) : undefined
        }
      />

      <RecordPanelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' || activeTab === 'activity' ? (
        <ActivityTimeline heading={t('recent_activity')} events={activity} />
      ) : (
        <EmptyState
          icon={activeTab === 'payouts' ? FileText : Building2}
          // SAFETY: Active tab identifier maps to localized empty state title
          title={t(`agr_empty_${activeTab}` as 'agr_empty_properties')}
          tone="muted"
          className="py-10"
        />
      )}
    </RecordPanel>
  );
}

/**
 * A small inline avatar row (exported for reuse by agreement list cells).
 * @param props - The owner name.
 * @returns The avatar-with-name cell.
 */
export function OwnerCell(props: { name: string; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', props.className)}>
      <AvatarInitials name={props.name} size={28} />
      <span className="truncate text-foreground">{props.name}</span>
    </span>
  );
}

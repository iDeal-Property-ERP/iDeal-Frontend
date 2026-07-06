'use client';

import {
  Ban,
  Building2,
  CheckCircle2,
  PanelRightClose,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { initialsOf } from '@/components/management/columns/AvatarInitials';
import { payoutStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatCurrency } from '@/components/management/format';
import { EmptyState } from '@/components/management/states/EmptyState';
import { Button } from '@/components/ui/button';
import type { ManagementPayoutOutput } from '@/types/management';
import type { ActivityEvent } from './ActivityTimeline';
import { ActivityTimeline } from './ActivityTimeline';
import { OwnerAgreementCard } from './OwnerAgreementCard';
import { PricingTrio } from './PricingTrio';
import { RecordPanel } from './RecordPanel';
import { RecordPanelTabs } from './RecordPanelTabs';
import { VacancyAlert } from './VacancyAlert';

/**
 * Formats an ISO date to a short "Jul 25, 2026" label.
 * @param iso - The ISO date string (or null).
 * @returns The formatted date, or an empty string.
 */
function longDate(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * The Payout instance of the record panel (archetype D) — fills the reusable
 * RecordPanel with a payout's header, amount/scheduled/method trio, a held-reason
 * alert, the owner + source-payment card, tabs, and a client-derived activity
 * timeline, plus a status-aware Confirm / Hold–Release / Cancel footer.
 * BACKEND-GAP: no audit trail — the activity events are derived from the payout's
 * own dates, held reason, and source payment.
 * @param props - The payout, open/close state, action callbacks, and label maps.
 * @returns The payout record panel element (or null with no payout).
 */
export function PayoutRecordPanel(props: {
  payout: ManagementPayoutOutput | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onHold: () => void;
  onRelease: () => void;
  onCancel: () => void;
  statusLabel: (status: string) => string;
  methodLabel: (method: string) => string;
}) {
  const t = useTranslations('Management');
  const { payout } = props;
  const [activeTab, setActiveTab] = useState('overview');

  if (!payout) {
    return null;
  }

  const status = payout.status.toLowerCase();
  const isHeld = status === 'held';
  const isPaid = status === 'paid';
  const isCancelled = status === 'cancelled';
  const money = (value: string) => formatCurrency(value, payout.currency);

  const tabs = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'activity', label: t('tab_activity') },
  ];

  const activity: ActivityEvent[] = [
    {
      id: 'accrued',
      title: payout.source_payment_id
        ? t('payout_activity_accrued', { id: payout.source_payment_id })
        : t('payout_activity_manual'),
      time: longDate(payout.created_at),
      tone: 'accent',
    },
    {
      id: 'scheduled',
      title: t('payout_activity_scheduled'),
      time: longDate(payout.scheduled_date),
      tone: 'muted',
    },
  ];
  if (isHeld) {
    activity.push({
      id: 'held',
      title: t('payout_activity_held'),
      time: longDate(payout.scheduled_date),
      tone: 'warning',
    });
  }
  if (isPaid) {
    activity.push({
      id: 'paid',
      title: t('payout_activity_paid'),
      time: longDate(payout.paid_date),
      tone: 'success',
    });
  }
  if (isCancelled) {
    activity.push({
      id: 'cancelled',
      title: t('payout_activity_cancelled'),
      time: longDate(payout.scheduled_date),
      tone: 'muted',
    });
  }

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {t('payout_code', { id: payout.id })}
          </h2>
          <StatusPill
            tone={payoutStatusTone(payout.status)}
            label={props.statusLabel(payout.status)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {payout.owner_name}
            {payout.property_name ? ` · ${payout.property_name}` : ''} ·{' '}
            {t('payout_run_on', { date: longDate(payout.scheduled_date) })}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {props.methodLabel(payout.method)}
          </span>
        </div>
      </div>
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
  );

  const settled = isPaid || isCancelled;
  const footer = settled ? (
    <Button
      type="button"
      variant="outline"
      className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
      disabled
    >
      <CheckCircle2 className="size-[15px]" />
      {props.statusLabel(payout.status)}
    </Button>
  ) : (
    <div className="flex items-center gap-2.5">
      <Button
        type="button"
        className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
        onClick={props.onConfirm}
      >
        <CheckCircle2 className="size-[15px]" />
        {t('confirm_payout')}
      </Button>
      {isHeld ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
          onClick={props.onRelease}
        >
          <PlayCircle className="size-[15px]" />
          {t('release_payout')}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
          onClick={props.onHold}
        >
          <PauseCircle className="size-[15px]" />
          {t('hold_payout')}
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('cancel_payout')}
        className="size-10 rounded-[10px] text-danger"
        onClick={props.onCancel}
      >
        <Ban className="size-[16px]" />
      </Button>
    </div>
  );

  return (
    <RecordPanel open={props.open} onClose={props.onClose} header={header} footer={footer}>
      <PricingTrio
        items={[
          {
            label: t('payment_amount'),
            value: money(payout.amount),
            caption: t('payout_amount_caption'),
          },
          {
            label: t('payout_scheduled'),
            value: longDate(payout.scheduled_date),
            caption: isPaid
              ? t('payout_paid_caption', { date: longDate(payout.paid_date) })
              : t('payout_scheduled_caption'),
          },
          {
            label: t('col_method'),
            value: props.methodLabel(payout.method),
            caption: t('payout_method_caption'),
          },
        ]}
      />

      {isHeld ? (
        <VacancyAlert
          title={t('payout_held_title')}
          detail={payout.status_reason ?? t('payout_held_detail')}
          actionLabel={t('release_payout')}
          onAction={props.onRelease}
        />
      ) : null}

      <OwnerAgreementCard
        initials={initialsOf(payout.owner_name)}
        ownerLine={t('payout_owner_line', { name: payout.owner_name })}
        detailLine={
          payout.source_payment_id
            ? t('payout_source_line', {
                agreement: payout.owner_agreement_id,
                payment: payout.source_payment_id,
              })
            : t('payout_agreement_line', { agreement: payout.owner_agreement_id })
        }
        statusLabel={isPaid ? props.statusLabel(payout.status) : undefined}
      />

      <RecordPanelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'activity' || activeTab === 'overview' ? (
        <ActivityTimeline heading={t('recent_activity')} events={activity} />
      ) : (
        <EmptyState icon={Building2} title={t('empty_notes')} tone="muted" className="py-10" />
      )}
    </RecordPanel>
  );
}

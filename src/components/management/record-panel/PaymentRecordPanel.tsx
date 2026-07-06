'use client';

import { Building2, CheckCircle2, PanelRightClose, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { initialsOf } from '@/components/management/columns/AvatarInitials';
import { paymentStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatCurrency } from '@/components/management/format';
import { EmptyState } from '@/components/management/states/EmptyState';
import { Button } from '@/components/ui/button';
import type { ManagementPaymentOutput } from '@/types/management';
import type { ActivityEvent } from './ActivityTimeline';
import { ActivityTimeline } from './ActivityTimeline';
import { OwnerAgreementCard } from './OwnerAgreementCard';
import { PricingTrio } from './PricingTrio';
import { RecordPanel } from './RecordPanel';
import { RecordPanelTabs } from './RecordPanelTabs';
import { VacancyAlert } from './VacancyAlert';

/**
 * Formats an ISO date to a short "Jun 1, 2026" label.
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
 * Whole days from today until an ISO date (negative when past).
 * @param iso - The ISO date string.
 * @returns The day delta, or null when unparseable.
 */
function daysUntil(iso: string): number | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * The Notes-tab body: the payment's note, or a muted empty state.
 * @param props - The note text and the empty-state label.
 * @returns The notes body element.
 */
function NotesBody(props: { notes: string | null; emptyLabel: string }) {
  if (props.notes) {
    return (
      <p className="rounded-[12px] bg-muted/50 px-4 py-3 text-sm text-foreground">{props.notes}</p>
    );
  }
  return <EmptyState icon={Building2} title={props.emptyLabel} tone="muted" className="py-10" />;
}

/**
 * The Payment instance of the record panel (archetype D) — fills the reusable
 * RecordPanel with a payment's header, amount/due/method trio, an overdue alert,
 * the payer + lease card, tabs, and a client-derived activity timeline, plus a
 * sticky Send-reminder / Mark-paid footer.
 * BACKEND-GAP: there is no audit trail, so the activity events are derived from
 * the payment's own dates + linked payout.
 * @param props - The payment, open/close state, action callbacks, and label maps.
 * @returns The payment record panel element (or null with no payment).
 */
export function PaymentRecordPanel(props: {
  payment: ManagementPaymentOutput | null;
  open: boolean;
  onClose: () => void;
  onMarkPaid: () => void;
  onRemind: () => void;
  statusLabel: (status: string) => string;
  methodLabel: (method: string) => string;
}) {
  const t = useTranslations('Management');
  const { payment } = props;
  const [activeTab, setActiveTab] = useState('overview');

  if (!payment) {
    return null;
  }

  const isPaid = payment.status.toLowerCase() === 'paid';
  const isCancelled = payment.status.toLowerCase() === 'cancelled';
  const days = daysUntil(payment.due_date);
  const overdue = !isPaid && !isCancelled && days !== null && days < 0;
  const money = (value: string) => formatCurrency(value, payment.currency);

  const tabs = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'activity', label: t('tab_activity') },
    { id: 'notes', label: t('tab_notes') },
  ];

  // Built in an IIFE so the status branches don't inflate the component's
  // cyclomatic complexity (and t() stays in the Management-namespace scope).
  const activity: ActivityEvent[] = ((): ActivityEvent[] => {
    const events: ActivityEvent[] = [
      {
        id: 'issued',
        title: t('payment_activity_issued', { amount: money(payment.amount) }),
        time: longDate(payment.created_at),
        tone: 'accent',
      },
      {
        id: 'due',
        title: t('payment_activity_due'),
        time: longDate(payment.due_date),
        tone: overdue ? 'warning' : 'muted',
      },
    ];
    if (isPaid) {
      events.push({
        id: 'paid',
        title: t('payment_activity_paid'),
        time: longDate(payment.payment_date),
        tone: 'success',
      });
      if (payment.linked_payout_id) {
        events.push({
          id: 'payout',
          title: t('payment_activity_payout', { id: payment.linked_payout_id }),
          time: longDate(payment.payment_date),
          tone: 'muted',
        });
      }
    } else if (overdue) {
      events.push({
        id: 'overdue',
        title: t('payment_activity_overdue'),
        time: longDate(payment.due_date),
        tone: 'warning',
      });
    }
    return events;
  })();

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {t('payment_code', { id: payment.id })}
          </h2>
          <StatusPill
            tone={paymentStatusTone(payment.status)}
            label={props.statusLabel(payment.status)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {payment.tenant_name}
            {payment.property_name ? ` · ${payment.property_name}` : ''} ·{' '}
            {t('payment_due_on', { date: longDate(payment.due_date) })}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {props.methodLabel(payment.method)}
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

  const footer = (
    <div className="flex items-center gap-2.5">
      {isPaid || isCancelled ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
          onClick={props.onRemind}
          disabled
        >
          <CheckCircle2 className="size-[15px]" />
          {props.statusLabel(payment.status)}
        </Button>
      ) : (
        <>
          <Button
            type="button"
            className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
            onClick={props.onMarkPaid}
          >
            <CheckCircle2 className="size-[15px]" />
            {t('mark_paid')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
            onClick={props.onRemind}
          >
            <Send className="size-[15px]" />
            {t('send_reminder')}
          </Button>
        </>
      )}
    </div>
  );

  return (
    <RecordPanel open={props.open} onClose={props.onClose} header={header} footer={footer}>
      <PricingTrio
        items={[
          {
            label: t('payment_amount'),
            value: money(payment.amount),
            caption: t('payment_amount_caption'),
          },
          {
            label: t('payment_due_date'),
            value: longDate(payment.due_date),
            caption: overdue
              ? t('overdue_by_days', { count: days !== null ? -days : 0 })
              : t('payment_due_caption'),
          },
          {
            label: t('col_method'),
            value: props.methodLabel(payment.method),
            caption: payment.gateway_ref
              ? t('payment_ref_caption', { ref: payment.gateway_ref })
              : t('payment_method_caption'),
          },
        ]}
      />

      {overdue ? (
        <VacancyAlert
          title={t('overdue_by_days', { count: days !== null ? -days : 0 })}
          detail={t('payment_overdue_detail', { date: longDate(payment.due_date) })}
          actionLabel={t('send_reminder')}
          onAction={props.onRemind}
        />
      ) : null}

      <OwnerAgreementCard
        initials={initialsOf(payment.tenant_name)}
        ownerLine={t('payment_payer_line', { name: payment.tenant_name })}
        detailLine={t('payment_lease_line', {
          id: payment.lease_id,
          property: payment.property_name ?? '',
        })}
        statusLabel={isPaid ? props.statusLabel(payment.status) : undefined}
      />

      <RecordPanelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'notes' ? (
        <NotesBody notes={payment.notes} emptyLabel={t('empty_notes')} />
      ) : (
        <ActivityTimeline heading={t('recent_activity')} events={activity} />
      )}
    </RecordPanel>
  );
}

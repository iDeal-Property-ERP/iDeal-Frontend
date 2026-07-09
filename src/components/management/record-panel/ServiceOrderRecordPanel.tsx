'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { StatusPill, vasOrderStatusTone } from '@/components/management/columns/StatusPill';
import { ActivityTimeline } from '@/components/management/record-panel/ActivityTimeline';
import type { ActivityEvent } from '@/components/management/record-panel/ActivityTimeline';
import { PricingTrio } from '@/components/management/record-panel/PricingTrio';
import { RecordPanel } from '@/components/management/record-panel/RecordPanel';
import { RecordPanelTabs } from '@/components/management/record-panel/RecordPanelTabs';
import { serviceTypeIcon } from '@/components/management/services/ServiceCard';
import { Button } from '@/components/ui/button';
import { titleCase } from '@/libs/management/format';
import type { ServiceOrderOutput } from '@/types/vas';

/**
 * The Services record panel — the workbench side sheet for a VAS order, per the
 * Figma design: header (service — order + status/type pills), the service hero,
 * a Price/Commission/Cashback trio, an "awaiting confirmation" strip on new
 * orders, customer and partner cards, and Overview/Activity tabs. Footer:
 * Confirm · Schedule · Cancel, contextual by status.
 * @param props - The order, open state, close handler, and action callbacks.
 * @returns The services record panel element (null when closed).
 */
export function ServiceOrderRecordPanel(props: {
  order: ServiceOrderOutput | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSchedule: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Management');
  const [tab, setTab] = useState('overview');
  const { order } = props;
  const orderId = order?.id ?? null;

  useEffect(() => {
    setTab('overview');
  }, [orderId]);

  if (!order) {
    return null;
  }

  const terminal = order.status === 'completed' || order.status === 'cancelled';
  const Icon = serviceTypeIcon(order.service_type);

  const trio = [
    {
      label: t('svc_trio_price'),
      value: `$${order.cost}`,
      caption: order.partner_name
        ? t('svc_trio_price_caption', { partner: order.partner_name })
        : t('svc_trio_price_caption_no_partner'),
    },
    {
      label: t('svc_trio_commission'),
      value: `$${order.commission_earned}`,
      caption: t('svc_trio_commission_caption'),
    },
    {
      label: t('svc_trio_cashback'),
      value: `$${order.cashback_amount}`,
      caption: t('svc_trio_cashback_caption'),
    },
  ];

  const activity: ActivityEvent[] = [
    {
      id: 'created',
      title: t('svc_activity_created', { name: order.tenant_name }),
      time: new Date(order.created_at).toLocaleString(),
      tone: 'accent',
    },
    {
      id: 'priced',
      title: t('svc_activity_priced', {
        cost: `$${order.cost}`,
        commission: `$${order.commission_earned}`,
      }),
      time: new Date(order.created_at).toLocaleString(),
      tone: 'muted',
    },
    ...(order.scheduled_for
      ? [
          {
            id: 'scheduled',
            title: t('svc_activity_scheduled', { date: order.scheduled_for }),
            time: new Date(order.updated_at).toLocaleString(),
            tone: 'muted' as const,
          },
        ]
      : []),
    ...(order.completed_at
      ? [
          {
            id: 'completed',
            title: t('svc_activity_completed'),
            time: new Date(order.completed_at).toLocaleString(),
            tone: 'success' as const,
          },
        ]
      : []),
    ...(order.cancellation_reason
      ? [
          {
            id: 'cancelled',
            title: t('svc_activity_cancelled', { reason: order.cancellation_reason }),
            time: new Date(order.updated_at).toLocaleString(),
            tone: 'warning' as const,
          },
        ]
      : []),
  ];

  const header = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-display text-[22px] leading-7 font-bold text-foreground">
          {order.catalog_item_name}
        </span>
        <StatusPill
          tone={vasOrderStatusTone(order.status)}
          label={t(`vas_status_${order.status}` as never)}
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {t('svc_order_number', { id: order.id })} · {order.property_name} ·{' '}
        {t(`vas_type_${order.service_type}` as never)}
      </span>
    </div>
  );

  return (
    <RecordPanel
      open={props.open}
      onClose={props.onClose}
      header={header}
      footer={
        <div className="flex items-center gap-3">
          <Button onClick={props.onConfirm} disabled={order.status !== 'requested'}>
            {t('svc_confirm_order')}
          </Button>
          <Button variant="outline" onClick={props.onSchedule} disabled={terminal}>
            {t('svc_schedule')}
          </Button>
          <button
            type="button"
            onClick={props.onCancel}
            disabled={terminal}
            className="ml-auto text-sm font-medium text-danger disabled:text-muted-foreground"
          >
            {t('svc_cancel_order')}
          </button>
        </div>
      }
    >
      <div className="flex h-28 items-center justify-center rounded-[12px] bg-muted">
        <Icon className="size-10 text-primary" />
      </div>

      <PricingTrio items={trio} />

      {order.status === 'requested' ? (
        <div className="flex items-center justify-between gap-3 rounded-[12px] bg-warning-subtle px-3.5 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-warning-subtle-foreground">
              {t('svc_alert_title')}
            </span>
            <span className="text-xs text-warning-subtle-foreground/80">
              {order.scheduled_for
                ? t('svc_alert_scheduled', { date: order.scheduled_for })
                : t('svc_alert_unscheduled')}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={props.onConfirm}>
            {t('svc_confirm_now')}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t('svc_customer')}
        </span>
        <div className="flex items-center gap-3 rounded-[12px] border border-border bg-background px-3.5 py-3">
          <AvatarInitials name={order.tenant_name} size={36} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {order.tenant_name}
            </span>
            <span className="truncate text-xs text-muted-foreground">{order.property_name}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t('svc_partner')}
        </span>
        <div className="flex items-center gap-3 rounded-[12px] border border-border bg-background px-3.5 py-3">
          {order.partner_name ? (
            <AvatarInitials name={order.partner_name} size={36} />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              —
            </span>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {order.partner_name ?? t('svc_no_partner')}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {t('svc_partner_caption')}
            </span>
          </div>
        </div>
      </div>

      <RecordPanelTabs
        tabs={[
          { id: 'overview', label: t('svc_tab_overview') },
          { id: 'activity', label: t('svc_tab_activity') },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' ? (
        <p className="text-sm leading-5 text-foreground">
          {order.notes?.trim() ? order.notes : titleCase(order.status)}
        </p>
      ) : null}
      {tab === 'activity' ? (
        <ActivityTimeline heading={t('svc_tab_activity')} events={activity} />
      ) : null}
    </RecordPanel>
  );
}

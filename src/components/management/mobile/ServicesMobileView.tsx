'use client';

import { useTranslations } from 'next-intl';
import { StatusPill, vasOrderStatusTone } from '@/components/management/columns/StatusPill';
import { SwipeActionRow } from '@/components/management/mobile/SwipeActionRow';
import { serviceTypeIcon } from '@/components/management/services/ServiceCard';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { relativeTime } from '@/libs/management/format';
import type { ServiceOrderOutput } from '@/types/vas';

/**
 * The mobile Services experience — tab pills over a swipeable order-card list,
 * per the Figma mobile frame. Swipe reveals Confirm / Cancel; tapping a card
 * opens the (auto full-screen) record panel owned by the page. The parent owns
 * data, tabs, and actions.
 * @param props - Orders, tabs, and the tap/swipe action handlers.
 * @returns The mobile services view.
 */
export function ServicesMobileView(props: {
  orders: ServiceOrderOutput[];
  views: SavedView[];
  activeView: string;
  onViewChange: (id: string) => void;
  onOpen: (order: ServiceOrderOutput) => void;
  onConfirm: (order: ServiceOrderOutput) => void;
  onCancel: (order: ServiceOrderOutput) => void;
}) {
  const t = useTranslations('Management');

  return (
    <div className="flex flex-col gap-4">
      <SavedViewTabs views={props.views} active={props.activeView} onChange={props.onViewChange} />
      <div className="flex flex-col gap-2">
        {props.orders.map((order) => {
          const Icon = serviceTypeIcon(order.service_type);
          return (
            <SwipeActionRow
              key={order.id}
              onPaid={() => props.onConfirm(order)}
              onRemind={() => props.onCancel(order)}
              paidLabel={t('svc_confirm')}
              remindLabel={t('svc_cancel')}
            >
              <button
                type="button"
                onClick={() => props.onOpen(order)}
                className="flex w-full items-start gap-3 rounded-[12px] border border-border bg-card px-3.5 py-3 text-left"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {order.catalog_item_name}
                    </span>
                    <StatusPill
                      tone={vasOrderStatusTone(order.status)}
                      // SAFETY: Order status mapped to localized VAS status key
                      label={t(`vas_status_${order.status}` as never)}
                    />
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {order.property_name} · ${order.cost} · {relativeTime(order.created_at)}
                  </span>
                </div>
              </button>
            </SwipeActionRow>
          );
        })}
      </div>
    </div>
  );
}

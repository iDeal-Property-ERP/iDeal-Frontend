'use client';

import { Check } from 'lucide-react';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { formatMoney } from '@/components/management/format';
import { useLongPress } from '@/hooks/useLongPress';
import { cn } from '@/libs/utils';
import type { ManagementPaymentOutput } from '@/types/management';
import { SwipeActionRow } from './SwipeActionRow';

export type MobilePaymentTab = { id: string; label: string; count?: number };

/**
 * One payment row inside the mobile list. In browse mode it swipes to reveal
 * Paid/Remind and long-presses into selection mode; in selection mode it becomes
 * a checkbox row (primary-subtle fill + check when selected).
 * @param props - The payment, mode/selection state, and the row callbacks.
 * @returns The mobile payment row.
 */
function Row(props: {
  payment: ManagementPaymentOutput;
  selecting: boolean;
  selected: boolean;
  overdueSubline: (payment: ManagementPaymentOutput) => string;
  paidLabel: string;
  remindLabel: string;
  onEnterSelection: () => void;
  onToggle: () => void;
  onOpen: () => void;
  onPaid: () => void;
  onRemind: () => void;
}) {
  const longPress = useLongPress(props.onEnterSelection);
  const { payment } = props;

  const card = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[14px] border bg-card px-3.5 py-3',
        props.selecting && props.selected ? 'border-primary/50 bg-primary-subtle' : 'border-border',
      )}
    >
      {props.selecting ? (
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
            props.selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
          )}
        >
          {props.selected ? <Check className="size-3.5" /> : null}
        </span>
      ) : (
        <AvatarInitials name={payment.tenant_name} size={40} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-foreground">{payment.tenant_name}</span>
        <span className="text-sm text-danger">{props.overdueSubline(payment)}</span>
      </div>
      <span className="shrink-0 font-medium text-foreground tabular-nums">
        {formatMoney(payment.amount, payment.currency === 'UZS' ? '' : '$')}
      </span>
    </div>
  );

  if (props.selecting) {
    return (
      <button type="button" className="w-full text-left" onClick={props.onToggle}>
        {card}
      </button>
    );
  }

  return (
    <SwipeActionRow
      onPaid={props.onPaid}
      onRemind={props.onRemind}
      paidLabel={props.paidLabel}
      remindLabel={props.remindLabel}
    >
      <button type="button" className="w-full text-left" onClick={props.onOpen} {...longPress}>
        {card}
      </button>
    </SwipeActionRow>
  );
}

/**
 * The mobile Payments list (Figma M · Money — Payments): a status pill-tab row
 * (Overdue / Due / Paid), a "Select" toggle, the swipe-and-long-press row list,
 * and the swipe/selection hints. Selection + bulk actions are driven by the
 * page; this component is purely the touch-first list surface.
 * @param props - Tabs, rows, selection state, labels, and row callbacks.
 * @returns The mobile payments list.
 */
export function MobilePaymentsList(props: {
  tabs: MobilePaymentTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  payments: ManagementPaymentOutput[];
  selecting: boolean;
  isSelected: (id: number) => boolean;
  onToggle: (id: number) => void;
  onEnterSelection: (id: number) => void;
  onOpen: (payment: ManagementPaymentOutput) => void;
  onPaid: (payment: ManagementPaymentOutput) => void;
  onRemind: (payment: ManagementPaymentOutput) => void;
  overdueSubline: (payment: ManagementPaymentOutput) => string;
  selectLabel: string;
  doneLabel: string;
  swipeHint: string;
  longPressHint: string;
  paidLabel: string;
  remindLabel: string;
  onToggleSelecting: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {props.tabs.map((tab) => {
            const active = tab.id === props.activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => props.onTabChange(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-danger text-white'
                    : 'border border-border bg-card text-muted-foreground',
                )}
              >
                {tab.label}
                {tab.count !== undefined ? (
                  <span
                    className={cn(
                      'tabular-nums',
                      active ? 'text-white/80' : 'text-muted-foreground',
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={props.onToggleSelecting}
          className="shrink-0 text-sm font-medium text-accent-brand"
        >
          {props.selecting ? props.doneLabel : props.selectLabel}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {props.selecting ? props.longPressHint : props.swipeHint}
      </p>

      <div className="flex flex-col gap-2.5">
        {props.payments.map((payment) => (
          <Row
            key={payment.id}
            payment={payment}
            selecting={props.selecting}
            selected={props.isSelected(payment.id)}
            overdueSubline={props.overdueSubline}
            paidLabel={props.paidLabel}
            remindLabel={props.remindLabel}
            onEnterSelection={() => props.onEnterSelection(payment.id)}
            onToggle={() => props.onToggle(payment.id)}
            onOpen={() => props.onOpen(payment)}
            onPaid={() => props.onPaid(payment)}
            onRemind={() => props.onRemind(payment)}
          />
        ))}
      </div>
    </div>
  );
}

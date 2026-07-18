'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { formatCurrency } from '@/components/management/format';
import { Button } from '@/components/ui/button';
import type { ManagementPaymentOutput, PaymentsStats } from '@/types/management';
import { MarkPaidSheet } from './MarkPaidSheet';
import { MobileBulkBar } from './MobileBulkBar';
import { MobilePaymentsList } from './MobilePaymentsList';

const MOBILE_METHODS = ['cash', 'bank_transfer', 'click', 'payme'];

/**
 * Sums the selected rows in USD (best-effort, mixed currencies added numerically).
 * @param rows - The selected payments.
 * @returns The formatted total.
 */
function selectedSum(rows: ManagementPaymentOutput[]): string {
  return formatCurrency(
    rows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0),
    'USD',
  );
}

/**
 * The mobile Payments surface (Figma M · Money — Payments): the page header, the
 * swipe/long-press list, the sticky selection bulk bar, and the Mark-paid bottom
 * sheet. Self-contained so the page orchestrator stays a thin desktop/mobile
 * switch; carries its own translator so every label resolves in-namespace.
 * @param props - The header, data, selection state, and action callbacks.
 * @returns The mobile payments view.
 */
export function PaymentsMobileView(props: {
  header: ReactNode;
  stats: PaymentsStats | null;
  payments: ManagementPaymentOutput[];
  mobileTab: string;
  onTabChange: (id: string) => void;
  selecting: boolean;
  onToggleSelecting: () => void;
  onCancelSelection: () => void;
  isSelected: (id: number) => boolean;
  selectionCount: number;
  selectedRows: ManagementPaymentOutput[];
  onToggle: (id: number) => void;
  onEnterSelection: (id: number) => void;
  onOpen: (payment: ManagementPaymentOutput) => void;
  onPaid: (payment: ManagementPaymentOutput) => void;
  onRemind: (payment: ManagementPaymentOutput) => void;
  onBulkRemind: () => void;
  onConfirm: (method: string) => void;
  overdueSubline: (payment: ManagementPaymentOutput) => string;
  methodLabel: (method: string) => string;
  markSheetOpen: boolean;
  setMarkSheetOpen: (open: boolean) => void;
  onOpenMarkSheet: () => void;
}) {
  const t = useTranslations('Management');
  const sum = selectedSum(props.selectedRows);

  return (
    <div className="flex flex-col gap-5 pb-24">
      {props.header}
      <MobilePaymentsList
        tabs={[
          { id: 'overdue', label: t('payment_view_overdue'), count: props.stats?.counts.overdue },
          { id: 'due', label: t('payment_mobile_due'), count: props.stats?.counts.due_month },
          { id: 'paid', label: t('payment_view_paid'), count: props.stats?.counts.paid_month },
        ]}
        activeTab={props.mobileTab}
        onTabChange={props.onTabChange}
        payments={props.payments}
        selecting={props.selecting}
        isSelected={props.isSelected}
        onToggle={props.onToggle}
        onEnterSelection={props.onEnterSelection}
        onOpen={props.onOpen}
        onPaid={props.onPaid}
        onRemind={props.onRemind}
        overdueSubline={props.overdueSubline}
        selectLabel={t('select')}
        doneLabel={t('done')}
        swipeHint={t('payment_swipe_hint')}
        longPressHint={t('payment_longpress_hint')}
        paidLabel={t('mark_paid_short')}
        remindLabel={t('remind')}
        onToggleSelecting={props.onToggleSelecting}
      />
      <MobileBulkBar
        open={props.selecting && props.selectionCount > 0}
        summary={t('bulk_selected_sum', { count: props.selectionCount, sum })}
        cancelLabel={t('cancel')}
        onCancel={props.onCancelSelection}
        actions={
          <>
            <Button className="h-12 flex-1 gap-2 rounded-[12px]" onClick={props.onOpenMarkSheet}>
              {t('mark_paid')}
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 gap-2 rounded-[12px]"
              onClick={props.onBulkRemind}
            >
              {t('remind')}
            </Button>
          </>
        }
      />
      <MarkPaidSheet
        open={props.markSheetOpen}
        onOpenChange={(v) => props.setMarkSheetOpen(v)}
        title={t('bulk_mark_paid_q', { count: props.selectionCount })}
        subtitle={t('bulk_mark_paid_desc', { total: sum })}
        lines={props.selectedRows.map((row) => ({
          id: row.id,
          name: row.tenant_name,
          detail: `${formatCurrency(row.amount, row.currency)} · ${props.overdueSubline(row)}`,
        }))}
        methodOptions={MOBILE_METHODS.map((value) => ({ value, label: props.methodLabel(value) }))}
        methodLabel={t('field_method')}
        cashHint={t('mark_paid_cash_hint')}
        confirmLabel={t('mark_paid_confirm_sum', { sum })}
        onConfirm={props.onConfirm}
      />
    </div>
  );
}

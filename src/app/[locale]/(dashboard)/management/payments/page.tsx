'use client';

import { AlertCircle, CircleDollarSign, Download, HandCoins, Plus, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { DueDateCell } from '@/components/management/columns/DueDateCell';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { NumericCell } from '@/components/management/columns/NumericCell';
import { RowActions } from '@/components/management/columns/RowActions';
import { paymentStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { ExportDialog } from '@/components/management/dialogs/ExportDialog';
import type { ExportScope } from '@/components/management/dialogs/ExportDialog';
import {
  BulkMarkPaidDialog,
  RecordPaymentDialog,
} from '@/components/management/dialogs/PaymentDialogs';
import { formatCurrency } from '@/components/management/format';
import type { KpiItem } from '@/components/management/KpiStrip';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { PaymentsMobileView } from '@/components/management/mobile/PaymentsMobileView';
import { PaymentRecordPanel } from '@/components/management/record-panel/PaymentRecordPanel';
import { EmptyState } from '@/components/management/states/EmptyState';
import { ErrorState } from '@/components/management/states/ErrorState';
import { FilteredEmptyState } from '@/components/management/states/FilteredEmptyState';
import { BulkSelectionBar } from '@/components/management/workbench/BulkSelectionBar';
import { DateRangeChip } from '@/components/management/workbench/DateRangeChip';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { WorkbenchKpiGrid } from '@/components/management/workbench/WorkbenchKpiGrid';
import { WorkbenchPagination } from '@/components/management/workbench/WorkbenchPagination';
import { WorkbenchShell } from '@/components/management/workbench/WorkbenchShell';
import { WorkbenchTable } from '@/components/management/workbench/WorkbenchTable';
import type { WorkbenchColumn } from '@/components/management/workbench/WorkbenchTable';
import { WorkbenchTableSkeleton } from '@/components/management/workbench/WorkbenchTableSkeleton';
import { WorkbenchToolbar } from '@/components/management/workbench/WorkbenchToolbar';
import type { ChipFilter } from '@/components/management/workbench/WorkbenchToolbar';
import { Button } from '@/components/ui/button';
import { usePaginatedResource } from '@/hooks/management/usePaginatedResource';
import type { QueryParams } from '@/hooks/management/usePaginatedResource';
import { useRowSelection } from '@/hooks/management/useRowSelection';
import { useIsMobile } from '@/hooks/use-mobile';
import { downloadTable } from '@/libs/management/exportFile';
import {
  bulkMarkPaymentsPaid,
  bulkRemindPayments,
  buildPaymentExportRows,
  getPaymentsStats,
  listPayments,
} from '@/libs/management/paymentsAdapter';
import type { PaymentListParams } from '@/libs/management/paymentsAdapter';
import { listProperties } from '@/libs/management/propertiesAdapter';
import type { ManagementPaymentOutput, PaymentsStats } from '@/types/management';

/** Payment methods, for the Method filter chip. */
const METHOD_VALUES = ['cash', 'bank_transfer', 'click', 'payme', 'uzum', 'online'];

/**
 * First/last day of the current month as ISO dates.
 * @returns The month's start and end.
 */
function monthBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/**
 * Maps a saved-view id to the backend query it applies.
 * @param view - The saved-view id.
 * @returns The status/overdue/due-range query for that view.
 */
function queryForView(view: string): QueryParams {
  if (view === 'overdue') {
    return { overdue: 'true', status: undefined, due_from: undefined, due_to: undefined };
  }
  if (view === 'due_month') {
    const { start, end } = monthBounds();
    return { status: 'pending', due_from: start, due_to: end, overdue: undefined };
  }
  if (view === 'paid') {
    return { status: 'paid', overdue: undefined, due_from: undefined, due_to: undefined };
  }
  return { status: undefined, overdue: undefined, due_from: undefined, due_to: undefined };
}

/**
 * Reverses the active query back to a saved-view id.
 * @param query - The current query params.
 * @returns The matching saved-view id.
 */
function viewFromQuery(query: QueryParams): string {
  if (query.overdue) {
    return 'overdue';
  }
  if (query.status === 'paid') {
    return 'paid';
  }
  if (query.status === 'pending' && query.due_from) {
    return 'due_month';
  }
  return 'all';
}

/**
 * Maps the paginated-resource query to the payments adapter params.
 * @param page - The requested page.
 * @param query - The active query params.
 * @returns The listPayments params.
 */
function queryToParams(page: number, query: QueryParams): PaymentListParams {
  return {
    page,
    search: query.search as string | undefined,
    status: query.status as string | undefined,
    method: query.method as string | undefined,
    propertyId: query.property_id as string | undefined,
    dueFrom: query.due_from as string | undefined,
    dueTo: query.due_to as string | undefined,
    overdue: query.overdue === 'true',
    order: (query.order as string | undefined) ?? 'due_date',
  };
}

/**
 * Short date ("Jun 1").
 * @param iso - The ISO date string.
 * @returns The short label, or an empty string.
 */
function shortDate(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Month label ("June 2026") from a "YYYY-MM" key.
 * @param key - The month key.
 * @returns The long month label.
 */
function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return Number.isNaN(date.getTime())
    ? key
    : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Whole days from today until an ISO date (negative when past).
 * @param iso - The ISO date string.
 * @returns The day delta, or null.
 */
function daysBetween(iso: string): number | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * The Payments Workbench — the overdue-first rent-collection list: money KPI
 * strip, saved-view tabs, filter toolbar (method, property, due-date range), a
 * selectable table with quick Mark-paid + a floating bulk bar (mark paid / send
 * reminder), pagination, an in-flow payment record panel, and the
 * record-payment + bulk-mark-paid + export dialogs. On mobile it swaps to the
 * swipe/long-press list with a Mark-paid bottom sheet. Reuses the workbench
 * foundation; wired to the live backend.
 * @returns The payments workbench page.
 */
export default function ManagementPaymentsPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();
  const resource = usePaginatedResource<ManagementPaymentOutput>(
    async ({ page, query }) => await listPayments(queryToParams(page, query)),
    { initialQuery: { ...queryForView('overdue'), order: 'due_date' } },
  );

  const search = (resource.query.search as string | undefined) ?? '';
  const view = viewFromQuery(resource.query);

  const [selected, setSelected] = useState<ManagementPaymentOutput | null>(null);
  const [stats, setStats] = useState<PaymentsStats | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [markSheetOpen, setMarkSheetOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([]);
  const [mobileTab, setMobileTab] = useState('overdue');

  const rows = resource.data;
  const pageIds = rows.map((row) => row.id);
  const selection = useRowSelection(pageIds);
  const selectedRows = rows.filter((row) => selection.selected.has(row.id));

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await getPaymentsStats(search || undefined);
        if (active) {
          setStats(next);
        }
      } catch {
        // Stats are supplementary; the table renders without them.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [search, resource.data]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listProperties({ page: 1, perPage: 100 });
        setPropertyOptions(res.items.map((item) => ({ value: String(item.id), label: item.name })));
      } catch {
        // Property options are optional; the chip stays empty.
      }
    };
    void load();
  }, []);

  const statusLabel = (value: string): string =>
    t(`payment_status_${value.toLowerCase()}` as 'payment_status_paid');
  const methodLabel = (value: string): string =>
    t(`method_${value.toLowerCase()}` as 'method_cash');

  const overdueSubline = (payment: ManagementPaymentOutput): string => {
    if (payment.status.toLowerCase() === 'paid') {
      return t('payment_paid_on', { date: shortDate(payment.payment_date) });
    }
    const days = daysBetween(payment.due_date);
    if (days !== null && days < 0) {
      return t('overdue_by_days', { count: -days });
    }
    return t('due_in_days', { count: days ?? 0 });
  };

  const runMarkPaid = (ids: number[], onDone?: () => void, method?: string) => {
    onDone?.();
    void bulkMarkPaymentsPaid(ids, method)
      .then(() => {
        toast.success(t('bulk_mark_paid_toast', { count: ids.length }));
        resource.refetch();
      })
      .catch(() => {
        resource.refetch();
        toast.error(t('bulk_mark_paid_failed'));
      });
  };

  const runReminder = (ids: number[]) => {
    void bulkRemindPayments(ids).then((res) =>
      toast.success(t('reminder_sent', { count: res.sent })),
    );
  };

  const savedViews: SavedView[] = [
    { id: 'overdue', label: t('payment_view_overdue'), count: stats?.counts.overdue },
    { id: 'due_month', label: t('payment_view_due_month'), count: stats?.counts.due_month },
    { id: 'paid', label: t('payment_view_paid'), count: stats?.counts.paid_month },
    { id: 'all', label: t('view_all'), count: stats?.counts.all },
  ];

  // IIFE-wrapped so the nullish fallbacks don't count toward page complexity.
  const chipFilters: ChipFilter[] = ((): ChipFilter[] => [
    {
      id: 'method',
      label: t('col_method'),
      anyLabel: t('any_method'),
      value: (resource.query.method as string | undefined) ?? null,
      options: METHOD_VALUES.map((value) => ({ value, label: methodLabel(value) })),
      onChange: (value) => resource.patchQuery({ method: value ?? undefined }),
    },
    {
      id: 'property',
      label: t('col_property'),
      anyLabel: t('any_property'),
      value: (resource.query.property_id as string | undefined) ?? null,
      options: propertyOptions,
      onChange: (value) => resource.patchQuery({ property_id: value ?? undefined }),
    },
  ])();

  const dueRangeChip = (
    <DateRangeChip
      label={t('due_date_range')}
      value={{
        from: resource.query.due_from as string | undefined,
        to: resource.query.due_to as string | undefined,
      }}
      onChange={(range) =>
        resource.patchQuery({ due_from: range.from, due_to: range.to, overdue: undefined })
      }
      clearLabel={t('clear')}
    />
  );

  const activeFilterCount = [
    resource.query.method,
    resource.query.property_id,
    resource.query.due_from,
  ].filter(Boolean).length;
  const hasQuery = Boolean(search) || activeFilterCount > 0 || view !== 'overdue';

  const clearAll = () => {
    resource.setQuery({ search: search || undefined, order: 'due_date', overdue: 'true' });
  };

  const columns: WorkbenchColumn<ManagementPaymentOutput>[] = [
    {
      id: 'tenant',
      header: t('col_tenant'),
      cell: (row) => (
        <EntityCell
          thumbnail={<AvatarInitials name={row.tenant_name} size={40} />}
          name={row.tenant_name}
          secondary={row.property_name ?? ''}
        />
      ),
    },
    {
      id: 'due',
      header: t('col_due'),
      width: 150,
      cell: (row) => (
        <DueDateCell
          dueDate={row.due_date}
          isPaid={row.status.toLowerCase() === 'paid'}
          overdueLabel={(days) => t('overdue_by_days', { count: days })}
          dueInLabel={(days) => t('due_in_days', { count: days })}
          paidLabel={t('payment_paid_on', { date: shortDate(row.payment_date) })}
        />
      ),
    },
    {
      id: 'amount',
      header: t('col_amount'),
      width: 110,
      align: 'right',
      cell: (row) => <NumericCell>{formatCurrency(row.amount, row.currency)}</NumericCell>,
    },
    {
      id: 'method',
      header: t('col_method'),
      width: 130,
      secondary: true,
      cell: (row) => <span className="text-muted-foreground">{methodLabel(row.method)}</span>,
    },
    {
      id: 'status',
      header: t('col_status'),
      width: 130,
      cell: (row) => (
        <StatusPill tone={paymentStatusTone(row.status)} label={statusLabel(row.status)} />
      ),
    },
  ];

  const kpiItems: KpiItem[] | null = ((): KpiItem[] | null => {
    if (!stats) {
      return null;
    }
    return [
      {
        id: 'collected',
        label: t('payment_kpi_collected'),
        value: formatCurrency(stats.collected_month, 'USD'),
        icon: CircleDollarSign,
        sublabel: t('payment_kpi_collected_sub'),
      },
      {
        id: 'outstanding',
        label: t('payment_kpi_outstanding'),
        value: formatCurrency(stats.outstanding, 'USD'),
        icon: Wallet,
      },
      {
        id: 'overdue',
        label: t('payment_kpi_overdue'),
        value: formatCurrency(stats.overdue_total, 'USD'),
        icon: AlertCircle,
        tone: 'danger',
        onClick: () => resource.patchQuery(queryForView('overdue')),
        active: view === 'overdue',
      },
      {
        id: 'payouts_due',
        label: t('payment_kpi_payouts_due'),
        value: formatCurrency(stats.payouts_due, 'USD'),
        icon: HandCoins,
      },
    ];
  })();

  const rowActions = (row: ManagementPaymentOutput) => (
    <RowActions
      onOpen={() => setSelected(row)}
      quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      labels={{ open: t('row_open'), edit: t('mark_paid'), more: t('row_more') }}
      onEdit={/paid|cancelled/iu.test(row.status) ? undefined : () => runMarkPaid([row.id])}
      menuItems={[
        { id: 'open', label: t('row_open'), onSelect: () => setSelected(row) },
        {
          id: 'mark',
          label: t('mark_paid'),
          disabled: /paid|cancelled/iu.test(row.status),
          onSelect: () => runMarkPaid([row.id]),
        },
        {
          id: 'remind',
          label: t('send_reminder'),
          disabled: /paid|cancelled/iu.test(row.status),
          onSelect: () => runReminder([row.id]),
        },
      ]}
    />
  );

  const exportCounts = {
    filtered: resource.total,
    all: stats?.counts.all ?? resource.total,
    selected: selection.count,
  };

  const onExport = async (scope: ExportScope, format: 'xlsx' | 'csv' | 'pdf') => {
    let data = rows;
    if (scope === 'selected') {
      data = selectedRows;
    } else {
      const params =
        scope === 'all' ? { page: 1, perPage: 500 } : queryToParams(1, { ...resource.query });
      const res = await listPayments({ ...params, perPage: 500 });
      data = res.items;
    }
    await downloadTable(buildPaymentExportRows(data), format, 'payments', t('payments'));
  };

  // Wrapped in an IIFE so the render-state branches count toward this arrow's
  // complexity, not the page component's.
  const body: React.ReactNode = ((): React.ReactNode => {
    if (resource.error) {
      return (
        <ErrorState
          title={t('error_title')}
          message={t('payment_error')}
          retryLabel={t('retry')}
          onRetry={() => resource.refetch()}
        />
      );
    }
    if (resource.isLoading) {
      return <WorkbenchTableSkeleton />;
    }
    if (rows.length === 0) {
      return hasQuery ? (
        <FilteredEmptyState
          title={t('no_matches')}
          description={t('no_matches_desc')}
          clearLabel={t('clear_filters')}
          onClear={() => clearAll()}
        />
      ) : (
        <EmptyState
          icon={CircleDollarSign}
          title={t('payment_empty')}
          description={t('payment_empty_desc')}
          action={
            <Button className="h-9 gap-2 rounded-[10px]" onClick={() => setRecordOpen(true)}>
              <Plus className="size-4" />
              {t('record_payment')}
            </Button>
          }
        />
      );
    }
    return (
      <WorkbenchTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isSelected={selection.isSelected}
        onToggleRow={(...args) => selection.toggle(...args)}
        allChecked={selection.allChecked}
        someChecked={selection.someChecked}
        onToggleAll={(...args) => selection.toggleAll(...args)}
        onOpenRecord={setSelected}
        activeId={selected?.id ?? null}
        dense={Boolean(selected)}
        rowActions={rowActions}
        labels={{ selectAll: t('select_all'), selectRow: t('select_row') }}
      />
    );
  })();

  const showPagination = !resource.isLoading && !resource.error && rows.length > 0;

  const header = (
    <ManagementPageHeader
      title={t('payments')}
      subtitle={t('payment_subtitle', {
        month: stats ? monthLabel(stats.month) : '',
        count: stats?.counts.all ?? resource.total,
      })}
      showBell={false}
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-[10px] px-4 shadow-none"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-[17px]" />
            {t('export')}
          </Button>
          <Button
            className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
            onClick={() => setRecordOpen(true)}
          >
            <Plus className="size-[17px]" />
            {t('record_payment')}
          </Button>
        </div>
      }
    />
  );

  // Mobile selection helpers.
  const mobileRows = rows.filter((row) => {
    if (mobileTab === 'overdue') {
      const days = daysBetween(row.due_date);
      return row.status.toLowerCase() !== 'paid' && days !== null && days < 0;
    }
    if (mobileTab === 'paid') {
      return row.status.toLowerCase() === 'paid';
    }
    return row.status.toLowerCase() !== 'paid';
  });

  return (
    <>
      {isMobile ? (
        <PaymentsMobileView
          header={header}
          stats={stats}
          payments={mobileRows}
          mobileTab={mobileTab}
          onTabChange={setMobileTab}
          selecting={selecting}
          onToggleSelecting={() => {
            setSelecting((prev) => !prev);
            selection.clear();
          }}
          onCancelSelection={() => {
            setSelecting(false);
            selection.clear();
          }}
          isSelected={selection.isSelected}
          selectionCount={selection.count}
          selectedRows={selectedRows}
          onToggle={(id) => selection.toggle(id, !selection.isSelected(id), 0, false)}
          onEnterSelection={(id) => {
            setSelecting(true);
            selection.toggle(id, true, 0, false);
          }}
          onOpen={setSelected}
          onPaid={(payment) => runMarkPaid([payment.id])}
          onRemind={(payment) => runReminder([payment.id])}
          onBulkRemind={() => {
            runReminder(selectedRows.map((row) => row.id));
            setSelecting(false);
            selection.clear();
          }}
          onConfirm={(method) =>
            runMarkPaid(
              selectedRows.map((row) => row.id),
              () => {
                setSelecting(false);
                selection.clear();
              },
              method,
            )
          }
          overdueSubline={overdueSubline}
          methodLabel={methodLabel}
          markSheetOpen={markSheetOpen}
          setMarkSheetOpen={setMarkSheetOpen}
          onOpenMarkSheet={() => setMarkSheetOpen(true)}
        />
      ) : (
        <WorkbenchShell
          header={header}
          kpi={<WorkbenchKpiGrid items={kpiItems} compact={Boolean(selected)} />}
          tabs={
            <SavedViewTabs
              views={savedViews}
              active={view}
              onChange={(next) =>
                resource.patchQuery({ ...queryForView(next), search: search || undefined })
              }
            />
          }
          toolbar={
            <WorkbenchToolbar
              search={{
                value: search,
                onChange: (value) => resource.patchQuery({ search: value || undefined }),
              }}
              filters={chipFilters}
              extra={dueRangeChip}
              extraPanel={dueRangeChip}
              sort={{
                value: (resource.query.order as string | undefined) ?? 'due_date',
                onChange: (value) => resource.patchQuery({ order: value }),
                options: [
                  { value: 'due_date', label: t('payment_sort_overdue') },
                  { value: '-due_date', label: t('payment_sort_due_latest') },
                  { value: '-payment_date', label: t('sort_newest') },
                  { value: '-amount', label: t('sort_amount_high') },
                  { value: 'amount', label: t('sort_amount_low') },
                ],
              }}
              activeFilterCount={activeFilterCount}
              onClearAll={clearAll}
              labels={{
                filters: t('filters'),
                clearAll: t('clear_all'),
                filtersTitle: t('filters_title'),
                done: t('done'),
                columns: t('columns'),
                sort: t('sort'),
                search: {
                  placeholder: t('payment_search'),
                  aria: t('payment_search_aria'),
                  clear: t('search_clear'),
                },
              }}
            />
          }
          pagination={
            showPagination ? (
              <WorkbenchPagination
                page={resource.page}
                totalPages={resource.totalPages}
                onPageChange={(p) => resource.setPage(p)}
                summary={t('payment_pagination', {
                  from: (resource.page - 1) * 20 + 1,
                  to: (resource.page - 1) * 20 + rows.length,
                  total: resource.total,
                })}
                labels={{ previous: t('previous'), next: t('next'), perPage: t('per_page') }}
              />
            ) : undefined
          }
          panel={
            <PaymentRecordPanel
              payment={selected}
              open={Boolean(selected)}
              onClose={() => setSelected(null)}
              onMarkPaid={() => selected && runMarkPaid([selected.id], () => setSelected(null))}
              onRemind={() => selected && runReminder([selected.id])}
              statusLabel={statusLabel}
              methodLabel={methodLabel}
            />
          }
          bulkBar={
            <BulkSelectionBar
              open={selection.count > 0}
              countLabel={t('bulk_selected_sum', {
                count: selection.count,
                sum: formatCurrency(
                  selectedRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0),
                  'USD',
                ),
              })}
              onClear={() => selection.clear()}
              clearLabel={t('bulk_clear')}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => setBulkOpen(true)}
                    className="flex h-9 items-center rounded-full px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:outline-none"
                  >
                    {t('mark_as_paid')}
                  </button>
                  <button
                    type="button"
                    onClick={() => runReminder(selectedRows.map((row) => row.id))}
                    className="flex h-9 items-center rounded-full px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:outline-none"
                  >
                    {t('send_reminder')}
                  </button>
                </>
              }
            />
          }
        >
          {body}
        </WorkbenchShell>
      )}

      <RecordPaymentDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        onSuccess={() => resource.refetch()}
      />
      <BulkMarkPaidDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        payments={selectedRows}
        overdueSubline={overdueSubline}
        onConfirm={() =>
          runMarkPaid(
            selectedRows.map((row) => row.id),
            () => selection.clear(),
          )
        }
      />
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={t('export_payments')}
        currentViewLabel={t('export_current_view', {
          view: savedViews.find((v) => v.id === view)?.label ?? '',
          count: resource.total,
        })}
        counts={exportCounts}
        onExport={onExport}
        labels={{
          scopeTitle: t('export_scope'),
          filtered: (count: number) => t('export_filtered', { count }),
          all: (count: number) => t('export_all', { count }),
          selected: (count: number) => t('export_selected', { count }),
          formatTitle: t('export_format'),
          footnote: t('export_footnote'),
          cancel: t('cancel'),
          submit: (count: number) => t('export_submit', { count }),
          failed: t('export_failed'),
        }}
      />
    </>
  );
}

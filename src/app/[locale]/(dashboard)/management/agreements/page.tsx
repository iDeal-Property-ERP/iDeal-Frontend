'use client';

import { CalendarClock, Download, Percent, Plus, ShieldCheck, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { RowActions } from '@/components/management/columns/RowActions';
import { agreementStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import {
  NewAgreementDialog,
  RenewAgreementDialog,
  TerminateAgreementDialog,
} from '@/components/management/dialogs/AgreementDialogs';
import { KpiCard } from '@/components/management/KpiStrip';
import type { KpiItem } from '@/components/management/KpiStrip';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import {
  AgreementRecordPanel,
  OwnerCell,
} from '@/components/management/record-panel/AgreementRecordPanel';
import { EmptyState } from '@/components/management/states/EmptyState';
import { ErrorState } from '@/components/management/states/ErrorState';
import { FilteredEmptyState } from '@/components/management/states/FilteredEmptyState';
import { BulkSelectionBar } from '@/components/management/workbench/BulkSelectionBar';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { WorkbenchPagination } from '@/components/management/workbench/WorkbenchPagination';
import { WorkbenchShell } from '@/components/management/workbench/WorkbenchShell';
import { WorkbenchTable } from '@/components/management/workbench/WorkbenchTable';
import type { WorkbenchColumn } from '@/components/management/workbench/WorkbenchTable';
import { WorkbenchTableSkeleton } from '@/components/management/workbench/WorkbenchTableSkeleton';
import { WorkbenchToolbar } from '@/components/management/workbench/WorkbenchToolbar';
import type { ChipFilter } from '@/components/management/workbench/WorkbenchToolbar';
import { Button } from '@/components/ui/button';
import { usePaginatedResource } from '@/hooks/management/usePaginatedResource';
import { useRowSelection } from '@/hooks/management/useRowSelection';
import {
  AGREEMENT_EXPIRING_WINDOW,
  exportAgreementsCsv,
  getAgreementKpis,
  getAgreementStatusCounts,
  listAgreements,
} from '@/libs/management/agreementsAdapter';
import type { AgreementKpis, AgreementStatusCounts } from '@/libs/management/agreementsAdapter';
import type { ManagementAgreementOutput } from '@/types/management';

const SAVED_VIEW_DEFS = [
  { id: 'active', labelKey: 'agr_view_active', countKey: 'active' },
  { id: 'expiring', labelKey: 'agr_view_expiring', countKey: 'expiring' },
  { id: 'expired', labelKey: 'agr_view_expired', countKey: 'expired' },
  { id: 'terminated', labelKey: 'agr_view_terminated', countKey: 'terminated' },
] as const satisfies { id: string; labelKey: string; countKey: keyof AgreementStatusCounts }[];

/**
 * Maps a saved-view id to the backend query it applies.
 * @param view - The saved-view id.
 * @returns The status / ends-within query for that view.
 */
function queryForView(view: string): { status?: string; ends_within?: number } {
  if (view === 'expiring') {
    return { status: 'active', ends_within: AGREEMENT_EXPIRING_WINDOW };
  }
  if (view === 'all') {
    return {};
  }
  return { status: view };
}

/**
 * Reverses a query back to a saved-view id.
 * @param status - The active status filter, if any.
 * @param endsWithin - The active ends-within window, if any.
 * @returns The matching saved-view id.
 */
function viewFromQuery(status: string | undefined, endsWithin: number | undefined): string {
  if (status === 'active' && endsWithin) {
    return 'expiring';
  }
  if (!status) {
    return 'all';
  }
  return status;
}

/**
 * Short date label ("Aug 31, 2026").
 * @param iso - The ISO date string.
 * @returns The formatted date, or an empty string when unparseable.
 */
function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Whole days from today until an ISO date.
 * @param iso - The ISO date string.
 * @returns The day count (negative if past), or null when unparseable.
 */
function daysUntil(iso: string): number | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Whole-month term between two ISO dates.
 * @param start - The start ISO date.
 * @param end - The end ISO date.
 * @returns The term length in whole months (0 when unparseable).
 */
function termMonths(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return 0;
  }
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
}

/**
 * Whole months from today until an ISO date.
 * @param iso - The ISO date string.
 * @returns The month count (negative if past), or null when unparseable.
 */
function monthsUntil(iso: string): number | null {
  const days = daysUntil(iso);
  if (days === null) {
    return null;
  }
  return Math.round(days / 30.44);
}

/**
 * The Owner Agreements Workbench — the trust-management contract list: KPI strip,
 * saved-view tabs, filter toolbar, a selectable table with a floating bulk bar,
 * pagination, an in-flow agreement record panel, and the create / renew /
 * terminate dialogs. Reuses the Milestone-2 workbench foundation; wired to the
 * live backend (`/management/owner-agreements/`).
 * @returns The agreements workbench page.
 */
export default function ManagementAgreementsPage() {
  const t = useTranslations('Management');

  const resource = usePaginatedResource<ManagementAgreementOutput>(
    async ({ page, query }) =>
      await listAgreements({
        page,
        search: query.search as string | undefined,
        status: query.status as string | undefined,
        endsWithin: query.ends_within as number | undefined,
      }),
    { initialQuery: queryForView('active') },
  );

  const search = (resource.query.search as string | undefined) ?? '';
  const status = resource.query.status as string | undefined;
  const endsWithin = resource.query.ends_within as number | undefined;
  const view = viewFromQuery(status, endsWithin);

  const [sort, setSort] = useState('ends_soonest');
  const [commissionFilter, setCommissionFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<ManagementAgreementOutput | null>(null);
  const [counts, setCounts] = useState<AgreementStatusCounts | null>(null);
  const [kpis, setKpis] = useState<AgreementKpis | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<ManagementAgreementOutput | null>(null);
  const [terminateTarget, setTerminateTarget] = useState<ManagementAgreementOutput | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const nextCounts = await getAgreementStatusCounts(search || undefined);
        if (!active) {
          return;
        }
        setCounts(nextCounts);
        const nextKpis = await getAgreementKpis(nextCounts);
        if (active) {
          setKpis(nextKpis);
        }
      } catch {
        // KPIs are supplementary; the table renders without them.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [search]);

  const statusLabel = (value: string): string => {
    const s = value.toLowerCase();
    if (s === 'active') {
      return t('agr_status_active');
    }
    if (s === 'expired') {
      return t('agr_status_expired');
    }
    if (s === 'terminated') {
      return t('agr_status_terminated');
    }
    return value.replaceAll('_', ' ');
  };

  // Client-side commission filter + sort over the loaded page (server fixes ordering).
  const COMMISSION_BUCKETS: Record<string, (rate: number) => boolean> = {
    low: (rate) => rate < 15,
    mid: (rate) => rate >= 15 && rate <= 20,
    high: (rate) => rate > 20,
  };
  const filtered = commissionFilter
    ? resource.data.filter((row) =>
        (COMMISSION_BUCKETS[commissionFilter] ?? (() => true))(
          Number.parseFloat(row.commission_rate),
        ),
      )
    : resource.data;
  const rows = filtered.toSorted((a, b) => {
    if (sort === 'ends_soonest') {
      return a.end_date.localeCompare(b.end_date);
    }
    if (sort === 'ends_latest') {
      return b.end_date.localeCompare(a.end_date);
    }
    if (sort === 'commission_high') {
      return Number.parseFloat(b.commission_rate) - Number.parseFloat(a.commission_rate);
    }
    if (sort === 'commission_low') {
      return Number.parseFloat(a.commission_rate) - Number.parseFloat(b.commission_rate);
    }
    return b.created_at.localeCompare(a.created_at);
  });

  const pageIds = rows.map((row) => row.id);
  const selection = useRowSelection(pageIds);

  const savedViews: SavedView[] = SAVED_VIEW_DEFS.map((def) => ({
    id: def.id,
    label: t(def.labelKey),
    count: counts ? counts[def.countKey] : undefined,
  }));

  const chipFilters: ChipFilter[] = [
    {
      id: 'ends',
      label: t('agr_filter_ends'),
      anyLabel: t('agr_filter_any_ends'),
      value: endsWithin ? String(endsWithin) : null,
      options: [
        { value: '30', label: t('agr_ends_30') },
        { value: '60', label: t('agr_ends_60') },
        { value: '90', label: t('agr_ends_90') },
      ],
      onChange: (value) => resource.patchQuery({ ends_within: value ? Number(value) : undefined }),
    },
    {
      id: 'commission',
      label: t('agr_filter_commission'),
      anyLabel: t('agr_filter_any_commission'),
      value: commissionFilter,
      options: [
        { value: 'low', label: t('agr_commission_low') },
        { value: 'mid', label: t('agr_commission_mid') },
        { value: 'high', label: t('agr_commission_high') },
      ],
      onChange: setCommissionFilter,
    },
  ];

  const activeFilterCount = [endsWithin, commissionFilter].filter(Boolean).length;
  const hasQuery = [search, commissionFilter].some(Boolean) || view !== 'active';

  const clearAll = () => {
    resource.setQuery({ search: search || undefined });
    setCommissionFilter(null);
  };

  const columns: WorkbenchColumn<ManagementAgreementOutput>[] = [
    {
      id: 'agreement',
      header: t('agr_col_agreement'),
      cell: (row) => (
        <EntityCell
          thumbnail={
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground">
              <ShieldCheck className="size-[18px]" />
            </span>
          }
          name={row.agreement_number}
          secondary={t('term_months', { count: termMonths(row.start_date, row.end_date) })}
        />
      ),
    },
    {
      id: 'owner',
      header: t('agr_col_owner'),
      width: 170,
      cell: (row) => <OwnerCell name={row.owner_name} />,
    },
    {
      id: 'property',
      header: t('col_property'),
      width: 170,
      secondary: true,
      cell: (row) => <span className="truncate text-muted-foreground">{row.property_name}</span>,
    },
    {
      id: 'commission',
      header: t('agr_col_commission'),
      width: 120,
      align: 'right',
      cell: (row) => (
        <span className="text-foreground tabular-nums">
          {t('agr_commission_value', { rate: row.commission_rate })}
        </span>
      ),
    },
    {
      id: 'ends',
      header: t('col_ends'),
      width: 150,
      cell: (row) => {
        const days = daysUntil(row.end_date);
        const months = monthsUntil(row.end_date);
        const soon = /active/iu.test(row.status) && days !== null && days >= 0 && days <= 90;
        return (
          <div className="flex flex-col">
            <span className="text-foreground">{shortDate(row.end_date)}</span>
            {days !== null ? (
              <span className={soon ? 'text-xs text-danger' : 'text-xs text-muted-foreground'}>
                {days >= 0
                  ? t('agr_ends_in_months', { count: months ?? 0 })
                  : t('agr_ends_expired')}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: t('col_status'),
      width: 140,
      cell: (row) => (
        <StatusPill tone={agreementStatusTone(row.status)} label={statusLabel(row.status)} />
      ),
    },
  ];

  const kpiItems: KpiItem[] | null = kpis
    ? [
        { id: 'active', label: t('agr_kpi_active'), value: String(kpis.active), icon: ShieldCheck },
        {
          id: 'expiring',
          label: t('agr_kpi_expiring'),
          value: String(kpis.expiringSoon),
          icon: CalendarClock,
          sublabel: t('agr_kpi_expiring_sub'),
          onClick: () => resource.patchQuery(queryForView('expiring')),
          active: view === 'expiring',
        },
        {
          id: 'commission',
          label: t('agr_kpi_avg_commission'),
          value: t('agr_commission_value', { rate: String(kpis.avgCommission) }),
          icon: Percent,
        },
        {
          id: 'guaranteed',
          label: t('agr_kpi_guaranteed'),
          // BACKEND-GAP: no guaranteed monthly amount on the agreement output.
          value: kpis.guaranteedPerMo ? `$${kpis.guaranteedPerMo.toLocaleString('en-US')}` : '—',
          icon: Wallet,
        },
      ]
    : null;

  const rowActions = (row: ManagementAgreementOutput) => (
    <RowActions
      onOpen={() => setSelected(row)}
      quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      labels={{ open: t('row_open'), edit: t('agr_renew'), more: t('row_more') }}
      onEdit={/active/iu.test(row.status) ? () => setRenewTarget(row) : undefined}
      menuItems={[
        { id: 'open', label: t('row_open'), onSelect: () => setSelected(row) },
        { id: 'renew', label: t('agr_renew'), onSelect: () => setRenewTarget(row) },
        {
          id: 'terminate',
          label: t('agr_terminate'),
          variant: 'destructive',
          separatorBefore: true,
          onSelect: () => setTerminateTarget(row),
        },
      ]}
    />
  );

  let body: React.ReactNode;
  if (resource.error) {
    body = (
      <ErrorState
        title={t('error_title')}
        message={t('agr_error')}
        retryLabel={t('retry')}
        onRetry={resource.refetch}
      />
    );
  } else if (resource.isLoading) {
    body = <WorkbenchTableSkeleton />;
  } else if (rows.length === 0) {
    body = hasQuery ? (
      <FilteredEmptyState
        title={t('no_matches')}
        description={t('no_matches_desc')}
        clearLabel={t('clear_filters')}
        onClear={clearAll}
      />
    ) : (
      <EmptyState
        icon={ShieldCheck}
        title={t('agr_empty')}
        description={t('agr_empty_desc')}
        action={
          <Button className="h-9 gap-2 rounded-[10px]" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            {t('new_agreement')}
          </Button>
        }
      />
    );
  } else {
    body = (
      <WorkbenchTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isSelected={selection.isSelected}
        onToggleRow={selection.toggle}
        allChecked={selection.allChecked}
        someChecked={selection.someChecked}
        onToggleAll={selection.toggleAll}
        onOpenRecord={setSelected}
        activeId={selected?.id ?? null}
        dense={Boolean(selected)}
        rowActions={rowActions}
        labels={{ selectAll: t('select_all'), selectRow: t('select_row') }}
      />
    );
  }

  const showPagination = !resource.isLoading && !resource.error && rows.length > 0;

  return (
    <>
      <WorkbenchShell
        header={
          <ManagementPageHeader
            title={t('agreements')}
            subtitle={t('agr_subtitle', { active: counts?.active ?? resource.total })}
            showBell={false}
            actions={
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-[10px] px-4 shadow-none"
                  onClick={() => exportAgreementsCsv(rows, 'owner-agreements.csv')}
                >
                  <Download className="size-[17px]" />
                  {t('export')}
                </Button>
                <Button
                  className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
                  onClick={() => setNewOpen(true)}
                >
                  <Plus className="size-[17px]" />
                  {t('new_agreement')}
                </Button>
              </div>
            }
          />
        }
        kpi={
          <div
            className={
              selected ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-2 gap-4 md:grid-cols-4'
            }
          >
            {kpiItems
              ? kpiItems.map((item) => <KpiCard key={item.id} {...item} />)
              : Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={`kpi-skeleton-${index}`}
                    className="h-[140px] rounded-[16px] bg-muted/40"
                  />
                ))}
          </div>
        }
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
            sort={{
              value: sort,
              onChange: setSort,
              options: [
                { value: 'ends_soonest', label: t('agr_sort_ends_soonest') },
                { value: 'ends_latest', label: t('agr_sort_ends_latest') },
                { value: 'commission_high', label: t('agr_sort_commission_high') },
                { value: 'commission_low', label: t('agr_sort_commission_low') },
                { value: 'newest', label: t('sort_newest') },
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
                placeholder: t('agr_search'),
                aria: t('agr_search_aria'),
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
              onPageChange={resource.setPage}
              summary={t('agr_pagination', {
                from: (resource.page - 1) * 20 + 1,
                to: (resource.page - 1) * 20 + rows.length,
                total: resource.total,
              })}
              labels={{ previous: t('previous'), next: t('next'), perPage: t('per_page') }}
            />
          ) : undefined
        }
        panel={
          <AgreementRecordPanel
            agreement={selected}
            open={Boolean(selected)}
            onClose={() => setSelected(null)}
            onRenew={() => selected && setRenewTarget(selected)}
            onTerminate={() => selected && setTerminateTarget(selected)}
            statusLabel={statusLabel}
          />
        }
        bulkBar={
          <BulkSelectionBar
            open={selection.count > 0}
            countLabel={t('bulk_selected', { count: selection.count })}
            onClear={selection.clear}
            clearLabel={t('bulk_clear')}
            actions={
              <button
                type="button"
                onClick={() => {
                  const chosen = rows.filter((row) => selection.selected.has(row.id));
                  exportAgreementsCsv(chosen, 'owner-agreements.csv');
                }}
                className="flex h-9 items-center rounded-full px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:outline-none"
              >
                {t('bulk_export')}
              </button>
            }
          />
        }
      >
        {body}
      </WorkbenchShell>

      <NewAgreementDialog open={newOpen} onOpenChange={setNewOpen} onSuccess={resource.refetch} />
      <RenewAgreementDialog
        agreement={renewTarget}
        open={Boolean(renewTarget)}
        onOpenChange={(open) => !open && setRenewTarget(null)}
        onSuccess={resource.refetch}
      />
      <TerminateAgreementDialog
        agreement={terminateTarget}
        open={Boolean(terminateTarget)}
        onOpenChange={(open) => !open && setTerminateTarget(null)}
        onSuccess={resource.refetch}
      />
    </>
  );
}

'use client';

import { CalendarClock, CalendarDays, Download, FileText, Plus, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { NumericCell } from '@/components/management/columns/NumericCell';
import { RowActions } from '@/components/management/columns/RowActions';
import { leaseStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import {
  NewLeaseDialog,
  RenewLeaseDialog,
  TerminateLeaseDialog,
} from '@/components/management/dialogs/LeaseDialogs';
import { formatMoney } from '@/components/management/format';
import { KpiCard } from '@/components/management/KpiStrip';
import type { KpiItem } from '@/components/management/KpiStrip';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import {
  LeaseRecordPanel,
  TenantCell,
} from '@/components/management/record-panel/LeaseRecordPanel';
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
  exportLeasesCsv,
  getLeaseKpis,
  getLeaseStatusCounts,
  LEASE_EXPIRING_WINDOW,
  listLeases,
} from '@/libs/management/leasesAdapter';
import type { LeaseKpis, LeaseStatusCounts } from '@/libs/management/leasesAdapter';
import type { ManagementLeaseOutput } from '@/types/management';

const SAVED_VIEW_DEFS = [
  { id: 'expiring', labelKey: 'lease_view_expiring', countKey: 'expiring' },
  { id: 'active', labelKey: 'lease_view_active', countKey: 'active' },
  { id: 'renewed', labelKey: 'lease_view_renewed', countKey: 'renewed' },
  { id: 'terminated', labelKey: 'lease_view_terminated', countKey: 'terminated' },
  { id: 'all', labelKey: 'view_all', countKey: 'all' },
] as const satisfies { id: string; labelKey: string; countKey: keyof LeaseStatusCounts }[];

/**
 * Maps a saved-view id to the backend query it applies.
 * @param view - The saved-view id.
 * @returns The status / ends-within query for that view.
 */
function queryForView(view: string): { status?: string; ends_within?: number } {
  if (view === 'expiring') {
    return { status: 'active', ends_within: LEASE_EXPIRING_WINDOW };
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

/** Client-side term-bucket predicates (server fixes base ordering). */
const TERM_BUCKETS: Record<string, (m: number) => boolean> = {
  short: (m) => m <= 6,
  year: (m) => m > 6 && m <= 12,
  long: (m) => m > 12,
};

/**
 * Applies the term-bucket filter and the active sort to the loaded page.
 * @param data - The rows for the current page.
 * @param termFilter - The active term-bucket id, or null for any term.
 * @param sort - The active sort id.
 * @returns The filtered, sorted rows.
 */
function filterAndSortLeases(
  data: ManagementLeaseOutput[],
  termFilter: string | null,
  sort: string,
): ManagementLeaseOutput[] {
  const filtered = termFilter
    ? data.filter((row) =>
        (TERM_BUCKETS[termFilter] ?? (() => true))(termMonths(row.start_date, row.end_date)),
      )
    : data;
  return filtered.toSorted((a, b) => {
    if (sort === 'ends_soonest') {
      return a.end_date.localeCompare(b.end_date);
    }
    if (sort === 'ends_latest') {
      return b.end_date.localeCompare(a.end_date);
    }
    if (sort === 'rent_high') {
      return Number.parseFloat(b.monthly_rent) - Number.parseFloat(a.monthly_rent);
    }
    if (sort === 'rent_low') {
      return Number.parseFloat(a.monthly_rent) - Number.parseFloat(b.monthly_rent);
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

/**
 * The Leases Workbench — the expiring-first lease list: KPI strip, saved-view
 * tabs, filter toolbar, a selectable table with a floating bulk bar, pagination,
 * an in-flow lease record panel, and the create / renew / terminate dialogs.
 * Reuses the Milestone-2 workbench foundation; wired to the live backend.
 * @returns The leases workbench page.
 */
export default function ManagementLeasesPage() {
  const t = useTranslations('Management');

  const resource = usePaginatedResource<ManagementLeaseOutput>(
    async ({ page, query }) =>
      await listLeases({
        page,
        search: query.search as string | undefined,
        status: query.status as string | undefined,
        endsWithin: query.ends_within as number | undefined,
      }),
    { initialQuery: queryForView('expiring') },
  );

  const search = (resource.query.search as string | undefined) ?? '';
  const status = resource.query.status as string | undefined;
  const endsWithin = resource.query.ends_within as number | undefined;
  const view = viewFromQuery(status, endsWithin);

  const [sort, setSort] = useState('ends_soonest');
  const [termFilter, setTermFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<ManagementLeaseOutput | null>(null);
  const [counts, setCounts] = useState<LeaseStatusCounts | null>(null);
  const [kpis, setKpis] = useState<LeaseKpis | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<ManagementLeaseOutput | null>(null);
  const [terminateTarget, setTerminateTarget] = useState<ManagementLeaseOutput | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const nextCounts = await getLeaseStatusCounts(search || undefined);
        if (!active) {
          return;
        }
        setCounts(nextCounts);
        const nextKpis = await getLeaseKpis(nextCounts);
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
      return t('lease_status_active');
    }
    if (s === 'renewed') {
      return t('lease_status_renewed');
    }
    if (s === 'terminated') {
      return t('lease_status_terminated');
    }
    if (s === 'expired') {
      return t('lease_status_expired');
    }
    return value.replaceAll('_', ' ');
  };

  // Client-side term filter + sort over the loaded page (server fixes ordering).
  const rows = filterAndSortLeases(resource.data, termFilter, sort);

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
      label: t('lease_filter_ends'),
      anyLabel: t('lease_filter_any_ends'),
      value: endsWithin ? String(endsWithin) : null,
      options: [
        { value: '30', label: t('lease_ends_30') },
        { value: '60', label: t('lease_ends_60') },
        { value: '90', label: t('lease_ends_90') },
      ],
      onChange: (value) => resource.patchQuery({ ends_within: value ? Number(value) : undefined }),
    },
    {
      id: 'term',
      label: t('lease_filter_term'),
      anyLabel: t('lease_filter_any_term'),
      value: termFilter,
      options: [
        { value: 'short', label: t('lease_term_short') },
        { value: 'year', label: t('lease_term_year') },
        { value: 'long', label: t('lease_term_long') },
      ],
      onChange: setTermFilter,
    },
  ];

  const activeFilterCount = [endsWithin, termFilter].filter(Boolean).length;
  const hasQuery = [search, termFilter].some(Boolean) || view !== 'expiring';

  const clearAll = () => {
    resource.setQuery({ search: search || undefined });
    setTermFilter(null);
  };

  const columns: WorkbenchColumn<ManagementLeaseOutput>[] = [
    {
      id: 'lease',
      header: t('col_lease'),
      cell: (row) => (
        <EntityCell
          thumbnail={
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground">
              <FileText className="size-[18px]" />
            </span>
          }
          name={t('lease_code', { id: row.id })}
          secondary={t('lease_signed_short', {
            date: shortDate(row.start_date),
            count: termMonths(row.start_date, row.end_date),
          })}
        />
      ),
    },
    {
      id: 'tenant',
      header: t('col_tenant'),
      width: 170,
      cell: (row) => <TenantCell name={row.tenant_name} />,
    },
    {
      id: 'property',
      header: t('col_property'),
      width: 170,
      secondary: true,
      cell: (row) => <span className="truncate text-muted-foreground">{row.property_name}</span>,
    },
    {
      id: 'ends',
      header: t('col_ends'),
      width: 150,
      cell: (row) => {
        const days = daysUntil(row.end_date);
        const soon = /active/iu.test(row.status) && days !== null && days >= 0 && days <= 60;
        return (
          <div className="flex flex-col">
            <span className="text-foreground">{shortDate(row.end_date)}</span>
            {days !== null ? (
              <span className={soon ? 'text-xs text-danger' : 'text-xs text-muted-foreground'}>
                {days >= 0
                  ? t('ends_in_days', { count: days })
                  : t('ended_days_ago', { count: -days })}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: 'rent',
      header: t('col_rent'),
      width: 110,
      align: 'right',
      cell: (row) => <NumericCell>{formatMoney(row.monthly_rent)}</NumericCell>,
    },
    {
      id: 'status',
      header: t('col_status'),
      width: 140,
      cell: (row) => (
        <StatusPill tone={leaseStatusTone(row.status)} label={statusLabel(row.status)} />
      ),
    },
  ];

  const kpiItems: KpiItem[] | null = kpis
    ? [
        {
          id: 'active',
          label: t('lease_kpi_active'),
          value: String(kpis.activeLeases),
          icon: FileText,
        },
        {
          id: 'expiring',
          label: t('lease_kpi_expiring'),
          value: String(kpis.expiringSoon),
          icon: CalendarClock,
          sublabel: t('lease_kpi_expiring_sub'),
          onClick: () => resource.patchQuery(queryForView('expiring')),
          active: view === 'expiring',
        },
        {
          id: 'term',
          label: t('lease_kpi_avg_term'),
          value: t('term_months', { count: kpis.avgTermMonths }),
          icon: CalendarDays,
        },
        {
          id: 'renewal',
          label: t('lease_kpi_renewal'),
          value: `${kpis.renewalRate}%`,
          icon: TrendingUp,
        },
      ]
    : null;

  const rowActions = (row: ManagementLeaseOutput) => (
    <RowActions
      onOpen={() => setSelected(row)}
      quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      labels={{ open: t('row_open'), edit: t('lease_renew'), more: t('row_more') }}
      onEdit={/active|renewed/iu.test(row.status) ? () => setRenewTarget(row) : undefined}
      menuItems={[
        { id: 'open', label: t('row_open'), onSelect: () => setSelected(row) },
        { id: 'renew', label: t('lease_renew'), onSelect: () => setRenewTarget(row) },
        {
          id: 'terminate',
          label: t('lease_terminate'),
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
        message={t('lease_error')}
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
        icon={FileText}
        title={t('lease_empty')}
        description={t('lease_empty_desc')}
        action={
          <Button className="h-9 gap-2 rounded-[10px]" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            {t('new_lease')}
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
            title={t('leases')}
            subtitle={t('lease_subtitle', {
              active: counts?.active ?? resource.total,
              expiring: counts?.expiring ?? 0,
            })}
            showBell={false}
            actions={
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-[10px] px-4 shadow-none"
                  onClick={() => exportLeasesCsv(rows, 'leases.csv')}
                >
                  <Download className="size-[17px]" />
                  {t('export')}
                </Button>
                <Button
                  className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
                  onClick={() => setNewOpen(true)}
                >
                  <Plus className="size-[17px]" />
                  {t('new_lease')}
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
                { value: 'ends_soonest', label: t('lease_sort_ends_soonest') },
                { value: 'ends_latest', label: t('lease_sort_ends_latest') },
                { value: 'rent_high', label: t('sort_rent_high') },
                { value: 'rent_low', label: t('sort_rent_low') },
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
                placeholder: t('lease_search'),
                aria: t('lease_search_aria'),
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
              summary={t('lease_pagination', {
                from: (resource.page - 1) * 20 + 1,
                to: (resource.page - 1) * 20 + rows.length,
                total: resource.total,
              })}
              labels={{ previous: t('previous'), next: t('next'), perPage: t('per_page') }}
            />
          ) : undefined
        }
        panel={
          <LeaseRecordPanel
            lease={selected}
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
                  exportLeasesCsv(chosen, 'leases.csv');
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

      <NewLeaseDialog open={newOpen} onOpenChange={setNewOpen} onSuccess={resource.refetch} />
      <RenewLeaseDialog
        lease={renewTarget}
        open={Boolean(renewTarget)}
        onOpenChange={(open) => !open && setRenewTarget(null)}
        onSuccess={resource.refetch}
      />
      <TerminateLeaseDialog
        lease={terminateTarget}
        open={Boolean(terminateTarget)}
        onOpenChange={(open) => !open && setTerminateTarget(null)}
        onSuccess={resource.refetch}
      />
    </>
  );
}

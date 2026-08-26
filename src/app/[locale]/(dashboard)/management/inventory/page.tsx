'use client';

import { ClipboardList, Download, Info, Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { NumericCell } from '@/components/management/columns/NumericCell';
import { RowActions } from '@/components/management/columns/RowActions';
import {
  inventoryStatusTone,
  inventoryTypeTone,
  StatusPill,
} from '@/components/management/columns/StatusPill';
import { AcknowledgeActDialog } from '@/components/management/dialogs/InventoryDialogs';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { InventoryMobileView } from '@/components/management/mobile/InventoryMobileView';
import { InventoryActRecordPanel } from '@/components/management/record-panel/InventoryActRecordPanel';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from '@/libs/I18nNavigation';
import {
  ACT_TYPES,
  exportActsCsv,
  getActStats,
  listActs,
} from '@/libs/management/inventoryAdapter';
import type { InventoryActStats } from '@/libs/management/inventoryAdapter';
import type { InventoryActListOutput } from '@/types/management';

type ActCounts = InventoryActStats['counts'];

const SAVED_VIEW_DEFS = [
  { id: 'all', labelKey: 'view_all', countKey: 'all' },
  { id: 'finalized', labelKey: 'inv_view_finalized', countKey: 'finalized' },
  { id: 'awaiting_ack', labelKey: 'inv_view_awaiting', countKey: 'awaiting_ack' },
] as const satisfies { id: string; labelKey: string; countKey: keyof ActCounts }[];

export type InventoryViewQuery = { status?: string; awaiting_ack?: string };

/**
 * Maps a saved-view id to the backend list query it applies.
 * @param view - The saved-view id.
 * @returns The list query for that view.
 */
function queryForView(view: string): InventoryViewQuery {
  if (view === 'all') {
    return {};
  }
  if (view === 'awaiting_ack') {
    return { awaiting_ack: 'true' };
  }
  return { status: view };
}

/**
 * Reverses a list query back to a saved-view id.
 * @param query - The active list query (status / awaiting_ack).
 * @returns The matching saved-view id.
 */
function viewFromQuery(query: { status?: string; awaiting_ack?: string }): string {
  if (query.awaiting_ack) {
    return 'awaiting_ack';
  }
  if (!query.status) {
    return 'all';
  }
  return query.status;
}

/**
 * Short date label ("Aug 31, 2026").
 * @param format - The locale-aware next-intl formatter.
 * @param iso - The ISO date string.
 * @returns The formatted date, or an empty string when unparseable.
 */
function shortDate(format: ReturnType<typeof useFormatter>, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return format.dateTime(date, { dateStyle: 'medium' });
}

/**
 * The Inventory-acts Workbench — the drafts-first condition-passport list: saved-view
 * tabs, a filter toolbar (client-side search + type + property), a selectable table
 * with a floating bulk bar, pagination, an in-flow act record panel, and the create /
 * finalize dialogs. There is no KPI strip on this screen. Wired to the live backend.
 * @returns The inventory-acts workbench page.
 */
export default function ManagementInventoryPage() {
  const t = useTranslations('Management');
  const format = useFormatter();
  const isMobile = useIsMobile();

  const resource = usePaginatedResource<InventoryActListOutput>(
    async ({ page, query }) =>
      await listActs({
        page,
        // SAFETY: Query parameter indexed as string
        status: query.status as string | undefined,
        awaitingAck: query.awaiting_ack === 'true',
      }),
    { initialQuery: queryForView('all') },
  );

  const view = viewFromQuery({
    // SAFETY: Query parameter indexed as string
    status: resource.query.status as string | undefined,
    // SAFETY: Query parameter indexed as string
    awaiting_ack: resource.query.awaiting_ack as string | undefined,
  });

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<InventoryActListOutput | null>(null);
  const [counts, setCounts] = useState<ActCounts | null>(null);
  const [ackTarget, setAckTarget] = useState<InventoryActListOutput | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const stats = await getActStats();
        if (active) {
          setCounts(stats.counts);
        }
      } catch {
        // Counts are supplementary; the tabs render without them.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const statusLabel = (value: string): string => {
    const s = value.toLowerCase();
    if (s === 'finalized') {
      return t('inv_status_finalized');
    }
    return value.replaceAll('_', ' ');
  };

  const typeLabel = (value: string): string => {
    const v = value.toLowerCase();
    if (v === 'handover') {
      return t('inv_type_handover');
    }
    if (v === 'return') {
      return t('inv_type_return');
    }
    if (v === 'general') {
      return t('inv_type_general');
    }
    return value.replaceAll('_', ' ');
  };

  // Client-side search + type/property filter + sort over the loaded page
  // (BACKEND-GAP: the endpoint has no search or act_type query parameter).
  const query = search.trim().toLowerCase();
  const filtered = resource.data.filter((row) => {
    if (typeFilter && row.act_type.toLowerCase() !== typeFilter) {
      return false;
    }
    if (propertyFilter && String(row.property_id) !== propertyFilter) {
      return false;
    }
    if (query) {
      const haystack = `${row.id} ${row.property_name}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
  const rows = filtered.toSorted((a, b) =>
    sort === 'oldest'
      ? a.created_at.localeCompare(b.created_at)
      : b.created_at.localeCompare(a.created_at),
  );

  const pageIds = rows.map((row) => row.id);
  const selection = useRowSelection(pageIds);

  const savedViews: SavedView[] = SAVED_VIEW_DEFS.map((def) => ({
    id: def.id,
    label: t(def.labelKey),
    count: counts ? counts[def.countKey] : undefined,
  }));

  const propertyOptions = [
    ...new Map(resource.data.map((row) => [row.property_id, row.property_name])).entries(),
  ]
    .map(([id, name]) => ({ value: String(id), label: name }))
    .toSorted((a, b) => a.label.localeCompare(b.label));

  const chipFilters: ChipFilter[] = [
    {
      id: 'type',
      label: t('inv_filter_type'),
      anyLabel: t('inv_filter_any_type'),
      value: typeFilter,
      options: ACT_TYPES.map((type) => ({ value: type, label: typeLabel(type) })),
      onChange: setTypeFilter,
    },
    {
      id: 'property',
      label: t('inv_filter_property'),
      anyLabel: t('inv_filter_any_property'),
      value: propertyFilter,
      options: propertyOptions,
      onChange: setPropertyFilter,
    },
  ];

  const activeFilterCount = [typeFilter, propertyFilter].filter(Boolean).length;
  const hasQuery = [search, typeFilter, propertyFilter].some(Boolean) || view !== 'all';

  const clearAll = () => {
    setSearch('');
    setTypeFilter(null);
    setPropertyFilter(null);
  };

  const columns: WorkbenchColumn<InventoryActListOutput>[] = [
    {
      id: 'act',
      header: t('inv_col_act'),
      cell: (row) => (
        <EntityCell
          thumbnail={
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground">
              <ClipboardList className="size-[18px]" />
            </span>
          }
          name={t('inv_code', { id: row.id })}
          secondary={t('inv_created_short', { date: shortDate(format, row.created_at) })}
        />
      ),
    },
    {
      id: 'property',
      header: t('col_property'),
      width: 190,
      secondary: true,
      cell: (row) => <span className="truncate text-muted-foreground">{row.property_name}</span>,
    },
    {
      id: 'type',
      header: t('inv_col_type'),
      width: 130,
      cell: (row) => (
        <StatusPill tone={inventoryTypeTone(row.act_type)} label={typeLabel(row.act_type)} />
      ),
    },
    {
      id: 'condition',
      header: t('inv_col_condition'),
      width: 130,
      cell: (row) => (
        <span className="text-muted-foreground">
          {t('inv_items_count', { count: row.item_count })}
        </span>
      ),
    },
    {
      id: 'photos',
      header: t('inv_col_photos'),
      width: 90,
      align: 'right',
      cell: (row) => <NumericCell>{row.photo_count}</NumericCell>,
    },
    {
      id: 'status',
      header: t('col_status'),
      width: 130,
      cell: (row) => (
        <StatusPill tone={inventoryStatusTone(row.status)} label={statusLabel(row.status)} />
      ),
    },
  ];

  const rowActions = (row: InventoryActListOutput) => (
    <RowActions
      onOpen={() => setSelected(row)}
      quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      labels={{ open: t('row_open'), edit: t('inv_acknowledge'), more: t('row_more') }}
      onEdit={!row.acknowledged_at ? () => setAckTarget(row) : undefined}
      menuItems={[
        { id: 'open', label: t('row_open'), onSelect: () => setSelected(row) },
        {
          id: 'acknowledge',
          label: t('inv_acknowledge'),
          onSelect: () => setAckTarget(row),
          disabled: Boolean(row.acknowledged_at),
        },
      ]}
    />
  );

  const body = ((): React.ReactNode => {
    if (resource.error) {
      return (
        <ErrorState
          title={t('error_title')}
          message={t('inv_error')}
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
          icon={ClipboardList}
          title={t('inv_empty')}
          description={t('inv_empty_desc')}
          action={
            <Button asChild className="h-9 gap-2 rounded-[10px]">
              <Link href="/management/inventory/new">
                <Plus className="size-4" />
                {t('inv_new')}
              </Link>
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

  const inventoryRecord = (
    <InventoryActRecordPanel
      act={selected}
      open={Boolean(selected)}
      onClose={() => setSelected(null)}
      onAcknowledge={() => selected && setAckTarget(selected)}
      statusLabel={statusLabel}
      typeLabel={typeLabel}
    />
  );

  const infoBanner = (
    <div className="flex items-start gap-3 rounded-[12px] border border-border bg-muted/40 px-4 py-3.5">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
        <span>{t('inv_banner_deduction')}</span>
        <span>{t('inv_banner_eimzo')}</span>
      </div>
    </div>
  );

  const dialogs = (
    <>
      <AcknowledgeActDialog
        act={ackTarget}
        open={Boolean(ackTarget)}
        onOpenChange={(open) => !open && setAckTarget(null)}
        onSuccess={(acknowledgedAct) => {
          resource.refetch();
          setSelected((current) =>
            current?.id === acknowledgedAct.id
              ? {
                  ...current,
                  acknowledged_at: acknowledgedAct.acknowledged_at,
                  acknowledged_by_name: acknowledgedAct.acknowledged_by_name,
                }
              : current,
          );
          void getActStats()
            .then((stats) => setCounts(stats.counts))
            .catch(() => false);
        }}
      />
    </>
  );

  if (isMobile) {
    return (
      <>
        <InventoryMobileView
          t={t}
          title={t('inv_title')}
          subtitle={t('inv_subtitle_current')}
          searchPlaceholder={t('inv_search')}
          rows={rows}
          chips={savedViews.map((v) => ({ id: v.id, label: v.label, count: v.count }))}
          activeChip={view}
          onChip={(next) => resource.setQuery(queryForView(next))}
          search={search}
          onSearch={setSearch}
          statusLabel={statusLabel}
          onOpen={setSelected}
          onAcknowledge={(row) => setAckTarget(row)}
          onSendCopy={(row) => exportActsCsv([row], `act-${row.id}.csv`)}
          record={selected ? inventoryRecord : undefined}
          onCloseRecord={() => setSelected(null)}
          empty={body}
          footer={infoBanner}
        />
        {dialogs}
      </>
    );
  }

  return (
    <>
      <WorkbenchShell
        header={
          <ManagementPageHeader
            title={t('inv_title')}
            subtitle={t('inv_subtitle_current')}
            showBell={false}
            actions={
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-[10px] px-4 shadow-none"
                  onClick={() => exportActsCsv(rows, 'inventory-acts.csv')}
                >
                  <Download className="size-[17px]" />
                  {t('export')}
                </Button>
                <Button asChild className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm">
                  <Link href="/management/inventory/new">
                    <Plus className="size-[17px]" />
                    {t('inv_new')}
                  </Link>
                </Button>
              </div>
            }
          />
        }
        kpi={null}
        tabs={
          <SavedViewTabs
            views={savedViews}
            active={view}
            onChange={(next) => resource.setQuery(queryForView(next))}
          />
        }
        toolbar={
          <WorkbenchToolbar
            search={{ value: search, onChange: setSearch }}
            filters={chipFilters}
            sort={{
              value: sort,
              onChange: setSort,
              options: [
                { value: 'newest', label: t('sort_newest') },
                { value: 'oldest', label: t('inv_sort_oldest') },
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
                placeholder: t('inv_search'),
                aria: t('inv_search_aria'),
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
              summary={t('inv_pagination', {
                from: (resource.page - 1) * 20 + 1,
                to: (resource.page - 1) * 20 + rows.length,
                total: resource.total,
              })}
              labels={{ previous: t('previous'), next: t('next'), perPage: t('per_page') }}
            />
          ) : undefined
        }
        panel={inventoryRecord}
        bulkBar={
          <BulkSelectionBar
            open={selection.count > 0}
            countLabel={t('bulk_selected', { count: selection.count })}
            onClear={() => selection.clear()}
            clearLabel={t('bulk_clear')}
            actions={
              <button
                type="button"
                onClick={() => {
                  const chosen = rows.filter((row) => selection.selected.has(row.id));
                  exportActsCsv(chosen, 'inventory-acts.csv');
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
        {infoBanner}
      </WorkbenchShell>
      {dialogs}
    </>
  );
}

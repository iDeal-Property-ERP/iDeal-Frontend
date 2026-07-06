'use client';

import { Download, Handshake, Plus, Trophy, UserCheck, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { NumericCell } from '@/components/management/columns/NumericCell';
import { RowActions } from '@/components/management/columns/RowActions';
import { agentStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import {
  EditAgentDialog,
  NewAgentDialog,
  RecordDealDialog,
} from '@/components/management/dialogs/AgentDialogs';
import { formatMoney } from '@/components/management/format';
import { KpiCard } from '@/components/management/KpiStrip';
import type { KpiItem } from '@/components/management/KpiStrip';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { AgentRecordPanel } from '@/components/management/record-panel/AgentRecordPanel';
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
  exportAgentsCsv,
  getAgentKpis,
  getAgentStatusCounts,
  listAgents,
} from '@/libs/management/agentsAdapter';
import type { AgentKpis, AgentStatusCounts } from '@/libs/management/agentsAdapter';
import type { AgentOutput } from '@/types/management';

const SAVED_VIEW_DEFS = [
  { id: 'active', labelKey: 'agt_view_active', countKey: 'active' },
  { id: 'inactive', labelKey: 'agt_view_inactive', countKey: 'inactive' },
  { id: 'all', labelKey: 'view_all', countKey: 'all' },
] as const satisfies { id: string; labelKey: string; countKey: keyof AgentStatusCounts }[];

type Translator = ReturnType<typeof useTranslations>;

/**
 * Maps a saved-view id to the `is_active` query it applies (as a string).
 * @param view - The saved-view id.
 * @returns The `is_active` query for that view.
 */
function queryForView(view: string): { is_active?: string } {
  if (view === 'active') {
    return { is_active: 'true' };
  }
  if (view === 'inactive') {
    return { is_active: 'false' };
  }
  return { is_active: undefined };
}

/**
 * Reverses the `is_active` query back to a saved-view id.
 * @param isActive - The active `is_active` filter, if any.
 * @returns The matching saved-view id.
 */
function viewFromQuery(isActive: string | undefined): string {
  if (isActive === 'true') {
    return 'active';
  }
  if (isActive === 'false') {
    return 'inactive';
  }
  return 'all';
}

/**
 * Filters the loaded page by agent name (BACKEND-GAP: `/agents/` has no search
 * param) and applies the active sort.
 * @param data - The rows for the current page.
 * @param search - The raw search text.
 * @param sort - The active sort id.
 * @returns The filtered, sorted rows.
 */
function filterAndSortAgents(data: AgentOutput[], search: string, sort: string): AgentOutput[] {
  const query = search.trim().toLowerCase();
  const filtered = query ? data.filter((row) => row.user_name.toLowerCase().includes(query)) : data;
  return filtered.toSorted((a, b) => {
    if (sort === 'deals_high') {
      return b.total_deals - a.total_deals;
    }
    if (sort === 'deals_low') {
      return a.total_deals - b.total_deals;
    }
    if (sort === 'volume_high') {
      return Number.parseFloat(b.total_revenue) - Number.parseFloat(a.total_revenue);
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

/**
 * Whether the open record belongs to the current top agent (for the panel badge).
 * @param selected - The open agent, if any.
 * @param kpis - The KPI bundle carrying the top-agent name, if known.
 * @returns True when the selected agent is the current top agent.
 */
function isTopAgentSelected(selected: AgentOutput | null, kpis: AgentKpis | null): boolean {
  return Boolean(selected && kpis && selected.user_name === kpis.topAgent);
}

/**
 * Builds the four KPI-strip cards from the loaded metrics.
 * @param t - The translator.
 * @param kpis - The KPI bundle, or null while metrics load.
 * @param counts - The status counts (for the active-agents sublabel).
 * @returns The KPI items, or null while metrics load.
 */
function buildAgentKpis(
  t: Translator,
  kpis: AgentKpis | null,
  counts: AgentStatusCounts | null,
): KpiItem[] | null {
  if (!kpis) {
    return null;
  }
  return [
    {
      id: 'deals',
      label: t('agt_kpi_deals_ytd'),
      value: String(kpis.dealsYtd),
      icon: Handshake,
    },
    {
      id: 'commission',
      label: t('agt_kpi_commission_paid'),
      value: formatMoney(kpis.commissionPaid),
      icon: Wallet,
    },
    {
      id: 'active',
      label: t('agt_kpi_active_month'),
      value: String(kpis.activeThisMonth),
      icon: UserCheck,
      sublabel: t('agt_kpi_active_sub', { count: counts?.all ?? kpis.activeThisMonth }),
    },
    {
      id: 'top',
      label: t('agt_kpi_top_agent'),
      value: kpis.topAgent,
      icon: Trophy,
    },
  ];
}

/**
 * The Agents Workbench — the partner-agent performance list: KPI strip,
 * Active / Inactive / All saved-view tabs, a filter toolbar, a selectable table
 * with a floating bulk bar, pagination, an in-flow agent record panel, and the
 * record-deal / new-agent / edit-agent dialogs. Wired to the live `/agents/`
 * backend. Mirrors the Leases workbench.
 * @returns The agents workbench page.
 */
export default function ManagementAgentsPage() {
  const t = useTranslations('Management');

  const resource = usePaginatedResource<AgentOutput>(
    async ({ page, query }) =>
      await listAgents({
        page,
        isActive: query.is_active === undefined ? undefined : query.is_active === 'true',
      }),
    { initialQuery: queryForView('active') },
  );

  const isActive = resource.query.is_active as string | undefined;
  const view = viewFromQuery(isActive);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('deals_high');
  const [selected, setSelected] = useState<AgentOutput | null>(null);
  const [counts, setCounts] = useState<AgentStatusCounts | null>(null);
  const [kpis, setKpis] = useState<AgentKpis | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [recordTarget, setRecordTarget] = useState<AgentOutput | null>(null);
  const [editTarget, setEditTarget] = useState<AgentOutput | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const nextCounts = await getAgentStatusCounts();
        if (!active) {
          return;
        }
        setCounts(nextCounts);
        const nextKpis = await getAgentKpis();
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
  }, []);

  const statusLabel = (active: boolean): string =>
    active ? t('agt_status_active') : t('agt_status_dormant');

  // Client-side search + sort over the loaded page. BACKEND-GAP: `/agents/` has
  // no `search` param, so search filters the current page by agent name.
  const rows = filterAndSortAgents(resource.data, search, sort);

  const pageIds = rows.map((row) => row.id);
  const selection = useRowSelection(pageIds);

  const savedViews: SavedView[] = SAVED_VIEW_DEFS.map((def) => ({
    id: def.id,
    label: t(def.labelKey),
    count: counts ? counts[def.countKey] : undefined,
  }));

  const chipFilters: ChipFilter[] = [
    {
      id: 'status',
      label: t('agt_filter_status'),
      anyLabel: t('agt_filter_any_status'),
      value: isActive ?? null,
      options: [
        { value: 'true', label: t('agt_status_active') },
        { value: 'false', label: t('agt_status_dormant') },
      ],
      onChange: (value) => resource.patchQuery({ is_active: value ?? undefined }),
    },
  ];

  const activeFilterCount = isActive === undefined ? 0 : 1;
  const hasQuery = Boolean(search) || view !== 'active';

  const clearAll = () => {
    resource.setQuery({});
    setSearch('');
  };

  const columns: WorkbenchColumn<AgentOutput>[] = [
    {
      id: 'agent',
      header: t('agt_col_agent'),
      cell: (row) => (
        <EntityCell
          thumbnail={<AvatarInitials name={row.user_name} size={40} />}
          name={row.user_name}
          secondary={t('agt_col_agent_secondary')}
        />
      ),
    },
    {
      id: 'deals',
      header: t('agt_col_deals'),
      width: 110,
      cell: (row) => <span className="text-foreground tabular-nums">{row.total_deals}</span>,
    },
    {
      id: 'volume',
      header: t('agt_col_volume'),
      width: 130,
      align: 'right',
      cell: (row) => <NumericCell>{formatMoney(row.total_revenue)}</NumericCell>,
    },
    {
      id: 'commission',
      header: t('agt_col_commission'),
      width: 120,
      cell: (row) => <span className="text-foreground tabular-nums">{row.commission_rate}%</span>,
    },
    {
      id: 'last_deal',
      header: t('agt_col_last_deal'),
      width: 130,
      secondary: true,
      // BACKEND-GAP: AgentOutput has no last-deal field and per-row fetches are
      // too costly, so this shows an em dash placeholder.
      cell: () => <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'status',
      header: t('col_status'),
      width: 130,
      cell: (row) => (
        <StatusPill tone={agentStatusTone(row.is_active)} label={statusLabel(row.is_active)} />
      ),
    },
  ];

  const kpiItems = buildAgentKpis(t, kpis, counts);

  const rowActions = (row: AgentOutput) => (
    <RowActions
      onOpen={() => setSelected(row)}
      quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      labels={{ open: t('row_open'), edit: t('agt_record_deal'), more: t('row_more') }}
      onEdit={() => setRecordTarget(row)}
      menuItems={[
        { id: 'open', label: t('row_open'), onSelect: () => setSelected(row) },
        { id: 'record', label: t('agt_record_deal'), onSelect: () => setRecordTarget(row) },
        {
          id: 'edit',
          label: t('agt_edit_agent'),
          separatorBefore: true,
          onSelect: () => setEditTarget(row),
        },
      ]}
    />
  );

  let body: React.ReactNode;
  if (resource.error) {
    body = (
      <ErrorState
        title={t('error_title')}
        message={t('agt_error')}
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
        icon={Handshake}
        title={t('agt_empty')}
        description={t('agt_empty_desc')}
        action={
          <Button className="h-9 gap-2 rounded-[10px]" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            {t('agt_new_agent')}
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
            title={t('agents')}
            subtitle={t('agt_subtitle', { count: counts?.all ?? resource.total })}
            showBell={false}
            actions={
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-[10px] px-4 shadow-none"
                  onClick={() => exportAgentsCsv(rows, 'agents.csv')}
                >
                  <Download className="size-[17px]" />
                  {t('export')}
                </Button>
                <Button
                  className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
                  onClick={() => setRecordTarget(selected ?? rows[0] ?? null)}
                  disabled={rows.length === 0}
                >
                  <Plus className="size-[17px]" />
                  {t('agt_record_deal')}
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
            onChange={(next) => resource.patchQuery(queryForView(next))}
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
                { value: 'deals_high', label: t('agt_sort_deals_high') },
                { value: 'deals_low', label: t('agt_sort_deals_low') },
                { value: 'volume_high', label: t('agt_sort_volume_high') },
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
                placeholder: t('agt_search'),
                aria: t('agt_search_aria'),
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
              summary={t('agt_pagination', {
                from: (resource.page - 1) * 20 + 1,
                to: (resource.page - 1) * 20 + rows.length,
                total: resource.total,
              })}
              labels={{ previous: t('previous'), next: t('next'), perPage: t('per_page') }}
            />
          ) : undefined
        }
        panel={
          <AgentRecordPanel
            agent={selected}
            open={Boolean(selected)}
            onClose={() => setSelected(null)}
            onRecordDeal={() => selected && setRecordTarget(selected)}
            onEdit={() => selected && setEditTarget(selected)}
            statusLabel={statusLabel}
            isTopAgent={isTopAgentSelected(selected, kpis)}
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
                  exportAgentsCsv(chosen, 'agents.csv');
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

      <RecordDealDialog
        agent={recordTarget}
        open={Boolean(recordTarget)}
        onOpenChange={(open) => !open && setRecordTarget(null)}
        onSuccess={resource.refetch}
      />
      <NewAgentDialog open={newOpen} onOpenChange={setNewOpen} onSuccess={resource.refetch} />
      <EditAgentDialog
        agent={editTarget}
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSuccess={resource.refetch}
      />
    </>
  );
}

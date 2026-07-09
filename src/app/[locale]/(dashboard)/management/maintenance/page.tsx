'use client';

import { AlertCircle, CheckCircle2, CircleDollarSign, Clock, Plus, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { RowActions } from '@/components/management/columns/RowActions';
import { priorityTone, StatusPill } from '@/components/management/columns/StatusPill';
import {
  AssignTechnicianDialog,
  CancelRequestDialog,
  NewRequestDialog,
  ResolveRequestDialog,
} from '@/components/management/dialogs/MaintenanceDialogs';
import type { KpiItem } from '@/components/management/KpiStrip';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { MaintenanceMobileView } from '@/components/management/mobile/MaintenanceMobileView';
import { MaintenanceRecordPanel } from '@/components/management/record-panel/MaintenanceRecordPanel';
import { EmptyState } from '@/components/management/states/EmptyState';
import { ErrorState } from '@/components/management/states/ErrorState';
import { FilteredEmptyState } from '@/components/management/states/FilteredEmptyState';
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
import { useRowSelection } from '@/hooks/management/useRowSelection';
import { useIsMobile } from '@/hooks/use-mobile';
import { relativeTime } from '@/libs/management/format';
import { getMaintenanceStats, listServiceRequests } from '@/libs/management/maintenanceAdapter';
import { listProperties } from '@/libs/management/propertiesAdapter';
import type { ManagementServiceRequestOutput, MaintenanceStats } from '@/types/management';

const TABS = ['open', 'in_progress', 'resolved', 'all'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function ManagementMaintenancePage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();

  const [view, setView] = useState<string>('open');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([]);
  const [selected, setSelected] = useState<ManagementServiceRequestOutput | null>(null);

  const [assignReq, setAssignReq] = useState<ManagementServiceRequestOutput | null>(null);
  const [resolveReq, setResolveReq] = useState<ManagementServiceRequestOutput | null>(null);
  const [cancelReq, setCancelReq] = useState<ManagementServiceRequestOutput | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const resource = usePaginatedResource<ManagementServiceRequestOutput>(
    async ({ page, query }) =>
      await listServiceRequests({
        page,
        perPage: 20,
        status: query.status as string,
        priority: query.priority as string,
        propertyId: query.property_id as string,
        unassigned: query.unassigned === 'true',
        search: (query.search as string) || undefined,
        order: (query.order as string) || 'priority',
      }),
    { initialQuery: { status: 'open', order: 'priority' } },
  );
  const { patchQuery, refetch, data: rows, query } = resource;
  const selection = useRowSelection(rows.map((r) => r.id));

  const reloadStats = () => {
    getMaintenanceStats()
      .then(setStats)
      .catch(() => setStats(null));
  };
  useEffect(() => {
    reloadStats();
  }, []);
  useEffect(() => {
    listProperties({ page: 1, perPage: 100 })
      .then((res) =>
        setPropertyOptions(res.items.map((i) => ({ value: String(i.id), label: i.name }))),
      )
      .catch(() => setPropertyOptions([]));
  }, []);

  const changeView = (next: string) => {
    setView(next);
    setSelected(null);
    patchQuery({ status: next === 'all' ? undefined : next, unassigned: undefined });
  };

  const afterMutation = () => {
    refetch();
    reloadStats();
    setSelected(null);
  };

  const kpiItems: KpiItem[] | null = ((): KpiItem[] | null => {
    if (!stats) {
      return null;
    }
    return [
      {
        id: 'open',
        label: t('mnt_kpi_open'),
        value: String(stats.open),
        icon: AlertCircle,
        sublabel: t('mnt_kpi_unassigned', { count: stats.open_unassigned }),
        onClick: () => patchQuery({ status: 'open', unassigned: 'true' }),
        active: query.unassigned === 'true',
      },
      {
        id: 'in_progress',
        label: t('mnt_kpi_in_progress'),
        value: String(stats.in_progress),
        icon: Clock,
        sublabel: t('mnt_kpi_avg_age', { days: stats.in_progress_avg_age_days }),
      },
      {
        id: 'resolved',
        label: t('mnt_kpi_resolved'),
        value: String(stats.resolved_30d),
        icon: CheckCircle2,
        sublabel: t('mnt_kpi_avg_resolution', { days: stats.resolved_30d_avg_days }),
      },
      {
        id: 'cost',
        label: t('mnt_kpi_cost'),
        value: `$${stats.cost_30d_total}`,
        icon: CircleDollarSign,
        sublabel: t('mnt_kpi_cost_split', {
          owner: `$${stats.cost_30d_owner}`,
          platform: `$${stats.cost_30d_platform}`,
        }),
      },
    ];
  })();

  const savedViews: SavedView[] = TABS.map((id) => ({
    id,
    label: t(`mnt_tab_${id}`),
    count: stats?.counts[id === 'all' ? 'all' : id],
  }));

  const chipFilters: ChipFilter[] = ((): ChipFilter[] => [
    {
      id: 'priority',
      label: t('mnt_filter_priority'),
      anyLabel: t('mnt_filter_priority'),
      value: (query.priority as string) ?? null,
      options: PRIORITIES.map((p) => ({ value: p, label: t(`priority_${p}` as never) })),
      onChange: (value) => patchQuery({ priority: value ?? undefined }),
    },
    {
      id: 'property',
      label: t('mnt_filter_property'),
      anyLabel: t('mnt_filter_property'),
      value: (query.property_id as string) ?? null,
      options: propertyOptions,
      onChange: (value) => patchQuery({ property_id: value ?? undefined }),
    },
  ])();

  const activeFilterCount = [query.priority, query.property_id, query.unassigned].filter(
    Boolean,
  ).length;
  const hasQuery = Boolean(search) || activeFilterCount > 0 || view !== 'open';

  const columns: WorkbenchColumn<ManagementServiceRequestOutput>[] = [
    {
      id: 'request',
      header: t('mnt_col_request'),
      cell: (row) => (
        <EntityCell
          name={row.title}
          secondary={`SRQ-${row.id}${row.photos_count ? ` · ${t('mnt_photos_count', { count: row.photos_count })}` : ''}`}
        />
      ),
    },
    {
      id: 'property',
      header: t('mnt_col_property'),
      width: 160,
      secondary: true,
      cell: (row) => <span className="text-muted-foreground">{row.property_name}</span>,
    },
    {
      id: 'tenant',
      header: t('mnt_col_tenant'),
      width: 140,
      secondary: true,
      cell: (row) => <span className="text-muted-foreground">{row.tenant_name}</span>,
    },
    {
      id: 'priority',
      header: t('mnt_col_priority'),
      width: 110,
      cell: (row) => (
        <StatusPill
          tone={priorityTone(row.priority)}
          label={t(`priority_${row.priority}` as never)}
        />
      ),
    },
    {
      id: 'reported',
      header: t('mnt_col_reported'),
      width: 140,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{relativeTime(row.created_at)}</span>
          {row.priority === 'critical' && row.status === 'open' ? (
            <span className="text-xs text-danger">{t('mnt_sla_line', { hours: 4 })}</span>
          ) : null}
        </div>
      ),
    },
    {
      id: 'assignee',
      header: t('mnt_col_assignee'),
      width: 150,
      cell: (row) =>
        row.assigned_to_name ? (
          <span className="text-sm text-foreground">{row.assigned_to_name}</span>
        ) : (
          <StatusPill tone="warning" label={t('mnt_unassigned')} />
        ),
    },
  ];

  const rowActions = (row: ManagementServiceRequestOutput) => (
    <RowActions
      onOpen={() => setSelected(row)}
      quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      labels={{ open: t('row_open'), edit: t('mnt_assign'), more: t('row_more') }}
      onEdit={/resolved|cancelled/iu.test(row.status) ? undefined : () => setAssignReq(row)}
      menuItems={[
        { id: 'open', label: t('row_open'), onSelect: () => setSelected(row) },
        {
          id: 'assign',
          label: t('mnt_assign'),
          disabled: /resolved|cancelled/iu.test(row.status),
          onSelect: () => setAssignReq(row),
        },
        {
          id: 'resolve',
          label: t('mnt_resolve'),
          disabled: /resolved|cancelled/iu.test(row.status),
          onSelect: () => setResolveReq(row),
        },
        {
          id: 'cancel',
          label: t('mnt_cancel'),
          disabled: /resolved|cancelled/iu.test(row.status),
          variant: 'destructive',
          onSelect: () => setCancelReq(row),
        },
      ]}
    />
  );

  const showPagination = resource.totalPages > 1;

  const body = ((): React.ReactNode => {
    if (resource.isLoading && rows.length === 0) {
      return <WorkbenchTableSkeleton />;
    }
    if (rows.length === 0) {
      return hasQuery ? (
        <FilteredEmptyState
          title={t('mnt_empty')}
          description={t('mnt_empty')}
          clearLabel={t('clear_all')}
          onClear={() => {
            setSearch('');
            setView('open');
            resource.setQuery({ status: 'open', order: 'priority' });
          }}
        />
      ) : (
        <EmptyState icon={Wrench} title={t('mnt_empty')} />
      );
    }
    return (
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
        rowActions={rowActions}
        dense={Boolean(selected)}
        labels={{ selectAll: t('select_all'), selectRow: t('select_row') }}
      />
    );
  })();

  const dialogs = (
    <>
      <AssignTechnicianDialog
        request={assignReq}
        open={Boolean(assignReq)}
        onOpenChange={(o) => !o && setAssignReq(null)}
        onSuccess={afterMutation}
      />
      <ResolveRequestDialog
        request={resolveReq}
        open={Boolean(resolveReq)}
        onOpenChange={(o) => !o && setResolveReq(null)}
        onSuccess={afterMutation}
      />
      <CancelRequestDialog
        request={cancelReq}
        open={Boolean(cancelReq)}
        onOpenChange={(o) => !o && setCancelReq(null)}
        onSuccess={afterMutation}
      />
      <NewRequestDialog open={newOpen} onOpenChange={setNewOpen} onSuccess={afterMutation} />
    </>
  );

  const subtitle = stats
    ? t('mnt_subtitle', { count: stats.open_unassigned })
    : t('mnt_subtitle_zero');

  const header = (
    <ManagementPageHeader
      title={t('nav_maintenance')}
      subtitle={subtitle}
      actions={
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="size-4" />
          {t('mnt_new_request')}
        </Button>
      }
    />
  );

  if (resource.error) {
    return (
      <ErrorState
        title={t('mnt_error')}
        message={resource.error}
        onRetry={resource.refetch}
        retryLabel={t('retry')}
      />
    );
  }

  if (isMobile) {
    return (
      <>
        {header}
        <div className="mt-4">
          <MaintenanceMobileView
            requests={rows}
            views={savedViews}
            activeView={view}
            onViewChange={changeView}
            onOpen={setSelected}
            onAssign={setAssignReq}
            onResolve={setResolveReq}
          />
        </div>
        <MaintenanceRecordPanel
          request={selected}
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          onAssign={() => selected && setAssignReq(selected)}
          onResolve={() => selected && setResolveReq(selected)}
          onCancel={() => selected && setCancelReq(selected)}
        />
        {dialogs}
      </>
    );
  }

  return (
    <>
      <WorkbenchShell
        header={header}
        kpi={<WorkbenchKpiGrid items={kpiItems} compact={Boolean(selected)} />}
        tabs={<SavedViewTabs views={savedViews} active={view} onChange={changeView} />}
        toolbar={
          <WorkbenchToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                patchQuery({ search: v || undefined });
              },
            }}
            filters={chipFilters}
            sort={{
              value: (query.order as string | undefined) ?? 'priority',
              onChange: (value) => patchQuery({ order: value }),
              options: [
                { value: 'priority', label: t('mnt_sort_priority') },
                { value: 'recent', label: t('mnt_sort_recent') },
                { value: 'oldest', label: t('mnt_sort_oldest') },
              ],
            }}
            activeFilterCount={activeFilterCount}
            onClearAll={() => {
              setSearch('');
              resource.setQuery({ status: view === 'all' ? undefined : view, order: 'priority' });
            }}
            labels={{
              filters: t('filters'),
              clearAll: t('clear_all'),
              filtersTitle: t('filters_title'),
              done: t('done'),
              columns: t('columns'),
              sort: t('sort'),
              search: {
                placeholder: t('mnt_search'),
                aria: t('mnt_search'),
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
          <MaintenanceRecordPanel
            request={selected}
            open={Boolean(selected)}
            onClose={() => setSelected(null)}
            onAssign={() => selected && setAssignReq(selected)}
            onResolve={() => selected && setResolveReq(selected)}
            onCancel={() => selected && setCancelReq(selected)}
          />
        }
      >
        {body}
      </WorkbenchShell>
      {dialogs}
    </>
  );
}

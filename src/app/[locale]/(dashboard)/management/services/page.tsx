'use client';

import { Download, Plus, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { NumericCell } from '@/components/management/columns/NumericCell';
import { RowActions } from '@/components/management/columns/RowActions';
import { StatusPill, vasOrderStatusTone } from '@/components/management/columns/StatusPill';
import { ExportDialog } from '@/components/management/dialogs/ExportDialog';
import type { ExportScope } from '@/components/management/dialogs/ExportDialog';
import {
  CancelOrderDialog,
  CatalogItemDialog,
  ConfirmScheduleDialog,
  NewOrderDialog,
} from '@/components/management/dialogs/ServiceDialogs';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { ServicesMobileView } from '@/components/management/mobile/ServicesMobileView';
import { ServiceOrderRecordPanel } from '@/components/management/record-panel/ServiceOrderRecordPanel';
import { PartnersGrid } from '@/components/management/services/PartnersGrid';
import { ServiceCard } from '@/components/management/services/ServiceCard';
import { ServiceCatalogStrip } from '@/components/management/services/ServiceCatalogStrip';
import { EmptyState } from '@/components/management/states/EmptyState';
import { ErrorState } from '@/components/management/states/ErrorState';
import { FilteredEmptyState } from '@/components/management/states/FilteredEmptyState';
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
import { downloadTable } from '@/libs/management/exportFile';
import type { ExportFormat } from '@/libs/management/exportFile';
import { relativeTime } from '@/libs/management/format';
import {
  buildVasOrdersExportRows,
  getVasStats,
  listCatalog,
  listVasOrders,
  listVasPartners,
  setVasOrderStatus,
} from '@/libs/management/servicesAdapter';
import type {
  ServiceCatalogItemOutput,
  ServiceOrderOutput,
  VasOrderStats,
  VasPartnerRow,
} from '@/types/vas';

const TABS = ['orders', 'catalog', 'partners'] as const;
const ORDER_STATUSES = ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const SERVICE_TYPES = ['cleaning', 'handyman', 'utility', 'internet', 'moving', 'other'];

export default function ManagementServicesPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();

  const [tab, setTab] = useState<string>('orders');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<VasOrderStats | null>(null);
  const [catalog, setCatalog] = useState<ServiceCatalogItemOutput[]>([]);
  const [partners, setPartners] = useState<VasPartnerRow[]>([]);
  const [selected, setSelected] = useState<ServiceOrderOutput | null>(null);

  const [confirmOrder, setConfirmOrder] = useState<ServiceOrderOutput | null>(null);
  const [cancelOrder, setCancelOrder] = useState<ServiceOrderOutput | null>(null);
  const [editItem, setEditItem] = useState<ServiceCatalogItemOutput | null>(null);
  const [itemOpen, setItemOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const resource = usePaginatedResource<ServiceOrderOutput>(
    async ({ page, query }) =>
      await listVasOrders({
        page,
        perPage: 20,
        status: query.status as string,
        serviceType: query.service_type as string,
        search: (query.search as string) || undefined,
        order: (query.order as string) || 'recent',
      }),
    { initialQuery: { order: 'recent' } },
  );
  const { patchQuery, refetch, data: rows, query } = resource;
  const selection = useRowSelection(rows.map((r) => r.id));

  // The legacy /vas-catalog route redirects here with ?tab=catalog.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('tab');
    if (initial && (TABS as readonly string[]).includes(initial)) {
      setTab(initial);
    }
  }, []);

  const reloadStats = () => {
    getVasStats()
      .then(setStats)
      .catch(() => setStats(null));
  };
  const reloadCatalog = () => {
    listCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]));
  };
  useEffect(() => {
    reloadStats();
    reloadCatalog();
  }, []);
  useEffect(() => {
    if (tab !== 'partners') {
      return;
    }
    listVasPartners()
      .then(setPartners)
      .catch(() => setPartners([]));
  }, [tab]);

  const afterMutation = () => {
    refetch();
    reloadStats();
    setSelected(null);
  };
  const afterCatalogMutation = () => {
    reloadCatalog();
    reloadStats();
  };

  const quickConfirm = async (order: ServiceOrderOutput) => {
    try {
      await setVasOrderStatus(order.id, 'confirmed');
      afterMutation();
    } catch {
      // surfaced through the next refetch; the dialog path carries toasts
    }
  };

  const catalogMeta = (item: ServiceCatalogItemOutput) =>
    [
      `$${item.base_price}`,
      item.partner_name ? t('svc_meta_partner', { partner: item.partner_name }) : null,
      t('svc_meta_commission', { rate: item.commission_rate }),
    ]
      .filter(Boolean)
      .join(' · ');

  const savedViews: SavedView[] = [
    { id: 'orders', label: t('svc_tab_orders'), count: stats?.counts.all },
    { id: 'catalog', label: t('svc_tab_catalog'), count: stats?.catalog_count },
    { id: 'partners', label: t('svc_tab_partners'), count: stats?.partners_count },
  ];

  const chipFilters: ChipFilter[] = ((): ChipFilter[] => [
    {
      id: 'service',
      label: t('svc_filter_service'),
      anyLabel: t('svc_filter_service'),
      value: (query.service_type as string) ?? null,
      options: SERVICE_TYPES.map((type) => ({
        value: type,
        label: t(`vas_type_${type}` as never),
      })),
      onChange: (value) => patchQuery({ service_type: value ?? undefined }),
    },
    {
      id: 'status',
      label: t('svc_filter_status'),
      anyLabel: t('svc_filter_status'),
      value: (query.status as string) ?? null,
      options: ORDER_STATUSES.map((s) => ({ value: s, label: t(`vas_status_${s}` as never) })),
      onChange: (value) => patchQuery({ status: value ?? undefined }),
    },
  ])();

  const activeFilterCount = [query.service_type, query.status].filter(Boolean).length;
  const hasQuery = Boolean(search) || activeFilterCount > 0;

  const columns: WorkbenchColumn<ServiceOrderOutput>[] = [
    {
      id: 'order',
      header: t('svc_col_order'),
      cell: (row) => (
        <EntityCell
          name={row.catalog_item_name}
          secondary={`ORD-${row.id} · ${relativeTime(row.created_at)}`}
        />
      ),
    },
    {
      id: 'customer',
      header: t('svc_col_customer'),
      width: 170,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <AvatarInitials name={row.tenant_name} size={28} />
          <span className="truncate text-sm text-foreground">{row.tenant_name}</span>
        </div>
      ),
    },
    {
      id: 'property',
      header: t('svc_col_property'),
      width: 170,
      secondary: true,
      cell: (row) => <span className="text-muted-foreground">{row.property_name}</span>,
    },
    {
      id: 'price',
      header: t('svc_col_price'),
      width: 100,
      align: 'right',
      cell: (row) => <NumericCell>${row.cost}</NumericCell>,
    },
    {
      id: 'commission',
      header: t('svc_col_commission'),
      width: 110,
      align: 'right',
      secondary: true,
      cell: (row) => <NumericCell muted>${row.commission_earned}</NumericCell>,
    },
    {
      id: 'status',
      header: t('svc_col_status'),
      width: 130,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <StatusPill
            tone={vasOrderStatusTone(row.status)}
            label={t(`vas_status_${row.status}` as never)}
          />
          {row.status === 'requested' ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                quickConfirm(row);
              }}
            >
              {t('svc_confirm')}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const rowActions = (row: ServiceOrderOutput) => {
    const terminal = row.status === 'completed' || row.status === 'cancelled';
    return (
      <RowActions
        onOpen={() => setSelected(row)}
        quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        labels={{ open: t('row_open'), edit: t('svc_confirm'), more: t('row_more') }}
        onEdit={row.status === 'requested' ? () => setConfirmOrder(row) : undefined}
        menuItems={[
          { id: 'open', label: t('row_open'), onSelect: () => setSelected(row) },
          {
            id: 'confirm',
            label: t('svc_confirm'),
            disabled: row.status !== 'requested',
            onSelect: () => setConfirmOrder(row),
          },
          {
            id: 'start',
            label: t('svc_start'),
            disabled: row.status !== 'confirmed',
            onSelect: () => {
              setVasOrderStatus(row.id, 'in_progress')
                .then(afterMutation)
                .catch(() => refetch());
            },
          },
          {
            id: 'done',
            label: t('svc_mark_done'),
            disabled: terminal,
            onSelect: () => {
              setVasOrderStatus(row.id, 'completed')
                .then(afterMutation)
                .catch(() => refetch());
            },
          },
          {
            id: 'cancel',
            label: t('svc_cancel'),
            disabled: terminal,
            variant: 'destructive',
            onSelect: () => setCancelOrder(row),
          },
        ]}
      />
    );
  };

  const onExport = async (scope: ExportScope, format: ExportFormat) => {
    const headers = [
      t('svc_export_id'),
      t('svc_export_service'),
      t('svc_export_customer'),
      t('svc_export_property'),
      t('svc_export_price'),
      t('svc_export_commission'),
      t('svc_export_status'),
      t('svc_export_scheduled'),
    ];
    let data = rows;
    if (scope === 'selected') {
      data = rows.filter((r) => selection.isSelected(r.id));
    } else {
      const res = await listVasOrders({
        page: 1,
        perPage: 1000,
        status: scope === 'filtered' ? ((query.status as string) ?? undefined) : undefined,
        serviceType:
          scope === 'filtered' ? ((query.service_type as string) ?? undefined) : undefined,
        search: scope === 'filtered' ? ((query.search as string) ?? undefined) : undefined,
      });
      data = res.items;
    }
    await downloadTable(
      buildVasOrdersExportRows(data, headers),
      format,
      'service-orders',
      t('nav_services'),
    );
  };

  const ordersBody = ((): React.ReactNode => {
    if (resource.isLoading && rows.length === 0) {
      return <WorkbenchTableSkeleton />;
    }
    if (rows.length === 0) {
      return hasQuery ? (
        <FilteredEmptyState
          title={t('svc_empty')}
          description={t('svc_empty')}
          clearLabel={t('clear_all')}
          onClear={() => {
            setSearch('');
            resource.setQuery({ order: 'recent' });
          }}
        />
      ) : (
        <EmptyState icon={Sparkles} title={t('svc_empty')} />
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <ServiceCatalogStrip
          items={catalog.filter((c) => c.is_active)}
          buildMeta={catalogMeta}
          onEdit={(item) => {
            setEditItem(item);
            setItemOpen(true);
          }}
          onAdd={() => {
            setEditItem(null);
            setItemOpen(true);
          }}
          addLabel={t('svc_add_item')}
        />
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
      </div>
    );
  })();

  const catalogBody = (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {catalog.map((item) => (
        <ServiceCard
          key={item.id}
          item={item}
          meta={catalogMeta(item)}
          onClick={() => {
            setEditItem(item);
            setItemOpen(true);
          }}
        />
      ))}
    </div>
  );

  const partnersBody = (
    <PartnersGrid
      partners={partners}
      labels={{
        services: (count) => t('svc_partner_services', { count }),
        orders: (count) => t('svc_partner_orders', { count }),
        commission: t('svc_partner_commission'),
      }}
    />
  );

  const body = ((): React.ReactNode => {
    if (tab === 'catalog') {
      return catalogBody;
    }
    if (tab === 'partners') {
      return partnersBody;
    }
    return ordersBody;
  })();

  const dialogs = (
    <>
      <CatalogItemDialog
        item={editItem}
        open={itemOpen}
        onOpenChange={setItemOpen}
        onSuccess={afterCatalogMutation}
      />
      <NewOrderDialog
        catalog={catalog}
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        onSuccess={afterMutation}
      />
      <ConfirmScheduleDialog
        order={confirmOrder}
        open={Boolean(confirmOrder)}
        onOpenChange={(o) => !o && setConfirmOrder(null)}
        onSuccess={afterMutation}
      />
      <CancelOrderDialog
        order={cancelOrder}
        open={Boolean(cancelOrder)}
        onOpenChange={(o) => !o && setCancelOrder(null)}
        onSuccess={afterMutation}
      />
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={t('svc_export_title')}
        currentViewLabel={t('svc_tab_orders')}
        counts={{
          filtered: resource.total,
          all: stats?.counts.all ?? resource.total,
          selected: selection.count,
        }}
        onExport={onExport}
        labels={{
          scopeTitle: t('export_scope'),
          filtered: (count) => t('export_filtered', { count }),
          all: (count) => t('export_all', { count }),
          selected: (count) => t('export_selected', { count }),
          formatTitle: t('export_format'),
          footnote: t('export_footnote'),
          cancel: t('cancel'),
          submit: (count) => t('export_submit', { count }),
          failed: t('export_failed'),
        }}
      />
    </>
  );

  const header = (
    <ManagementPageHeader
      title={t('nav_services')}
      subtitle={stats ? t('svc_subtitle', { count: stats.new }) : t('svc_subtitle_zero')}
      actions={
        <Button
          onClick={() => {
            setEditItem(null);
            setItemOpen(true);
          }}
        >
          <Plus className="size-4" />
          {t('svc_add_item')}
        </Button>
      }
    />
  );

  if (resource.error) {
    return (
      <ErrorState
        title={t('svc_error')}
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
          {tab === 'orders' ? (
            <ServicesMobileView
              orders={rows}
              views={savedViews}
              activeView={tab}
              onViewChange={setTab}
              onOpen={setSelected}
              onConfirm={setConfirmOrder}
              onCancel={setCancelOrder}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <SavedViewTabs views={savedViews} active={tab} onChange={setTab} />
              {tab === 'catalog' ? catalogBody : partnersBody}
            </div>
          )}
        </div>
        <ServiceOrderRecordPanel
          order={selected}
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          onConfirm={() => selected && setConfirmOrder(selected)}
          onSchedule={() => selected && setConfirmOrder(selected)}
          onCancel={() => selected && setCancelOrder(selected)}
        />
        {dialogs}
      </>
    );
  }

  return (
    <>
      <WorkbenchShell
        header={header}
        kpi={null}
        tabs={<SavedViewTabs views={savedViews} active={tab} onChange={setTab} />}
        toolbar={
          tab === 'orders' ? (
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
                value: (query.order as string | undefined) ?? 'recent',
                onChange: (value) => patchQuery({ order: value }),
                options: [
                  { value: 'recent', label: t('svc_sort_recent') },
                  { value: 'oldest', label: t('svc_sort_oldest') },
                  { value: '-cost', label: t('svc_sort_cost_desc') },
                  { value: 'scheduled', label: t('svc_sort_scheduled') },
                ],
              }}
              activeFilterCount={activeFilterCount}
              onClearAll={() => {
                setSearch('');
                resource.setQuery({ order: 'recent' });
              }}
              extra={
                <>
                  <Button variant="outline" onClick={() => setNewOrderOpen(true)}>
                    {t('svc_new_order')}
                  </Button>
                  <Button variant="outline" onClick={() => setExportOpen(true)}>
                    <Download className="size-4" />
                    {t('export')}
                  </Button>
                </>
              }
              labels={{
                filters: t('filters'),
                clearAll: t('clear_all'),
                filtersTitle: t('filters_title'),
                done: t('done'),
                columns: t('columns'),
                sort: t('sort'),
                search: {
                  placeholder: t('svc_search'),
                  aria: t('svc_search'),
                  clear: t('search_clear'),
                },
              }}
            />
          ) : undefined
        }
        pagination={
          tab === 'orders' && resource.totalPages > 1 ? (
            <WorkbenchPagination
              page={resource.page}
              totalPages={resource.totalPages}
              onPageChange={resource.setPage}
              summary={t('svc_pagination', {
                from: (resource.page - 1) * 20 + 1,
                to: (resource.page - 1) * 20 + rows.length,
                total: resource.total,
              })}
              labels={{ previous: t('previous'), next: t('next'), perPage: t('per_page') }}
            />
          ) : undefined
        }
        panel={
          <ServiceOrderRecordPanel
            order={selected}
            open={Boolean(selected)}
            onClose={() => setSelected(null)}
            onConfirm={() => selected && setConfirmOrder(selected)}
            onSchedule={() => selected && setConfirmOrder(selected)}
            onCancel={() => selected && setCancelOrder(selected)}
          />
        }
      >
        {body}
      </WorkbenchShell>
      {dialogs}
    </>
  );
}

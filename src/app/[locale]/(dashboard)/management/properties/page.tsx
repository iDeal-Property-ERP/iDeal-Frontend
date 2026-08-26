'use client';

import {
  Building2,
  ClipboardCheck,
  Coins,
  Download,
  FileUp,
  PieChart,
  Plus,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { NumericCell } from '@/components/management/columns/NumericCell';
import { PropertyThumbnail } from '@/components/management/columns/PropertyThumbnail';
import { RowActions } from '@/components/management/columns/RowActions';
import { propertyStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { DangerConfirmDialog } from '@/components/management/dialogs/DangerConfirmDialog';
import { ImportDialog } from '@/components/management/dialogs/ImportDialog';
import { formatMoney } from '@/components/management/format';
import { KpiCard } from '@/components/management/KpiStrip';
import type { KpiItem } from '@/components/management/KpiStrip';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import type { FilterGroup } from '@/components/management/mobile/MobileFilterSheet';
import { PropertiesMobileView } from '@/components/management/mobile/PropertiesMobileView';
import { PropertyRecordPanel } from '@/components/management/record-panel/PropertyRecordPanel';
import { ErrorState } from '@/components/management/states/ErrorState';
import { FilteredEmptyState } from '@/components/management/states/FilteredEmptyState';
import { FirstRunState } from '@/components/management/states/FirstRunState';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePaginatedResource } from '@/hooks/management/usePaginatedResource';
import { useRowSelection } from '@/hooks/management/useRowSelection';
import { useIsMobile } from '@/hooks/use-mobile';
import { getApiErrorMessage } from '@/libs/forms';
import { Link, useRouter } from '@/libs/I18nNavigation';
import {
  bulkChangeStatus,
  deleteProperty,
  exportPropertiesCsv,
  getDistricts,
  getStatusCounts,
  getWorkbenchKpis,
  listProperties,
  PROPERTY_STATUSES,
  PROPERTY_TARIFFS,
} from '@/libs/management/propertiesAdapter';
import type {
  DistrictOption,
  StatusCounts,
  WorkbenchKpis,
} from '@/libs/management/propertiesAdapter';
import type { ManagementPropertyOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;
export type PropertyOverrides = Record<number, string>;
type Overrides = PropertyOverrides;

const PRICE_RANGES = {
  '0-400': [0, 400],
  '400-600': [400, 600],
  '600-800': [600, 800],
  '800+': [800, Number.POSITIVE_INFINITY],
} satisfies Record<string, [number, number]>;

const SAVED_VIEW_DEFS = [
  { id: 'all', labelKey: 'view_all', countKey: 'all' },
  { id: 'rented', labelKey: 'view_rented', countKey: 'rented' },
  { id: 'vacant', labelKey: 'view_vacant', countKey: 'vacant' },
  { id: 'maintenance', labelKey: 'view_maintenance', countKey: 'maintenance' },
  { id: 'pending', labelKey: 'view_pending', countKey: 'pending_review' },
] as const satisfies { id: string; labelKey: string; countKey: keyof StatusCounts }[];

/**
 * Maps a saved-view id to the backend status filter.
 * @param view - The saved-view id.
 * @returns The backend status, or undefined for "all".
 */
function statusForView(view: string): string | undefined {
  if (view === 'all') {
    return undefined;
  }
  return view === 'pending' ? 'pending_review' : view;
}

/**
 * Maps a backend status back to the saved-view id.
 * @param status - The active status filter (or undefined).
 * @returns The matching saved-view id.
 */
function viewFromStatus(status: string | undefined): string {
  if (!status) {
    return 'all';
  }
  return status === 'pending_review' ? 'pending' : status;
}

/**
 * The effective monthly rent for a property (tenant charge, falling back to ask).
 * @param row - The property row.
 * @returns The rent as a number, or 0 when unset.
 */
function rentOf(row: ManagementPropertyOutput): number {
  const charge = Number(row.tenant_charge_price ?? '');
  if (!Number.isNaN(charge) && charge > 0) {
    return charge;
  }
  const ask = Number(row.ask_price ?? '');
  return Number.isNaN(ask) ? 0 : ask;
}

/**
 * The display currency symbol for a property.
 * @param row - The property row.
 * @returns A currency prefix.
 */
function currencyOf(row: ManagementPropertyOutput): string {
  return row.ask_currency === 'UZS' ? "so'm " : '$';
}

/**
 * Short date label ("Aug 31, 2026") for the tenant-since caption.
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
 * The accrued vacancy loss for a vacant row (vacant_days × loss/day), or null
 * when the row has no vacancy figures (e.g. rented).
 * @param row - The property row.
 * @returns The accrued loss, or null.
 */
function vacancyLossOf(row: ManagementPropertyOutput): number | null {
  if (row.vacant_days === null || row.vacancy_loss_per_day === null) {
    return null;
  }
  const perDay = Number(row.vacancy_loss_per_day);
  return Number.isNaN(perDay) ? null : row.vacant_days * perDay;
}

/**
 * Sorts rows client-side (the backend fixes ordering to newest-first).
 * @param rows - The rows to sort.
 * @param sort - The sort key.
 * @returns A new sorted array.
 */
function sortRows(rows: ManagementPropertyOutput[], sort: string): ManagementPropertyOutput[] {
  return rows.toSorted((a, b) => {
    if (sort === 'rent_high') {
      return rentOf(b) - rentOf(a);
    }
    if (sort === 'rent_low') {
      return rentOf(a) - rentOf(b);
    }
    if (sort === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sort === 'oldest') {
      return a.created_at.localeCompare(b.created_at);
    }
    return 0;
  });
}

/**
 * Returns a copy of the overrides map with the given ids removed (no in-place
 * delete of dynamic keys).
 * @param overrides - The current overrides.
 * @param ids - The ids to drop.
 * @returns A new overrides map.
 */
function withoutOverrides(overrides: PropertyOverrides, ids: number[]) {
  const drop = new Set(ids);
  const next: PropertyOverrides = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (!drop.has(Number(key))) {
      next[Number(key)] = value;
    }
  }
  return next;
}

/**
 * Builds the four KPI-strip cards from the loaded metrics.
 * @param t - The translator.
 * @param kpis - The KPI bundle.
 * @param view - The active saved-view id (for the clickable card active state).
 * @param onVacant - Handler for the Vacant card.
 * @param onPending - Handler for the Pending card.
 * @returns The KPI items.
 */
function buildKpiItems(
  t: Translator,
  kpis: WorkbenchKpis,
  view: string,
  onVacant: () => void,
  onPending: () => void,
): KpiItem[] {
  const hasChange = kpis.occupancyChange !== 0;
  return [
    {
      id: 'occupancy',
      label: t('kpi_occupancy'),
      value: `${kpis.occupancyRate}%`,
      icon: PieChart,
      delta: hasChange
        ? `${kpis.occupancyChange > 0 ? '+' : ''}${kpis.occupancyChange}`
        : undefined,
      deltaDirection: kpis.occupancyChange >= 0 ? 'up' : 'down',
      deltaTone: kpis.occupancyChange >= 0 ? 'success' : 'danger',
      sublabel: hasChange ? t('kpi_vs_last_month') : undefined,
    },
    {
      id: 'vacant',
      label: t('kpi_vacant_units'),
      value: String(kpis.vacantUnits),
      icon: Building2,
      sublabel: t('kpi_loss_per_day', { amount: formatMoney(kpis.lossPerDay) }),
      onClick: onVacant,
      active: view === 'vacant',
    },
    {
      id: 'avg_rent',
      label: t('kpi_avg_rent'),
      value: formatMoney(kpis.avgRent),
      icon: Coins,
      sublabel: t('kpi_avg_rent_sub'),
    },
    {
      id: 'pending',
      label: t('kpi_pending_review'),
      value: String(kpis.pendingReview),
      icon: ClipboardCheck,
      sublabel: t('kpi_pending_sub'),
      onClick: onPending,
      active: view === 'pending',
    },
  ];
}

/**
 * The Properties Workbench — the list-screen archetype: KPI strip, saved-view
 * tabs, filter toolbar, selectable table with a floating bulk bar, pagination,
 * and an in-flow record panel. The reusable foundation for every Management list
 * screen; wired to the live backend via the properties adapter.
 * @returns The properties workbench page.
 */
export default function ManagementPropertiesPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();
  const router = useRouter();

  const resource = usePaginatedResource<ManagementPropertyOutput>(async ({ page, query }) => {
    const result = await listProperties({
      page,
      // SAFETY: Query parameter indexed as string
      search: query.search as string | undefined,
      // SAFETY: Query parameter indexed as string
      status: query.status as string | undefined,
      // SAFETY: Query parameter indexed as number
      districtId: query.district_id as number | undefined,
      // SAFETY: Query parameter indexed as string
      tariff: query.tariff as string | undefined,
    });
    return result;
  });

  // SAFETY: Query parameter indexed as string
  const search = (resource.query.search as string | undefined) ?? '';
  // SAFETY: Query parameter indexed as string
  const status = resource.query.status as string | undefined;
  // SAFETY: Query parameter indexed as number
  const districtId = resource.query.district_id as number | undefined;
  // SAFETY: Query parameter indexed as string
  const tariff = resource.query.tariff as string | undefined;
  const view = viewFromStatus(status);

  const [price, setPrice] = useState<string | null>(null);
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState<ManagementPropertyOutput | null>(null);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [kpis, setKpis] = useState<WorkbenchKpis | null>(null);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  // Status counts (drive the tab + KPI numbers) refresh with the search term.
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const nextCounts = await getStatusCounts(search || undefined);
        if (!active) {
          return;
        }
        setCounts(nextCounts);
        const nextKpis = await getWorkbenchKpis(nextCounts);
        if (active) {
          setKpis(nextKpis);
        }
      } catch {
        // KPIs are supplementary; the table still renders without them.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [search]);

  // District options for the filter chip (derived once).
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await getDistricts();
        if (active) {
          setDistricts(next);
        }
      } catch {
        // The filter still works without district options.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const statusLabel = (value: string): string => {
    const normalized = value.toLowerCase();
    if (/rent|active|occupied/u.test(normalized)) {
      return t('status_rented');
    }
    if (/maintenance|repair/u.test(normalized)) {
      return t('status_maintenance');
    }
    if (/pending|review/u.test(normalized)) {
      return t('status_pending');
    }
    if (/vacant|available/u.test(normalized)) {
      return t('status_vacant');
    }
    return value.replaceAll('_', ' ');
  };

  const tariffLabel = (value: string): string => {
    if (value === 'standard') {
      return t('tariff_standard');
    }
    if (value === 'comfort') {
      return t('tariff_comfort');
    }
    if (value === 'premium') {
      return t('tariff_premium');
    }
    return value;
  };

  // Apply optimistic status overrides, then the client-only price filter and sort.
  const overridden = resource.data.map((row) => {
    const override = overrides[row.id];
    return override ? { ...row, status: override } : row;
  });
  const range =
    price && price in PRICE_RANGES
      ? // SAFETY: Price key checked against PRICE_RANGES lookup
        PRICE_RANGES[price as keyof typeof PRICE_RANGES]
      : undefined;
  const filteredRows = range
    ? overridden.filter((row) => rentOf(row) >= range[0] && rentOf(row) < range[1])
    : overridden;
  const rows = sortRows(filteredRows, sort);

  const pageIds = rows.map((row) => row.id);
  const selection = useRowSelection(pageIds);

  const openRecord = (row: ManagementPropertyOutput) => setSelected(row);
  const closeRecord = () => setSelected(null);

  const [archiveTarget, setArchiveTarget] = useState<ManagementPropertyOutput | null>(null);

  const confirmArchive = async () => {
    if (!archiveTarget) {
      return;
    }
    const target = archiveTarget;
    setArchiveTarget(null);
    if (selected?.id === target.id) {
      setSelected(null);
    }
    try {
      await deleteProperty(target.id);
      toast.success(t('archive_success'));
      resource.refetch();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t('archive_failed')));
    }
  };

  const changeStatus = (ids: number[], nextStatus: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        next[id] = nextStatus;
      }
      return next;
    });
    selection.clear();
    void bulkChangeStatus(ids, nextStatus)
      .then((result) => {
        setOverrides((prev) => withoutOverrides(prev, ids));
        resource.refetch();
        if (result.failed.length > 0) {
          toast.error(t('status_change_failed'));
          return;
        }
        toast.success(t('status_changed', { count: ids.length, status: statusLabel(nextStatus) }));
      })
      .catch(() => {
        setOverrides((prev) => withoutOverrides(prev, ids));
        resource.refetch();
        toast.error(t('status_change_failed'));
      });
  };

  const savedViews: SavedView[] = SAVED_VIEW_DEFS.map((def) => ({
    id: def.id,
    label: t(def.labelKey),
    count: counts ? counts[def.countKey] : undefined,
  }));

  const chipFilters: ChipFilter[] = [
    {
      id: 'district',
      label: t('filter_district'),
      anyLabel: t('filter_any_district'),
      value: districtId === undefined ? null : String(districtId),
      options: districts.map((district) => ({ value: String(district.id), label: district.name })),
      onChange: (value) => resource.patchQuery({ district_id: value ? Number(value) : undefined }),
    },
    {
      id: 'tariff',
      label: t('filter_tariff'),
      anyLabel: t('filter_any_tariff'),
      value: tariff ?? null,
      options: PROPERTY_TARIFFS.map((value) => ({ value, label: tariffLabel(value) })),
      onChange: (value) => resource.patchQuery({ tariff: value ?? undefined }),
    },
    {
      id: 'price',
      label: t('filter_price'),
      anyLabel: t('filter_any_price'),
      value: price,
      options: [
        { value: '0-400', label: t('price_lt_400') },
        { value: '400-600', label: '$400 – $600' },
        { value: '600-800', label: '$600 – $800' },
        { value: '800+', label: t('price_gt_800') },
      ],
      onChange: setPrice,
    },
  ];

  const activeFilterCount = [districtId, tariff, price].filter(Boolean).length;
  const hasQuery = [search, status, districtId, tariff, price].some(Boolean);

  const clearAll = () => {
    resource.setQuery({ search: search || undefined });
    setPrice(null);
  };

  const sortOptions = [
    { value: 'newest', label: t('sort_newest') },
    { value: 'oldest', label: t('sort_oldest') },
    { value: 'rent_high', label: t('sort_rent_high') },
    { value: 'rent_low', label: t('sort_rent_low') },
    { value: 'name', label: t('sort_name') },
  ];

  // The mobile filter sheet reuses the desktop chip filters plus a Sort group.
  const mobileFilterGroups: FilterGroup[] = [
    ...chipFilters.map((filter) => ({
      id: filter.id,
      label: filter.label,
      options: filter.options,
      value: filter.value,
      onChange: filter.onChange,
    })),
    {
      id: 'sort',
      label: t('sort'),
      options: sortOptions,
      value: sort,
      onChange: (value: string | null) => setSort(value ?? 'newest'),
    },
  ];

  const resetMobileFilters = () => {
    resource.patchQuery({ district_id: undefined, tariff: undefined });
    setPrice(null);
    setSort('newest');
  };

  const columns: WorkbenchColumn<ManagementPropertyOutput>[] = [
    {
      id: 'property',
      header: t('col_property'),
      cell: (row) => (
        <EntityCell
          thumbnail={<PropertyThumbnail src={row.cover_image_url} alt={row.name} />}
          name={row.name}
          secondary={row.address}
        />
      ),
    },
    {
      id: 'district',
      header: t('col_district'),
      width: 130,
      cell: (row) => <span className="text-muted-foreground">{row.district_name}</span>,
    },
    {
      id: 'rooms',
      header: t('col_rooms'),
      width: 96,
      secondary: true,
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.rooms === null ? '—' : t('rooms_count', { count: row.rooms })}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('col_status'),
      width: 132,
      cell: (row) => (
        <StatusPill tone={propertyStatusTone(row.status)} label={statusLabel(row.status)} />
      ),
    },
    {
      id: 'tariff',
      header: t('col_tariff'),
      width: 104,
      secondary: true,
      cell: (row) => <span className="text-muted-foreground">{tariffLabel(row.tariff)}</span>,
    },
    {
      id: 'rent',
      header: t('col_rent'),
      width: 110,
      align: 'right',
      cell: (row) => <NumericCell>{formatMoney(rentOf(row), currencyOf(row))}</NumericCell>,
    },
    {
      id: 'tenant',
      header: t('col_tenant_vacancy'),
      width: 150,
      secondary: true,
      cell: (row) => {
        if (row.tenant_name) {
          return (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-foreground">{row.tenant_name}</span>
              {row.tenant_since ? (
                <span className="truncate text-xs text-muted-foreground">
                  {t('tenant_since_caption', { date: shortDate(row.tenant_since) })}
                </span>
              ) : null}
            </div>
          );
        }
        const loss = vacancyLossOf(row);
        if (loss !== null) {
          return (
            <span className="text-sm font-medium text-warning">
              {t('vacancy_inline', {
                days: row.vacant_days ?? 0,
                amount: formatMoney(loss, currencyOf(row)),
              })}
            </span>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
  ];

  const header = (
    <ManagementPageHeader
      title={t('properties')}
      subtitle={t('properties_subtitle', { count: resource.total })}
      showBell={false}
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-[10px] px-4 shadow-none"
            onClick={() => setImportOpen(true)}
          >
            <FileUp className="size-[17px]" />
            {t('imp_import_csv')}
          </Button>
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-[10px] px-4 shadow-none"
            onClick={() => exportPropertiesCsv(rows, 'properties.csv')}
          >
            <Download className="size-[17px]" />
            {t('export')}
          </Button>
          <Button asChild className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm">
            <Link href="/management/properties/new">
              <Plus className="size-[17px]" />
              {t('add_property')}
            </Link>
          </Button>
        </div>
      }
    />
  );

  const kpi = (
    <div className={selected ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-2 gap-4 md:grid-cols-4'}>
      {kpis
        ? buildKpiItems(
            t,
            kpis,
            view,
            () => resource.patchQuery({ status: statusForView('vacant') }),
            () => resource.patchQuery({ status: statusForView('pending') }),
          ).map((item) => <KpiCard key={item.id} {...item} />)
        : Array.from({ length: 4 }, (_, index) => (
            <div key={`kpi-skeleton-${index}`} className="h-[140px] rounded-[16px] bg-muted/40" />
          ))}
    </div>
  );

  const tabs = (
    <SavedViewTabs
      views={savedViews}
      active={view}
      onChange={(next) => resource.patchQuery({ status: statusForView(next) })}
    />
  );

  const toolbar = (
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
          { value: 'newest', label: t('sort_newest') },
          { value: 'oldest', label: t('sort_oldest') },
          { value: 'rent_high', label: t('sort_rent_high') },
          { value: 'rent_low', label: t('sort_rent_low') },
          { value: 'name', label: t('sort_name') },
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
          placeholder: t('search_properties'),
          aria: t('search_properties_aria'),
          clear: t('search_clear'),
        },
      }}
    />
  );

  const rowActions = (row: ManagementPropertyOutput) => (
    <RowActions
      onOpen={() => openRecord(row)}
      onEdit={() => router.push(`/management/properties/${row.id}/edit`)}
      quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      labels={{ open: t('row_open'), edit: t('row_edit'), more: t('row_more') }}
      menuItems={[
        { id: 'open', label: t('row_open'), onSelect: () => openRecord(row) },
        ...PROPERTY_STATUSES.filter((value) => value !== row.status).map((value) => ({
          id: `status-${value}`,
          label: t('row_set_status', { status: statusLabel(value) }),
          onSelect: () => changeStatus([row.id], value),
        })),
        {
          id: 'archive',
          label: t('row_archive'),
          variant: 'destructive' as const,
          onSelect: () => setArchiveTarget(row),
        },
      ]}
    />
  );

  const emptyBody = hasQuery ? (
    <FilteredEmptyState
      title={t('no_matches')}
      description={t('no_matches_desc')}
      clearLabel={t('clear_filters')}
      onClear={clearAll}
    />
  ) : (
    <FirstRunState
      title={t('first_run_title')}
      description={t('first_run_desc')}
      steps={[
        {
          id: 'add',
          icon: Building2,
          title: t('first_run_step_add'),
          description: t('first_run_step_add_desc'),
        },
        {
          id: 'invite',
          icon: Users,
          title: t('first_run_step_invite'),
          description: t('first_run_step_invite_desc'),
        },
        {
          id: 'import',
          icon: FileUp,
          title: t('first_run_step_import'),
          description: t('first_run_step_import_desc'),
          onClick: () => setImportOpen(true),
        },
      ]}
      action={
        <Button asChild className="h-10 gap-2 rounded-[10px]">
          <Link href="/management/properties/new">
            <Plus className="size-4" />
            {t('add_first_property')}
          </Link>
        </Button>
      }
    />
  );

  const body = ((): React.ReactNode => {
    if (resource.error) {
      return (
        <ErrorState
          title={t('error_title')}
          message={t('error_properties')}
          retryLabel={t('retry')}
          onRetry={() => resource.refetch()}
        />
      );
    }
    if (resource.isLoading) {
      return <WorkbenchTableSkeleton />;
    }
    if (rows.length === 0) {
      return emptyBody;
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
        onOpenRecord={openRecord}
        activeId={selected?.id ?? null}
        dense={Boolean(selected)}
        rowActions={rowActions}
        labels={{ selectAll: t('select_all'), selectRow: t('select_row') }}
      />
    );
  })();

  const showPagination = !resource.isLoading && !resource.error && rows.length > 0;
  const pagination = showPagination ? (
    <WorkbenchPagination
      page={resource.page}
      totalPages={resource.totalPages}
      onPageChange={(p) => resource.setPage(p)}
      summary={t('pagination_summary', {
        from: (resource.page - 1) * 20 + 1,
        to: (resource.page - 1) * 20 + rows.length,
        total: resource.total,
      })}
      labels={{ previous: t('previous'), next: t('next'), perPage: t('per_page') }}
    />
  ) : undefined;

  const bulkBar = (
    <BulkSelectionBar
      open={selection.count > 0}
      countLabel={t('bulk_selected', { count: selection.count })}
      onClear={() => selection.clear()}
      clearLabel={t('bulk_clear')}
      actions={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center rounded-full px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:outline-none"
              >
                {t('bulk_change_status')}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52">
              {PROPERTY_STATUSES.map((value) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => changeStatus([...selection.selected].map(Number), value)}
                >
                  <StatusPill tone={propertyStatusTone(value)} label={statusLabel(value)} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => {
              const chosen = rows.filter((row) => selection.selected.has(row.id));
              exportPropertiesCsv(chosen, 'properties.csv');
            }}
            className="flex h-9 items-center rounded-full px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:outline-none"
          >
            {t('bulk_export')}
          </button>
        </>
      }
    />
  );

  const propertyRecord = (
    <PropertyRecordPanel
      property={selected}
      open={Boolean(selected)}
      onClose={closeRecord}
      onChangeStatus={(next) => {
        if (selected) {
          changeStatus([selected.id], next);
        }
      }}
      statusLabel={statusLabel}
      tariffLabel={tariffLabel}
    />
  );

  const archiveDialog = (
    <DangerConfirmDialog
      open={archiveTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setArchiveTarget(null);
        }
      }}
      title={t('archive_title')}
      description={t('archive_desc', { name: archiveTarget?.name ?? '' })}
      consequences={[
        t('archive_conseq_market'),
        t('archive_conseq_leads'),
        t('archive_conseq_history'),
      ]}
      confirmPhrase={archiveTarget?.name ?? ''}
      typeLabel={t('archive_type_label')}
      confirmLabel={t('archive_confirm')}
      cancelLabel={t('cancel')}
      onConfirm={confirmArchive}
    />
  );

  if (isMobile) {
    return (
      <>
        <PropertiesMobileView
          t={t}
          title={t('properties')}
          subtitle={t('properties_subtitle', { count: resource.total })}
          searchPlaceholder={t('search_properties')}
          addLabel={t('add_property')}
          rows={rows}
          chips={savedViews.map((v) => ({ id: v.id, label: v.label, count: v.count }))}
          activeChip={view}
          onChip={(next) => resource.patchQuery({ status: statusForView(next) })}
          search={search}
          onSearch={(value) => resource.patchQuery({ search: value || undefined })}
          statusLabel={statusLabel}
          onOpen={openRecord}
          onAdd={() => router.push('/management/properties/new')}
          record={selected ? propertyRecord : undefined}
          onCloseRecord={closeRecord}
          empty={body}
          filterGroups={mobileFilterGroups}
          activeFilterCount={activeFilterCount}
          onResetFilters={resetMobileFilters}
        />
        {archiveDialog}
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={() => resource.refetch()}
        />
      </>
    );
  }

  return (
    <>
      <WorkbenchShell
        header={header}
        kpi={kpi}
        tabs={tabs}
        toolbar={toolbar}
        pagination={pagination}
        panel={propertyRecord}
        bulkBar={bulkBar}
      >
        {body}
      </WorkbenchShell>
      {archiveDialog}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => resource.refetch()}
      />
    </>
  );
}

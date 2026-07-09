'use client';

import { Check, Download, Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { EntityCell } from '@/components/management/columns/EntityCell';
import { RowActions } from '@/components/management/columns/RowActions';
import { roleTone, StatusPill, userStatusTone } from '@/components/management/columns/StatusPill';
import { EditUserDialog, InviteUserDialog } from '@/components/management/dialogs/UserDialogs';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { UsersMobileView } from '@/components/management/mobile/UsersMobileView';
import { UserRecordPanel } from '@/components/management/record-panel/UserRecordPanel';
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
import {
  exportUsersCsv,
  getUserRoleCounts,
  listUsers,
  relativeTimeFromNow,
  updateUser,
  USER_ROLES,
} from '@/libs/management/usersAdapter';
import type { UserRoleCounts } from '@/libs/management/usersAdapter';
import type { UserOutput } from '@/types/management';

const SAVED_VIEW_DEFS = [
  { id: 'all', labelKey: 'usr_view_all', countKey: 'all' },
  { id: 'mgmt', labelKey: 'usr_view_mgmt', countKey: 'mgmt' },
  { id: 'owner', labelKey: 'usr_view_owner', countKey: 'owner' },
  { id: 'tenant', labelKey: 'usr_view_tenant', countKey: 'tenant' },
  { id: 'agent', labelKey: 'usr_view_agent', countKey: 'agent' },
] as const satisfies { id: string; labelKey: string; countKey: keyof UserRoleCounts }[];

/**
 * The full display name of a user ("first last").
 * @param user - The user record.
 * @returns The full name, falling back to the username.
 */
function fullName(user: UserOutput): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username;
}

/**
 * Maps a stored boolean-string filter to its chip value.
 * @param raw - The stored value ('true' | 'false' | undefined).
 * @param onValue - Chip value when the filter is true.
 * @param offValue - Chip value when the filter is false.
 * @returns The chip value, or null when the filter is unset.
 */
function boolFilterValue(
  raw: string | undefined,
  onValue: string,
  offValue: string,
): string | null {
  if (raw === undefined) {
    return null;
  }
  return raw === 'true' ? onValue : offValue;
}

/**
 * Maps a chosen chip value back to the stored boolean-string filter.
 * @param value - The chosen chip value, or null when cleared.
 * @param onValue - The chip value that maps to 'true'.
 * @returns 'true', 'false', or undefined when cleared.
 */
function boolFilterQuery(value: string | null, onValue: string): string | undefined {
  if (value === null) {
    return undefined;
  }
  return value === onValue ? 'true' : 'false';
}

/**
 * The Users Workbench — the accounts list across all roles: role saved-view
 * tabs, a filter toolbar (role / verified / status, server-driven), a selectable
 * table with a floating bulk bar, pagination, an in-flow user record panel, and
 * the invite / edit dialogs. No KPI strip. Wired to the live backend.
 * @returns The users workbench page.
 */
export default function ManagementUsersPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();

  const resource = usePaginatedResource<UserOutput>(
    async ({ page, query }) =>
      await listUsers({
        page,
        search: query.search as string | undefined,
        role: query.role as string | undefined,
        isActive: query.is_active === undefined ? undefined : query.is_active === 'true',
        isVerified: query.is_verified === undefined ? undefined : query.is_verified === 'true',
      }),
    { initialQuery: {} },
  );

  const search = (resource.query.search as string | undefined) ?? '';
  const role = resource.query.role as string | undefined;
  const isActive = resource.query.is_active as string | undefined;
  const isVerified = resource.query.is_verified as string | undefined;
  const view = role ?? 'all';

  const [sort, setSort] = useState('recent');
  const [selected, setSelected] = useState<UserOutput | null>(null);
  const [counts, setCounts] = useState<UserRoleCounts | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserOutput | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const nextCounts = await getUserRoleCounts(search || undefined);
        if (active) {
          setCounts(nextCounts);
        }
      } catch {
        // Counts are supplementary; the table renders without them.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [search]);

  const roleLabel = (value: string): string => t(`usr_role_${value}` as 'usr_role_mgmt');
  const statusLabel = (value: boolean): string =>
    value ? t('usr_status_active') : t('usr_status_deactivated');

  const activeLabel = (iso: string): string => {
    const rel = relativeTimeFromNow(iso);
    if (rel.unit === 'today') {
      return t('usr_active_today');
    }
    return t(`usr_active_${rel.unit}` as 'usr_active_days', { count: rel.count });
  };

  // Client-side sort over the loaded page (server handles filtering/paging).
  const rows = resource.data.toSorted((a, b) => {
    if (sort === 'name') {
      return fullName(a).localeCompare(fullName(b));
    }
    if (sort === 'oldest') {
      return a.updated_at.localeCompare(b.updated_at);
    }
    return b.updated_at.localeCompare(a.updated_at);
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
      id: 'role',
      label: t('usr_filter_role'),
      anyLabel: t('usr_filter_any_role'),
      value: role ?? null,
      options: USER_ROLES.map((value) => ({ value, label: roleLabel(value) })),
      onChange: (value) => resource.patchQuery({ role: value ?? undefined }),
    },
    {
      id: 'verified',
      label: t('usr_filter_verified'),
      anyLabel: t('usr_filter_any_verified'),
      value: boolFilterValue(isVerified, 'yes', 'no'),
      options: [
        { value: 'yes', label: t('usr_verified_yes') },
        { value: 'no', label: t('usr_verified_no') },
      ],
      onChange: (value) => resource.patchQuery({ is_verified: boolFilterQuery(value, 'yes') }),
    },
    {
      id: 'status',
      label: t('usr_filter_status'),
      anyLabel: t('usr_filter_any_status'),
      value: boolFilterValue(isActive, 'active', 'deactivated'),
      options: [
        { value: 'active', label: t('usr_status_active') },
        { value: 'deactivated', label: t('usr_status_deactivated') },
      ],
      onChange: (value) => resource.patchQuery({ is_active: boolFilterQuery(value, 'active') }),
    },
  ];

  const activeFilterCount = [
    Boolean(role),
    isVerified !== undefined,
    isActive !== undefined,
  ].filter(Boolean).length;
  const hasQuery =
    Boolean(search) || view !== 'all' || isVerified !== undefined || isActive !== undefined;

  const clearAll = () => {
    resource.setQuery({ search: search || undefined });
  };

  const toggleActive = async (row: UserOutput) => {
    try {
      await updateUser(row.id, { is_active: !row.is_active });
      toast.success(row.is_active ? t('usr_deactivated') : t('usr_activated'));
      resource.refetch();
    } catch {
      toast.error(t('usr_toggle_failed'));
    }
  };

  const columns: WorkbenchColumn<UserOutput>[] = [
    {
      id: 'user',
      header: t('usr_col_user'),
      cell: (row) => (
        <EntityCell
          thumbnail={<AvatarInitials name={fullName(row)} size={40} />}
          name={fullName(row)}
          secondary={row.email}
        />
      ),
    },
    {
      id: 'role',
      header: t('usr_col_role'),
      width: 130,
      cell: (row) => <StatusPill tone={roleTone(row.role)} label={roleLabel(row.role)} />,
    },
    {
      id: 'phone',
      header: t('usr_col_phone'),
      width: 150,
      secondary: true,
      cell: (row) => <span className="truncate text-muted-foreground">{row.phone || '—'}</span>,
    },
    {
      id: 'verified',
      header: t('usr_col_verified'),
      width: 120,
      cell: (row) =>
        row.is_verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-subtle-foreground">
            <Check className="size-3.5" />
            {t('usr_verified')}
          </span>
        ) : (
          <StatusPill tone="neutral" label="—" />
        ),
    },
    {
      id: 'active',
      header: t('usr_col_last_active'),
      width: 140,
      secondary: true,
      cell: (row) => <span className="text-muted-foreground">{activeLabel(row.updated_at)}</span>,
    },
    {
      id: 'status',
      header: t('usr_col_status'),
      width: 130,
      cell: (row) => (
        <StatusPill tone={userStatusTone(row.is_active)} label={statusLabel(row.is_active)} />
      ),
    },
  ];

  const rowActions = (row: UserOutput) => (
    <RowActions
      onOpen={() => setSelected(row)}
      quickClassName="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      labels={{ open: t('row_open'), edit: t('usr_edit'), more: t('row_more') }}
      onEdit={() => setEditTarget(row)}
      menuItems={[
        { id: 'open', label: t('row_open'), onSelect: () => setSelected(row) },
        { id: 'edit', label: t('usr_edit'), onSelect: () => setEditTarget(row) },
        {
          id: 'toggle',
          label: row.is_active ? t('usr_deactivate') : t('usr_activate'),
          variant: row.is_active ? 'destructive' : 'default',
          separatorBefore: true,
          onSelect: () => void toggleActive(row),
        },
      ]}
    />
  );

  const body = ((): React.ReactNode => {
    if (resource.error) {
      return (
        <ErrorState
          title={t('error_title')}
          message={t('usr_error')}
          retryLabel={t('retry')}
          onRetry={resource.refetch}
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
          onClear={clearAll}
        />
      ) : (
        <EmptyState
          icon={Users}
          title={t('usr_empty')}
          description={t('usr_empty_desc')}
          action={
            <Button className="h-9 gap-2 rounded-[10px]" onClick={() => setInviteOpen(true)}>
              <Plus className="size-4" />
              {t('usr_invite')}
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
  })();

  const showPagination = !resource.isLoading && !resource.error && rows.length > 0;

  const userRecord = (
    <UserRecordPanel
      user={selected}
      open={Boolean(selected)}
      onClose={() => setSelected(null)}
      onEdit={() => selected && setEditTarget(selected)}
      roleLabel={roleLabel}
      statusLabel={statusLabel}
      onToggleActive={() => {
        setSelected((prev) => (prev ? { ...prev, is_active: !prev.is_active } : prev));
        resource.refetch();
      }}
    />
  );

  const dialogs = (
    <>
      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={resource.refetch}
      />
      <EditUserDialog
        key={editTarget?.id}
        user={editTarget}
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSuccess={resource.refetch}
      />
    </>
  );

  if (isMobile) {
    return (
      <>
        <UsersMobileView
          t={t}
          title={t('usr_title')}
          subtitle={t('usr_subtitle', { all: counts?.all ?? resource.total })}
          searchPlaceholder={t('usr_search')}
          rows={rows}
          chips={savedViews.map((v) => ({ id: v.id, label: v.label, count: v.count }))}
          activeChip={view}
          onChip={(next) =>
            resource.patchQuery({
              role: next === 'all' ? undefined : next,
              search: search || undefined,
            })
          }
          search={search}
          onSearch={(value) => resource.patchQuery({ search: value || undefined })}
          roleLabel={roleLabel}
          statusLabel={statusLabel}
          onOpen={setSelected}
          record={selected ? userRecord : undefined}
          onCloseRecord={() => setSelected(null)}
          empty={body}
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
            title={t('usr_title')}
            subtitle={t('usr_subtitle', { all: counts?.all ?? resource.total })}
            showBell={false}
            actions={
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-[10px] px-4 shadow-none"
                  onClick={() => exportUsersCsv(rows, 'users.csv')}
                >
                  <Download className="size-[17px]" />
                  {t('export')}
                </Button>
                <Button
                  className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
                  onClick={() => setInviteOpen(true)}
                >
                  <Plus className="size-[17px]" />
                  {t('usr_invite')}
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
            onChange={(next) =>
              resource.patchQuery({
                role: next === 'all' ? undefined : next,
                search: search || undefined,
              })
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
                { value: 'recent', label: t('usr_sort_recent') },
                { value: 'name', label: t('usr_sort_name') },
                { value: 'oldest', label: t('usr_sort_oldest') },
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
                placeholder: t('usr_search'),
                aria: t('usr_search_aria'),
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
              summary={t('usr_pagination', {
                from: (resource.page - 1) * 20 + 1,
                to: (resource.page - 1) * 20 + rows.length,
                total: resource.total,
              })}
              labels={{ previous: t('previous'), next: t('next'), perPage: t('per_page') }}
            />
          ) : undefined
        }
        panel={userRecord}
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
                  exportUsersCsv(chosen, 'users.csv');
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
      {dialogs}
    </>
  );
}

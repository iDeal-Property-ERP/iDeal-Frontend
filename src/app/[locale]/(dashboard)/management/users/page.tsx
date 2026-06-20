'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch } from '@/libs/api';
import { roleVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { Role } from '@/types/enums';
import type { UserOutput } from '@/types/management';

const ROLES: Role[] = ['mgmt', 'owner', 'tenant', 'agent'];

/**
 * Management users page — lists all users and links to per-user detail/edit.
 * @returns The management users page component.
 */
export default function ManagementUsersPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<UserOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page };
    if (search) {
      query.search = search;
    }
    if (roleFilter) {
      query.role = roleFilter;
    }

    apiFetch<PaginatedData<UserOutput>>('/management/users/', { query })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load users');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, search, roleFilter]);

  if (error) {
    return (
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const columns: ColumnDef<UserOutput>[] = [
    {
      id: 'name',
      header: 'Name',
      enableSorting: false,
      cell: ({ row }) =>
        `${row.original.first_name} ${row.original.last_name}${row.original.patronymic ? ` ${row.original.patronymic}` : ''}`,
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={roleVariant(row.original.role)}>{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'danger'}>
          {row.original.is_active ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('users')} description={t('users_desc')} />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No users found"
        rowHref={(row) => `/management/users/${row.id}`}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              aria-label="Search users"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="sm:w-80"
            />
            <Select
              value={roleFilter || 'all'}
              onValueChange={(v) => {
                setRoleFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-auto min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}

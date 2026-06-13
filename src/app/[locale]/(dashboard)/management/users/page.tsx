'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { Role } from '@/types/enums';
import type { UserOutput, UserUpdatePayload } from '@/types/management';

const ROLE_VARIANT: Record<string, 'info' | 'warning' | 'default'> = {
  mgmt: 'info',
  owner: 'warning',
  tenant: 'default',
  agent: 'info',
};

const ROLES: Role[] = ['mgmt', 'owner', 'tenant', 'agent'];

function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

export default function ManagementUsersPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<UserOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<UserOutput | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleSave = () => {
    if (!editingUser) {
      return;
    }
    setSaving(true);
    const payload: UserUpdatePayload = {
      is_active: editingUser.is_active,
      is_verified: editingUser.is_verified,
      role: editingUser.role,
    };
    apiFetch<UserOutput>(`/management/users/${editingUser.id}/`, {
      method: 'PATCH',
      body: payload,
    })
      .then((updated) => {
        setData((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setEditingUser(null);
      })
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to update user');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('users')} description={t('users_desc')} />

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (user: UserOutput) =>
              `${user.first_name} ${user.last_name}${user.patronymic ? ` ${user.patronymic}` : ''}`,
          },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone' },
          {
            key: 'role',
            header: 'Role',
            render: (user: UserOutput) => (
              <Badge variant={ROLE_VARIANT[user.role]}>{user.role}</Badge>
            ),
          },
          {
            key: 'is_active',
            header: 'Active',
            render: (user: UserOutput) => (
              <Badge variant={user.is_active ? 'success' : 'danger'}>
                {user.is_active ? 'Yes' : 'No'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'w-24',
            render: (user: UserOutput) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingUser(user);
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No users found"
        keyExtractor={(item) => item.id}
        onRowClick={(item: unknown) => {
          const user = item as UserOutput;
          if (user && typeof user === 'object' && 'id' in user) {
            setEditingUser(user);
          }
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              aria-label="Search users"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-80"
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Edit User &mdash; {editingUser.first_name} {editingUser.last_name}
            </h2>
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editingUser.is_active}
                  onChange={(e) => {
                    setEditingUser({
                      ...editingUser,
                      is_active: e.target.checked,
                    });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editingUser.is_verified}
                  onChange={(e) => {
                    setEditingUser({
                      ...editingUser,
                      is_verified: e.target.checked,
                    });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Verified</span>
              </label>
              <div>
                <label className="mb-1 block text-sm text-gray-700">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (isRole(value)) {
                      setEditingUser({
                        ...editingUser,
                        role: value,
                      });
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

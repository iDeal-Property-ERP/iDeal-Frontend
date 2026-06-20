'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/libs/api';
import { roleVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { Role } from '@/types/enums';
import type { UserOutput, UserUpdatePayload } from '@/types/management';

const ROLES: Role[] = ['mgmt', 'owner', 'tenant', 'agent'];

function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

/**
 * Management users page — lists all users and allows editing role/status.
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
      <div className="rounded-lg border border-danger/30 bg-danger-subtle p-4 text-danger">
        {error}
      </div>
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
              <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingUser(user);
                }}
              >
                Edit
              </Button>
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
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground">
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
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Active</span>
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
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Verified</span>
              </label>
              <div>
                <label htmlFor="edit-user-role" className="mb-1 block text-sm text-foreground">
                  Role
                </label>
                <Select
                  id="edit-user-role"
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
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingUser(null);
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="default" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

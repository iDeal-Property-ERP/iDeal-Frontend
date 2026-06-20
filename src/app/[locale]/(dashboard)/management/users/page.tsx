'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/DataTable';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        toast.success('User updated');
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
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setEditingUser(row.original);
          }}
        >
          Edit
        </Button>
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

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
      >
        <DialogContent>
          {editingUser && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Edit User &mdash; {editingUser.first_name} {editingUser.last_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="edit-user-active"
                    checked={editingUser.is_active}
                    onCheckedChange={(checked) => {
                      setEditingUser({
                        ...editingUser,
                        is_active: checked === true,
                      });
                    }}
                  />
                  <Label htmlFor="edit-user-active">Active</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="edit-user-verified"
                    checked={editingUser.is_verified}
                    onCheckedChange={(checked) => {
                      setEditingUser({
                        ...editingUser,
                        is_verified: checked === true,
                      });
                    }}
                  />
                  <Label htmlFor="edit-user-verified">Verified</Label>
                </div>
                <div>
                  <Label htmlFor="edit-user-role" className="mb-1 block">
                    Role
                  </Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => {
                      if (isRole(value)) {
                        setEditingUser({
                          ...editingUser,
                          role: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="edit-user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
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
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

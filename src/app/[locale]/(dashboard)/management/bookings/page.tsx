'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
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
import type { PaginatedData } from '@/types/api';
import type { ManagementBookingOutput } from '@/types/marketplace';

const STATUSES = ['', 'requested', 'approved', 'rejected', 'converted', 'cancelled'];

/**
 * Management bookings queue: approve, reject, and convert bookings to leases.
 * @returns Management bookings page.
 */
export default function ManagementBookingsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementBookingOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [reload, setReload] = useState(0);
  const [converting, setConverting] = useState<ManagementBookingOutput | null>(null);
  const [rent, setRent] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    apiFetch<PaginatedData<ManagementBookingOutput>>('/management/bookings/', { query })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter, reload]);

  async function act(id: number, action: 'approve' | 'reject') {
    try {
      await apiFetch(`/management/bookings/${id}/${action}/`, { method: 'POST' });
      setReload((n) => n + 1);
    } catch {
      void 0;
    }
  }

  async function convert() {
    if (!converting) {
      return;
    }
    try {
      await apiFetch(`/management/bookings/${converting.id}/convert/`, {
        method: 'POST',
        body: { monthly_rent: rent || undefined },
      });
      setConverting(null);
      setRent('');
      setReload((n) => n + 1);
    } catch {
      void 0;
    }
  }

  const columns: ColumnDef<ManagementBookingOutput>[] = [
    { accessorKey: 'tenant_name', header: 'Tenant' },
    { accessorKey: 'property_name', header: 'Property' },
    { accessorKey: 'requested_start_date', header: 'From' },
    { accessorKey: 'requested_end_date', header: 'To' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex gap-2">
            {b.status === 'requested' ? (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    act(b.id, 'approve').catch(() => {
                      void 0;
                    });
                  }}
                >
                  {t('booking_approve')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    act(b.id, 'reject').catch(() => {
                      void 0;
                    });
                  }}
                >
                  {t('booking_reject')}
                </Button>
              </>
            ) : null}
            {b.status === 'approved' ? (
              <Button
                size="sm"
                onClick={() => {
                  setConverting(b);
                  setRent('');
                }}
              >
                {t('booking_convert')}
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('bookings')} description={t('bookings_desc')} />

      {converting ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="grid gap-1.5">
              <Label htmlFor="monthly_rent">{t('booking_monthly_rent')}</Label>
              <Input
                id="monthly_rent"
                value={rent}
                placeholder={converting.monthly_rent_offer ?? ''}
                onChange={(e) => {
                  setRent(e.target.value);
                }}
              />
            </div>
          </div>
          <Button
            onClick={() => {
              convert().catch(() => {
                void 0;
              });
            }}
          >
            {t('booking_confirm_convert')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConverting(null);
            }}
          >
            {t('onboarding_cancel')}
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No bookings found"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-auto min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.filter(Boolean).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}

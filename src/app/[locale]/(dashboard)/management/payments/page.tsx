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
import { paymentStatusVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { ManagementPaymentOutput } from '@/types/management';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
};

const STATUSES = ['', 'paid', 'pending', 'overdue', 'cancelled'];
const METHODS = ['', 'cash', 'bank_transfer', 'online'];

/**
 * Management payments page — lists all payments with filtering.
 * @returns The management payments page component.
 */
export default function ManagementPaymentsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementPaymentOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [leaseId, setLeaseId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (methodFilter) {
      query.method = methodFilter;
    }
    if (leaseId) {
      query.lease_id = leaseId;
    }
    if (tenantId) {
      query.tenant_id = tenantId;
    }
    if (dateFrom) {
      query.date_from = dateFrom;
    }
    if (dateTo) {
      query.date_to = dateTo;
    }

    apiFetch<PaginatedData<ManagementPaymentOutput>>('/management/payments/', {
      query,
    })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load payments');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter, methodFilter, leaseId, tenantId, dateFrom, dateTo]);

  if (error) {
    return (
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const columns: ColumnDef<ManagementPaymentOutput>[] = [
    { accessorKey: 'tenant_name', header: 'Tenant' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `${row.original.amount} ${row.original.currency}`,
    },
    { accessorKey: 'due_date', header: 'Due Date' },
    {
      accessorKey: 'payment_date',
      header: 'Payment Date',
      cell: ({ row }) => row.original.payment_date || '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={paymentStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => METHOD_LABELS[row.original.method] ?? row.original.method,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('payments')} description={t('payments_desc')} />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No payments found"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
            <Select
              value={methodFilter || 'all'}
              onValueChange={(v) => {
                setMethodFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-auto min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {METHODS.filter(Boolean).map((m) => (
                  <SelectItem key={m} value={m}>
                    {METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Lease ID..."
              value={leaseId}
              onChange={(e) => {
                setLeaseId(e.target.value);
                setPage(1);
              }}
              className="sm:w-28"
            />
            <Input
              type="text"
              placeholder="Tenant ID..."
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setPage(1);
              }}
              className="sm:w-28"
            />
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            />
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            />
          </div>
        }
      />
    </div>
  );
}

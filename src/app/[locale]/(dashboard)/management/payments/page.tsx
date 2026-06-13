'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ManagementPaymentOutput } from '@/types/management';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  cancelled: 'danger',
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
};

const STATUSES = ['', 'paid', 'pending', 'overdue', 'cancelled'];
const METHODS = ['', 'cash', 'bank_transfer', 'online'];

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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('payments')} description={t('payments_desc')} />

      <DataTable
        columns={[
          { key: 'tenant_name', header: 'Tenant' },
          {
            key: 'amount',
            header: 'Amount',
            render: (pmt: ManagementPaymentOutput) => `${pmt.amount} ${pmt.currency}`,
          },
          { key: 'due_date', header: 'Due Date' },
          {
            key: 'payment_date',
            header: 'Payment Date',
            render: (pmt: ManagementPaymentOutput) => pmt.payment_date || '—',
          },
          {
            key: 'status',
            header: 'Status',
            render: (pmt: ManagementPaymentOutput) => (
              <Badge variant={STATUS_VARIANT[pmt.status]}>{pmt.status}</Badge>
            ),
          },
          {
            key: 'method',
            header: 'Method',
            render: (pmt: ManagementPaymentOutput) => METHOD_LABELS[pmt.method] ?? pmt.method,
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No payments found"
        keyExtractor={(item) => item.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || 'All statuses'}
                </option>
              ))}
            </select>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m ? METHOD_LABELS[m] : 'All methods'}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Lease ID..."
              value={leaseId}
              onChange={(e) => {
                setLeaseId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-28"
            />
            <input
              type="text"
              placeholder="Tenant ID..."
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-28"
            />
            <input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        }
      />
    </div>
  );
}

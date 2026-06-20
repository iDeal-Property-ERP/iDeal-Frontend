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
import { leaseStatusVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { ManagementAgreementOutput } from '@/types/management';

const STATUSES = ['', 'active', 'expired', 'terminated'];

/**
 * Management owner agreements page — lists all owner agreements with filtering.
 * @returns The management agreements page component.
 */
export default function ManagementAgreementsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementAgreementOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [propertyId, setPropertyId] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (ownerId) {
      query.owner_id = ownerId;
    }
    if (propertyId) {
      query.property_id = propertyId;
    }

    apiFetch<PaginatedData<ManagementAgreementOutput>>('/management/owner-agreements/', { query })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load agreements');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter, ownerId, propertyId]);

  if (error) {
    return (
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const columns: ColumnDef<ManagementAgreementOutput>[] = [
    { accessorKey: 'property_name', header: 'Property' },
    { accessorKey: 'owner_name', header: 'Owner' },
    { accessorKey: 'agreement_number', header: 'Agreement #' },
    {
      id: 'dates',
      header: 'Dates',
      enableSorting: false,
      cell: ({ row }) => `${row.original.start_date} – ${row.original.end_date}`,
    },
    {
      accessorKey: 'commission_rate',
      header: 'Commission',
      cell: ({ row }) => `${Number.parseFloat(row.original.commission_rate) * 100}%`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={leaseStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('owner_agreements')} description={t('owner_agreements_desc')} />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No agreements found"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
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
            <Input
              type="text"
              placeholder="Owner ID..."
              value={ownerId}
              onChange={(e) => {
                setOwnerId(e.target.value);
                setPage(1);
              }}
              className="sm:w-36"
            />
            <Input
              type="text"
              placeholder="Property ID..."
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setPage(1);
              }}
              className="sm:w-36"
            />
          </div>
        }
      />
    </div>
  );
}

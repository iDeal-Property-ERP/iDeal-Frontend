'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ManagementAgreementOutput } from '@/types/management';

const STATUS_VARIANT: Record<string, 'success' | 'danger'> = {
  active: 'success',
  expired: 'danger',
  terminated: 'danger',
};

const STATUSES = ['', 'active', 'expired', 'terminated'];

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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('owner_agreements')} description={t('owner_agreements_desc')} />

      <DataTable
        columns={[
          { key: 'property_name', header: 'Property' },
          { key: 'owner_name', header: 'Owner' },
          { key: 'agreement_number', header: 'Agreement #' },
          {
            key: 'dates',
            header: 'Dates',
            render: (agr: ManagementAgreementOutput) => `${agr.start_date} – ${agr.end_date}`,
          },
          {
            key: 'commission_rate',
            header: 'Commission',
            render: (agr: ManagementAgreementOutput) =>
              `${Number.parseFloat(agr.commission_rate) * 100}%`,
          },
          {
            key: 'status',
            header: 'Status',
            render: (agr: ManagementAgreementOutput) => (
              <Badge variant={STATUS_VARIANT[agr.status]}>{agr.status}</Badge>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No agreements found"
        keyExtractor={(item) => item.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
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
            <input
              type="text"
              placeholder="Owner ID..."
              value={ownerId}
              onChange={(e) => {
                setOwnerId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-36"
            />
            <input
              type="text"
              placeholder="Property ID..."
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-36"
            />
          </div>
        }
      />
    </div>
  );
}

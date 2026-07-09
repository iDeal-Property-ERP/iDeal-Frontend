'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { OwnerEarningsOutput, OwnerPropertyOutput } from '@/types/owner';

/**
 * Owner dashboard page showing earnings summary and property list.
 * @returns Dashboard page element.
 */
export default function OwnerDashboardPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [earnings, setEarnings] = useState<OwnerEarningsOutput | null>(null);
  const [properties, setProperties] = useState<OwnerPropertyOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<OwnerEarningsOutput>('/owner/earnings/'),
      // Must request a page: /owner/properties/ only returns the paginated
      // { page: { object_list } } shape when a page param is present.
      apiFetch<PaginatedData<OwnerPropertyOutput>>('/owner/properties/', { query: { page: 1 } }),
    ])
      .then(([e, p]) => {
        setEarnings(e);
        setProperties(p.page.object_list);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const propColumns: ColumnDef<OwnerPropertyOutput>[] = [
    { accessorKey: 'name', header: t('col_property') },
    { accessorKey: 'address', header: t('col_address') },
    { accessorKey: 'status', header: t('col_status') },
    { accessorKey: 'tariff', header: t('col_tariff') },
    { accessorKey: 'vacant_days', header: t('col_vacant_days') },
  ];

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{t('load_error')}</p>;
  }

  return (
    <>
      <PageHeader
        title={t('owner_dashboard')}
        description={t('owner_dashboard_desc')}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              router.push('/owner/properties');
            }}
          >
            {t('all_properties')}
          </Button>
        }
      />
      {earnings ? (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatsCard
            title={t('total_guaranteed')}
            value={`${earnings.total_guaranteed} ${earnings.currency}`}
          />
          <StatsCard
            title={t('total_paid')}
            value={`${earnings.total_paid} ${earnings.currency}`}
            variant="success"
          />
          <StatsCard
            title={t('total_pending')}
            value={`${earnings.total_pending} ${earnings.currency}`}
            variant="warning"
          />
        </div>
      ) : null}
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t('your_properties')}</h2>
      <DataTable
        columns={propColumns}
        data={properties}
        rowHref={(item) => `/properties/${item.id}`}
      />
    </>
  );
}

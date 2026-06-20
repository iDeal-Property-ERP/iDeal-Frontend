'use client';

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

  useEffect(() => {
    Promise.all([
      apiFetch<OwnerEarningsOutput>('/owner/earnings/'),
      apiFetch<PaginatedData<OwnerPropertyOutput>>('/owner/properties/'),
    ])
      .then(([e, p]) => {
        setEarnings(e);
        setProperties(p.page.object_list);
      })
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const propColumns = [
    { key: 'name', header: 'Property', sortable: true },
    { key: 'address', header: 'Address' },
    { key: 'status', header: 'Status' },
    { key: 'tariff', header: 'Tariff' },
    { key: 'vacant_days', header: 'Vacant Days' },
  ];

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
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
            All Properties
          </Button>
        }
      />
      {earnings ? (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatsCard
            title="Total Guaranteed"
            value={`${earnings.total_guaranteed} ${earnings.currency}`}
          />
          <StatsCard
            title="Total Paid"
            value={`${earnings.total_paid} ${earnings.currency}`}
            variant="success"
          />
          <StatsCard
            title="Total Pending"
            value={`${earnings.total_pending} ${earnings.currency}`}
            variant="warning"
          />
        </div>
      ) : null}
      <h2 className="mb-4 text-lg font-semibold text-foreground">Your Properties</h2>
      <DataTable
        columns={propColumns}
        data={properties}
        keyExtractor={(item) => String(item.id)}
        rowHref={(item) => `/properties/${item.id}`}
      />
    </>
  );
}

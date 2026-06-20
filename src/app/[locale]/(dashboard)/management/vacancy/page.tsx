'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';

type VacancyRow = {
  property_id: number;
  property_name: string;
  district_name: string;
  tenant_charge_price: string;
  currency: string;
  vacant_since: string | null;
  vacant_days: number;
  daily_loss: string;
  accrued_loss: string;
};

type VacancyReport = {
  vacant_count: number;
  total_daily_loss: string;
  total_accrued_loss: string;
  properties: VacancyRow[];
};

/**
 * Vacancy-cost report: per-property revenue loss from vacant units.
 * @returns Vacancy cost page.
 */
export default function VacancyCostPage() {
  const t = useTranslations('Pages');
  const [report, setReport] = useState<VacancyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<VacancyReport>('/management/vacancy/')
      .then(setReport)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t('vacancy_cost')} description={t('vacancy_cost_desc')} />

      {report ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title={t('vacancy_count')} value={report.vacant_count} />
          <StatsCard
            title={t('vacancy_daily_loss')}
            value={report.total_daily_loss}
            variant="danger"
          />
          <StatsCard
            title={t('vacancy_accrued_loss')}
            value={report.total_accrued_loss}
            variant="danger"
          />
        </div>
      ) : null}

      <DataTable
        columns={[
          { key: 'property_name', header: 'Property' },
          { key: 'district_name', header: 'District' },
          { key: 'vacant_days', header: 'Vacant days' },
          {
            key: 'daily_loss',
            header: 'Daily loss',
            render: (r: VacancyRow) => `${r.daily_loss} ${r.currency}`,
          },
          {
            key: 'accrued_loss',
            header: 'Accrued loss',
            render: (r: VacancyRow) => `${r.accrued_loss} ${r.currency}`,
          },
        ]}
        data={report?.properties ?? []}
        isLoading={loading}
        emptyMessage="No vacant properties"
        keyExtractor={(item) => item.property_id}
      />
    </div>
  );
}

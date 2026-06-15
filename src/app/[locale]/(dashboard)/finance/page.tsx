'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { FinanceDashboardOutput } from '@/types/finance-extras';

/**
 * Renders the finance dashboard with summary stats and navigation actions.
 * @returns Finance dashboard page element.
 */
export default function FinancePage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<FinanceDashboardOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<FinanceDashboardOutput>('/finance/dashboard/')
      .then(setData)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!data) {
    return <p className="text-sm text-danger">Failed to load dashboard</p>;
  }

  return (
    <>
      <PageHeader
        title={t('finance')}
        description={t('finance_desc')}
        actions={
          <div className="flex gap-2">
            <Button
              intent="outline"
              onClick={() => {
                router.push('/finance/payments');
              }}
            >
              Payments
            </Button>
            <Button
              intent="outline"
              onClick={() => {
                router.push('/finance/payouts');
              }}
            >
              Payouts
            </Button>
            <Button
              intent="outline"
              onClick={() => {
                router.push('/finance/pnl');
              }}
            >
              P&amp;L
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatsCard title="Total Payments" value={`${data.total_payments} UZS`} />
        <StatsCard title="Total Payouts" value={`${data.total_payouts} UZS`} />
        <StatsCard title="Net Margin" value={`${data.net_margin} UZS`} variant="success" />
        <StatsCard
          title="Pending"
          value={data.pending_count}
          subtitle={`${data.pending_amount} UZS`}
          variant="warning"
        />
        <StatsCard
          title="Overdue"
          value={data.overdue_count}
          subtitle={`${data.overdue_amount} UZS`}
          variant="danger"
        />
      </div>
    </>
  );
}

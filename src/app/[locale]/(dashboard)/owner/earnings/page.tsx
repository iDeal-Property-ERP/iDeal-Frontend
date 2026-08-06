'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { OwnerEarningsOutput, OwnerSettlementOutput } from '@/types/owner';

/**
 * Owner earnings summary page showing guaranteed, paid, and pending amounts.
 * @returns Earnings page element.
 */
export default function OwnerEarningsPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<OwnerEarningsOutput | null>(null);
  const [settlements, setSettlements] = useState<OwnerSettlementOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<OwnerEarningsOutput>('/owner/earnings/'),
      apiFetch<{ page: { object_list: OwnerSettlementOutput[] } }>('/owner/settlements/', {
        query: { page: 1 },
      }),
    ])
      .then(([earnings, response]) => {
        setData(earnings);
        setSettlements(response.page.object_list);
      })
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }
  if (!data) {
    return <p className="text-sm text-danger">{t('load_error')}</p>;
  }

  return (
    <>
      <PageHeader
        title={t('my_earnings')}
        backHref="/owner"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              router.push('/owner');
            }}
          >
            {t('owner_dashboard')}
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title={t('total_guaranteed')}
          value={`${data.total_guaranteed} ${data.currency}`}
          subtitle={t('guaranteed_subtitle')}
        />
        <StatsCard
          title={t('total_paid')}
          value={`${data.total_paid} ${data.currency}`}
          subtitle={t('paid_subtitle')}
          variant="success"
        />
        <StatsCard
          title={t('total_pending')}
          value={`${data.total_pending} ${data.currency}`}
          subtitle={t('pending_subtitle')}
          variant="warning"
        />
        <StatsCard
          title={t('above_guarantee')}
          value={`${data.total_above_guarantee} ${data.currency}`}
          subtitle={t('above_guarantee_subtitle')}
          variant="success"
        />
      </div>
      <section className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="mb-3">
          <h2 className="text-base font-semibold">{t('settlement_statements')}</h2>
          <p className="text-sm text-muted-foreground">{t('settlement_statements_desc')}</p>
        </div>
        <div className="space-y-2">
          {settlements.map((settlement) => (
            <article
              key={settlement.id}
              className="grid gap-2 rounded-lg border border-border p-3 text-sm md:grid-cols-5"
            >
              <div>
                <p className="font-medium">{settlement.property_name}</p>
                <p className="text-muted-foreground">{settlement.period_start}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('rent_received')}</p>
                <p>
                  {settlement.rent_received_amount} {settlement.currency}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('gross_floor')}</p>
                <p>
                  {settlement.gross_floor_amount} {settlement.currency}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('commission')}</p>
                <p>
                  {settlement.commission_amount} {settlement.currency}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('owner_payout')}</p>
                <p className="font-semibold">
                  {settlement.owner_payout_amount} {settlement.currency}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

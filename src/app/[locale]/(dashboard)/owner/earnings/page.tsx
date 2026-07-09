'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { OwnerEarningsOutput } from '@/types/owner';

/**
 * Owner earnings summary page showing guaranteed, paid, and pending amounts.
 * @returns Earnings page element.
 */
export default function OwnerEarningsPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<OwnerEarningsOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<OwnerEarningsOutput>('/owner/earnings/')
      .then(setData)
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
      <div className="grid grid-cols-3 gap-4">
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
      </div>
    </>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
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
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!data) {
    return <p className="text-sm text-danger">Failed to load earnings</p>;
  }

  return (
    <>
      <PageHeader
        title={t('my_earnings')}
        backHref="/owner"
        actions={
          <Button
            intent="outline"
            onClick={() => {
              router.push('/owner');
            }}
          >
            Dashboard
          </Button>
        }
      />
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          title="Total Guaranteed"
          value={`${data.total_guaranteed} ${data.currency}`}
          subtitle="Your contractual minimum"
        />
        <StatsCard
          title="Total Paid"
          value={`${data.total_paid} ${data.currency}`}
          subtitle="Received payouts"
          variant="success"
        />
        <StatsCard
          title="Total Pending"
          value={`${data.total_pending} ${data.currency}`}
          subtitle="Awaiting payout"
          variant="warning"
        />
      </div>
    </>
  );
}

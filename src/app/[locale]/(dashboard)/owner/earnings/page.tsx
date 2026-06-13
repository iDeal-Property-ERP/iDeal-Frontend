'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { OwnerEarningsOutput } from '@/types/owner';

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
    return <p className="text-sm text-neutral-400">Loading...</p>;
  }
  if (!data) {
    return <p className="text-sm text-red-500">Failed to load earnings</p>;
  }

  return (
    <>
      <PageHeader
        title={t('my_earnings')}
        backHref="/owner"
        actions={
          <button
            onClick={() => {
              router.push('/owner');
            }}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Dashboard
          </button>
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

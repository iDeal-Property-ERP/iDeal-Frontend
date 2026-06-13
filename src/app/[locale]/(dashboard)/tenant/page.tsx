'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { TenantHomeOutput } from '@/types/tenant';

export default function TenantHomePage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<TenantHomeOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TenantHomeOutput>('/tenant/home/')
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
    return <p className="text-sm text-red-500">Failed to load</p>;
  }

  return (
    <>
      <PageHeader title={t('tenant_home')} description={t('tenant_home_desc')} />
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {data.property_name ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="text-sm font-medium text-neutral-500">Active Lease</h3>
            <p className="mt-2 text-lg font-semibold">{data.property_name}</p>
            <p className="text-sm text-neutral-500">{data.property_address}</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Status</span>
                <span className="font-medium">{data.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Start</span>
                <span>{data.start_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">End</span>
                <span>{data.end_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Rent</span>
                <span className="font-semibold">{data.monthly_rent}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="text-sm font-medium text-neutral-500">Lease</h3>
            <p className="mt-2 text-neutral-400">No active lease</p>
          </div>
        )}
        {data.next_payment_due ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h3 className="text-sm font-medium text-neutral-500">Next Payment</h3>
            <p className="mt-2 text-2xl font-bold">{data.rent_due}</p>
            <p className="text-sm text-neutral-500">Due: {data.next_payment_due}</p>
          </div>
        ) : null}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="text-sm font-medium text-neutral-500">Quick Actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => {
                router.push('/tenant/payments');
              }}
              className="rounded border border-neutral-200 px-4 py-2 text-left text-sm hover:bg-neutral-50"
            >
              Payment History
            </button>
            <button
              onClick={() => {
                router.push('/tenant/service-requests');
              }}
              className="rounded border border-neutral-200 px-4 py-2 text-left text-sm hover:bg-neutral-50"
            >
              Service Requests
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

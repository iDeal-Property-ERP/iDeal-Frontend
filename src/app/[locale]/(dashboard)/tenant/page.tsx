'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { TenantHomeOutput } from '@/types/tenant';

/**
 * Tenant home dashboard showing active lease, next payment, and quick actions.
 * @returns Tenant home page element.
 */
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
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!data) {
    return <p className="text-sm text-danger">Failed to load</p>;
  }

  return (
    <>
      <PageHeader title={t('tenant_home')} description={t('tenant_home_desc')} />
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {data.property_name ? (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Active Lease</h3>
            <p className="mt-2 text-lg font-semibold">{data.property_name}</p>
            <p className="text-sm text-muted-foreground">{data.property_address}</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{data.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start</span>
                <span>{data.start_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End</span>
                <span>{data.end_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rent</span>
                <span className="font-semibold">{data.monthly_rent}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Lease</h3>
            <p className="mt-2 text-muted-foreground">No active lease</p>
          </div>
        )}
        {data.next_payment_due ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Next Payment</h3>
            <p className="mt-2 text-2xl font-bold">{data.rent_due}</p>
            <p className="text-sm text-muted-foreground">Due: {data.next_payment_due}</p>
          </div>
        ) : null}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              intent="outline"
              onClick={() => {
                router.push('/tenant/payments');
              }}
              className="justify-start"
            >
              Payment History
            </Button>
            <Button
              intent="outline"
              onClick={() => {
                router.push('/tenant/service-requests');
              }}
              className="justify-start"
            >
              Service Requests
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }
  if (!data) {
    return <p className="text-sm text-danger">{t('load_error')}</p>;
  }

  return (
    <>
      <PageHeader title={t('tenant_home')} description={t('tenant_home_desc')} />
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {data.property_name ? (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">{t('active_lease')}</h3>
            <p className="mt-2 text-lg font-semibold">{data.property_name}</p>
            <p className="text-sm text-muted-foreground">{data.property_address}</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('col_status')}</span>
                <span className="font-medium">{data.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('lease_start')}</span>
                <span>{data.start_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('lease_end')}</span>
                <span>{data.end_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('lease_rent')}</span>
                <span className="font-semibold">{data.monthly_rent}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">{t('lease')}</h3>
            <p className="mt-2 text-muted-foreground">{t('no_active_lease')}</p>
          </div>
        )}
        {data.next_payment_due ? (
          <Alert variant="warning" className="p-6">
            <AlertTitle className="text-sm font-medium text-muted-foreground">
              {t('next_payment')}
            </AlertTitle>
            <p className="mt-2 text-2xl font-bold">{data.rent_due}</p>
            <AlertDescription className="text-muted-foreground">
              {t('due_on', { date: data.next_payment_due })}
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">{t('quick_actions')}</h3>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                router.push('/tenant/payments');
              }}
              className="justify-start"
            >
              {t('payment_history')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                router.push('/tenant/service-requests');
              }}
              className="justify-start"
            >
              {t('service_requests')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

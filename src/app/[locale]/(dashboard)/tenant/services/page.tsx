'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { ServiceCatalogItemOutput, ServiceOrderOutput } from '@/types/vas';

/**
 * Tenant value-added services: browse the catalog, order, and track orders.
 * @returns Tenant services page.
 */
export default function TenantServicesPage() {
  const t = useTranslations('Pages');
  const [catalog, setCatalog] = useState<ServiceCatalogItemOutput[]>([]);
  const [orders, setOrders] = useState<ServiceOrderOutput[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, myOrders] = await Promise.all([
        apiFetch<ServiceCatalogItemOutput[]>('/vas/catalog/', { query: { is_active: true } }),
        apiFetch<ServiceOrderOutput[]>('/tenant/vas-orders/'),
      ]);
      setCatalog(items);
      setOrders(myOrders);
    } catch {
      void 0;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {
      void 0;
    });
  }, [load]);

  async function order(itemId: number) {
    setMessage(null);
    try {
      await apiFetch('/tenant/vas-orders/', {
        method: 'POST',
        body: { catalog_item_id: itemId },
      });
      setMessage(t('vas_order_success'));
      await load();
    } catch {
      setMessage(t('vas_order_error'));
    }
  }

  return (
    <>
      <PageHeader title={t('services')} description={t('services_desc')} backHref="/tenant" />
      {message ? <p className="mb-4 text-sm text-muted-foreground">{message}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <h3 className="mb-3 text-sm font-semibold text-foreground">{t('vas_catalog')}</h3>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <Badge>{item.service_type}</Badge>
                </div>
                {item.description ? (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                ) : null}
                <p className="text-sm font-semibold text-foreground">
                  {item.base_price} {item.currency}
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    order(item.id).catch(() => {
                      void 0;
                    });
                  }}
                >
                  {t('vas_order')}
                </Button>
              </div>
            ))}
            {catalog.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('vas_no_services')}</p>
            ) : null}
          </div>

          <h3 className="mb-3 text-sm font-semibold text-foreground">{t('vas_my_orders')}</h3>
          <DataTable
            columns={[
              { key: 'catalog_item_name', header: 'Service' },
              { key: 'cost', header: 'Cost' },
              { key: 'cashback_amount', header: 'Cashback' },
              {
                key: 'status',
                header: 'Status',
                render: (o: ServiceOrderOutput) => <Badge>{o.status}</Badge>,
              },
            ]}
            data={orders}
            keyExtractor={(item) => String(item.id)}
          />
        </>
      )}
    </>
  );
}

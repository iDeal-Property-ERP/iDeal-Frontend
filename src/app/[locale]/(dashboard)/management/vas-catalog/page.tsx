'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/libs/api';
import type { VASServiceType } from '@/types/enums';
import type { ServiceCatalogItemCreatePayload, ServiceCatalogItemOutput } from '@/types/vas';

const TYPES: VASServiceType[] = ['cleaning', 'handyman', 'utility', 'internet', 'moving', 'other'];

const EMPTY: ServiceCatalogItemCreatePayload = {
  name: '',
  service_type: 'cleaning',
  base_price: '',
  partner_name: '',
  commission_rate: '10',
  cashback_rate: '0',
};

/**
 * Management catalog of value-added services.
 * @returns VAS catalog page.
 */
export default function VASCatalogPage() {
  const t = useTranslations('Pages');
  const [items, setItems] = useState<ServiceCatalogItemOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ServiceCatalogItemCreatePayload>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ServiceCatalogItemOutput[]>('/vas/catalog/');
      setItems(data);
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

  async function create() {
    try {
      await apiFetch('/vas/catalog/', { method: 'POST', body: form });
      setShowForm(false);
      setForm(EMPTY);
      await load();
    } catch {
      void 0;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('vas_catalog')}
        description={t('vas_catalog_desc')}
        actions={
          <Button
            onClick={() => {
              setShowForm((v) => !v);
            }}
          >
            {t('vas_add_service')}
          </Button>
        }
      />

      {showForm ? (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
          <FormField label={t('vas_name')} required>
            <Input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
              }}
            />
          </FormField>
          <FormField label={t('vas_type')}>
            <Select
              value={form.service_type}
              onChange={(e) => {
                setForm({ ...form, service_type: e.target.value as VASServiceType });
              }}
            >
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {ty}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('vas_partner')}>
            <Input
              value={form.partner_name}
              onChange={(e) => {
                setForm({ ...form, partner_name: e.target.value });
              }}
            />
          </FormField>
          <FormField label={t('vas_base_price')} required>
            <Input
              value={form.base_price}
              onChange={(e) => {
                setForm({ ...form, base_price: e.target.value });
              }}
            />
          </FormField>
          <FormField label={t('vas_commission')}>
            <Input
              value={form.commission_rate}
              onChange={(e) => {
                setForm({ ...form, commission_rate: e.target.value });
              }}
            />
          </FormField>
          <FormField label={t('vas_cashback')}>
            <Input
              value={form.cashback_rate}
              onChange={(e) => {
                setForm({ ...form, cashback_rate: e.target.value });
              }}
            />
          </FormField>
          <div className="col-span-full">
            <Button
              onClick={() => {
                create().catch(() => {
                  void 0;
                });
              }}
            >
              {t('vas_save_service')}
            </Button>
          </div>
        </div>
      ) : null}

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          {
            key: 'service_type',
            header: 'Type',
            render: (i: ServiceCatalogItemOutput) => <Badge>{i.service_type}</Badge>,
          },
          { key: 'partner_name', header: 'Partner' },
          {
            key: 'base_price',
            header: 'Price',
            render: (i: ServiceCatalogItemOutput) => `${i.base_price} ${i.currency}`,
          },
          { key: 'commission_rate', header: 'Commission %' },
          {
            key: 'is_active',
            header: 'Active',
            render: (i: ServiceCatalogItemOutput) => (i.is_active ? t('vas_yes') : t('vas_no')),
          },
        ]}
        data={items}
        isLoading={loading}
        emptyMessage="No services yet"
        keyExtractor={(item) => item.id}
      />
    </div>
  );
}

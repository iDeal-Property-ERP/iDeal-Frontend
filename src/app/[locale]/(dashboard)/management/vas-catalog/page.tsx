'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const columns: ColumnDef<ServiceCatalogItemOutput>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'service_type',
      header: 'Type',
      cell: ({ row }) => <Badge>{row.original.service_type}</Badge>,
    },
    { accessorKey: 'partner_name', header: 'Partner' },
    {
      accessorKey: 'base_price',
      header: 'Price',
      cell: ({ row }) => `${row.original.base_price} ${row.original.currency}`,
    },
    { accessorKey: 'commission_rate', header: 'Commission %' },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => (row.original.is_active ? t('vas_yes') : t('vas_no')),
    },
  ];

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
          <div className="grid gap-1.5">
            <Label htmlFor="vas_name">
              {t('vas_name')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vas_name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vas_type">{t('vas_type')}</Label>
            <Select
              value={form.service_type}
              onValueChange={(v) => {
                setForm({ ...form, service_type: v as VASServiceType });
              }}
            >
              <SelectTrigger id="vas_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {ty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vas_partner">{t('vas_partner')}</Label>
            <Input
              id="vas_partner"
              value={form.partner_name}
              onChange={(e) => {
                setForm({ ...form, partner_name: e.target.value });
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vas_base_price">
              {t('vas_base_price')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vas_base_price"
              value={form.base_price}
              onChange={(e) => {
                setForm({ ...form, base_price: e.target.value });
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vas_commission">{t('vas_commission')}</Label>
            <Input
              id="vas_commission"
              value={form.commission_rate}
              onChange={(e) => {
                setForm({ ...form, commission_rate: e.target.value });
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vas_cashback">{t('vas_cashback')}</Label>
            <Input
              id="vas_cashback"
              value={form.cashback_rate}
              onChange={(e) => {
                setForm({ ...form, cashback_rate: e.target.value });
              }}
            />
          </div>
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
        columns={columns}
        data={items}
        isLoading={loading}
        emptyMessage="No services yet"
      />
    </div>
  );
}

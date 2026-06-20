'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
import type { PaginatedData } from '@/types/api';
import type {
  ManagementOnboardingApprovePayload,
  ManagementOnboardingOutput,
} from '@/types/management';

const STATUSES = ['', 'submitted', 'approved', 'rejected'];

/**
 * Management review queue for owner onboarding submissions.
 * @returns The onboardings review page.
 */
export default function ManagementOnboardingsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementOnboardingOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<ManagementOnboardingOutput | null>(null);
  const [form, setForm] = useState<ManagementOnboardingApprovePayload>({
    commission_rate: '10',
    start_date: '',
    end_date: '',
    owner_guaranteed_price: '',
    tenant_charge_price: '',
  });

  useEffect(() => {
    setIsLoading(true);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    apiFetch<PaginatedData<ManagementOnboardingOutput>>('/management/onboardings/', { query })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter, reload]);

  async function approve() {
    if (!selected) {
      return;
    }
    try {
      const body: Record<string, unknown> = {
        commission_rate: form.commission_rate,
        start_date: form.start_date,
        end_date: form.end_date,
      };
      if (form.owner_guaranteed_price) {
        body.owner_guaranteed_price = form.owner_guaranteed_price;
      }
      if (form.tenant_charge_price) {
        body.tenant_charge_price = form.tenant_charge_price;
      }
      await apiFetch(`/management/onboardings/${selected.id}/approve/`, {
        method: 'POST',
        body,
      });
      setSelected(null);
      setReload((n) => n + 1);
    } catch {
      void 0;
    }
  }

  async function reject(id: number) {
    try {
      await apiFetch(`/management/onboardings/${id}/reject/`, {
        method: 'POST',
        body: {},
      });
      setReload((n) => n + 1);
    } catch {
      void 0;
    }
  }

  const columns: ColumnDef<ManagementOnboardingOutput>[] = [
    { accessorKey: 'owner_name', header: 'Owner' },
    { accessorKey: 'property_name', header: 'Property' },
    {
      accessorKey: 'ask_price',
      header: 'Ask Price',
      cell: ({ row }) => row.original.ask_price,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const o = row.original;
        return o.status === 'submitted' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setSelected(o);
              }}
            >
              {t('onboarding_approve')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                reject(o.id).catch(() => {
                  void 0;
                });
              }}
            >
              {t('onboarding_reject')}
            </Button>
          </div>
        ) : null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('onboardings')} description={t('onboardings_desc')} />

      {selected ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t('onboarding_approve_title')}: {selected.property_name}
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="commission_rate">
                {t('onboarding_commission_rate')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="commission_rate"
                value={form.commission_rate}
                onChange={(e) => {
                  setForm({ ...form, commission_rate: e.target.value });
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="start_date">
                {t('onboarding_start_date')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => {
                  setForm({ ...form, start_date: e.target.value });
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end_date">
                {t('onboarding_end_date')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => {
                  setForm({ ...form, end_date: e.target.value });
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="owner_guaranteed_price">{t('onboarding_guaranteed_price')}</Label>
              <Input
                id="owner_guaranteed_price"
                value={form.owner_guaranteed_price}
                onChange={(e) => {
                  setForm({ ...form, owner_guaranteed_price: e.target.value });
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tenant_charge_price">{t('onboarding_charge_price')}</Label>
              <Input
                id="tenant_charge_price"
                value={form.tenant_charge_price}
                onChange={(e) => {
                  setForm({ ...form, tenant_charge_price: e.target.value });
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                approve().catch(() => {
                  void 0;
                });
              }}
            >
              {t('onboarding_confirm_approve')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelected(null);
              }}
            >
              {t('onboarding_cancel')}
            </Button>
          </div>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No onboardings found"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-auto min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.filter(Boolean).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}

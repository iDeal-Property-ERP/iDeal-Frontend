'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
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

  return (
    <div className="space-y-6">
      <PageHeader title={t('onboardings')} description={t('onboardings_desc')} />

      {selected ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t('onboarding_approve_title')}: {selected.property_name}
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <FormField label={t('onboarding_commission_rate')} required>
              <Input
                value={form.commission_rate}
                onChange={(e) => {
                  setForm({ ...form, commission_rate: e.target.value });
                }}
              />
            </FormField>
            <FormField label={t('onboarding_start_date')} required>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => {
                  setForm({ ...form, start_date: e.target.value });
                }}
              />
            </FormField>
            <FormField label={t('onboarding_end_date')} required>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => {
                  setForm({ ...form, end_date: e.target.value });
                }}
              />
            </FormField>
            <FormField label={t('onboarding_guaranteed_price')}>
              <Input
                value={form.owner_guaranteed_price}
                onChange={(e) => {
                  setForm({ ...form, owner_guaranteed_price: e.target.value });
                }}
              />
            </FormField>
            <FormField label={t('onboarding_charge_price')}>
              <Input
                value={form.tenant_charge_price}
                onChange={(e) => {
                  setForm({ ...form, tenant_charge_price: e.target.value });
                }}
              />
            </FormField>
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
        columns={[
          { key: 'owner_name', header: 'Owner' },
          { key: 'property_name', header: 'Property' },
          {
            key: 'ask_price',
            header: 'Ask Price',
            render: (o: ManagementOnboardingOutput) => o.ask_price,
          },
          {
            key: 'status',
            header: 'Status',
            render: (o: ManagementOnboardingOutput) => <Badge>{o.status}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            render: (o: ManagementOnboardingOutput) =>
              o.status === 'submitted' ? (
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
              ) : null,
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No onboardings found"
        keyExtractor={(item) => item.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || 'All statuses'}
              </option>
            ))}
          </Select>
        }
      />
    </div>
  );
}

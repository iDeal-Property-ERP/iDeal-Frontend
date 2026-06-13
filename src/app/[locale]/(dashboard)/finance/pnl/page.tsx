'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PnLOutput } from '@/types/finance-extras';

const filterSchema = z.object({
  year: z.coerce.number().min(2000),
  month: z.coerce.number().min(1).max(12).optional(),
});

type FilterForm = z.infer<typeof filterSchema>;

export default function PnLPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<PnLOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: { year: new Date().getFullYear() },
  });

  const onSubmit = async (filters: FilterForm) => {
    setLoading(true);
    try {
      const query: Record<string, string | number> = { year: filters.year };
      if (filters.month) {
        query.month = filters.month;
      }
      const res = await apiFetch<PnLOutput>('/finance/pnl/', { query });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('profit_and_loss')}
        description={t('profit_and_loss_desc')}
        actions={
          <button
            onClick={() => {
              router.push('/finance');
            }}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Back to Finance
          </button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 flex items-end gap-4">
        <FormField label="Year" error="">
          <input
            type="number"
            {...register('year')}
            className="w-28 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </FormField>
        <FormField label="Month" error="">
          <select
            {...register('month')}
            className="w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </FormField>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </form>
      {data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard title="Gross Revenue" value={`${data.gross_revenue} UZS`} />
          <StatsCard title="Owner Payouts" value={`${data.owner_payouts} UZS`} />
          <StatsCard title="Net Margin" value={`${data.net_margin} UZS`} variant="success" />
          <StatsCard
            title="Payments"
            value={data.payment_count}
            subtitle={`Tax Est: ${data.tax_estimate} UZS`}
          />
        </div>
      ) : (
        <p className="text-sm text-neutral-400">Select year and month to generate the report.</p>
      )}
    </>
  );
}

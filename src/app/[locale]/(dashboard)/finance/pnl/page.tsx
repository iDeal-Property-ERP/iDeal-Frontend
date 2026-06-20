'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PnLOutput } from '@/types/finance-extras';

const filterSchema = z.object({
  year: z.coerce.number().min(2000),
  month: z.coerce.number().min(1).max(12).optional(),
});

type FilterForm = z.infer<typeof filterSchema>;

/**
 * Renders the profit and loss report page with year/month filter controls.
 * @returns Profit and loss report page element.
 */
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
          <Button
            variant="outline"
            onClick={() => {
              router.push('/finance');
            }}
          >
            Back to Finance
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 flex items-end gap-4">
        <FormField label="Year" error="">
          <Input type="number" {...register('year')} className="w-28" />
        </FormField>
        <FormField label="Month" error="">
          <Select {...register('month')} className="w-28">
            <option value="">All</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
        </FormField>
        <Button type="submit" variant="default" disabled={loading}>
          {loading ? 'Loading...' : 'Generate'}
        </Button>
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
        <p className="text-sm text-muted-foreground">
          Select year and month to generate the report.
        </p>
      )}
    </>
  );
}

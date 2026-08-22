'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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

  const { register, handleSubmit, control } = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: { year: new Date().getFullYear() },
  });

  const onSubmit = async (filters: FilterForm) => {
    setLoading(true);
    try {
      const query = {
        year: filters.year,
        month: filters.month ?? undefined,
      } satisfies Record<string, string | number | undefined>;
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
        <div className="grid gap-1.5">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" {...register('year')} className="w-28" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="month">Month</Label>
          <Controller
            control={control}
            name="month"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : 'all'}
                onValueChange={(v) => field.onChange(v === 'all' ? '' : v)}
              >
                <SelectTrigger id="month" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
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

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DetailCard,
  DetailError,
  DetailGrid,
  DetailList,
  DetailLoading,
  DetailRow,
} from '@/components/ui/detail';
import { Form } from '@/components/ui/form';
import { DateField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { leaseStatusVariant } from '@/libs/badges';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import type { LeaseOutput } from '@/types/contract';

const renewSchema = z
  .object({
    new_start_date: z.string().min(1, 'Start date is required'),
    new_end_date: z.string().min(1, 'End date is required'),
    new_monthly_rent: z.coerce.number().positive('Monthly rent must be greater than 0'),
    deposit: z.coerce.number().positive('Deposit must be greater than 0'),
  })
  .refine((data) => data.new_end_date > data.new_start_date, {
    message: 'End date must be after start date',
    path: ['new_end_date'],
  });

/**
 * Displays lease detail, and renders the renewal form when the lease is active or renewed.
 * @param props - Page route params with lease ID.
 * @returns Lease detail page element.
 */
export default function LeaseDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();

  const [lease, setLease] = useState<LeaseOutput | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(renewSchema),
  });

  const loadLease = async () =>
    await apiFetch<LeaseOutput>(`/contracts/leases/${params.id}/`).then(setLease);

  useEffect(() => {
    loadLease()
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const onRenew = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch(`/contracts/leases/${params.id}/renew/`, { method: 'POST', body: values }),
    success: 'Lease renewed',
    error: 'Failed to renew',
    onSuccess: async () => {
      form.reset();
      await loadLease();
    },
  });

  const { isSubmitting } = form.formState;

  if (loading) {
    return <DetailLoading />;
  }
  if (!lease) {
    return <DetailError message="Lease not found" />;
  }

  return (
    <>
      <PageHeader
        title={`Lease #${lease.id}`}
        backHref="/contracts/leases"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={leaseStatusVariant(lease.status)}>{lease.status}</Badge>
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/contracts/leases/${params.id}/edit`);
              }}
            >
              Edit
            </Button>
          </div>
        }
      />
      <DetailGrid>
        <DetailCard title="Lease Details">
          <DetailList>
            <DetailRow label="Property" value={lease.property_id} />
            <DetailRow label="Tenant" value={lease.tenant_id} />
            <DetailRow label="Agreement" value={lease.owner_agreement_id} />
            <DetailRow
              label="Status"
              value={<Badge variant={leaseStatusVariant(lease.status)}>{lease.status}</Badge>}
            />
          </DetailList>
        </DetailCard>
        <DetailCard title="Dates & Payments">
          <DetailList>
            <DetailRow label="Start" value={lease.start_date} />
            <DetailRow label="End" value={lease.end_date} />
            <DetailRow label="Monthly Rent" value={lease.monthly_rent} emphasized />
            <DetailRow label="Deposit" value={lease.deposit} />
          </DetailList>
        </DetailCard>
      </DetailGrid>
      {lease.status === 'active' || lease.status === 'renewed' ? (
        <DetailCard title="Renew Lease" className="mt-6">
          <Form {...form}>
            <form onSubmit={onRenew} className="max-w-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DateField
                  control={form.control}
                  name="new_start_date"
                  label="New Start Date"
                  required
                />
                <DateField
                  control={form.control}
                  name="new_end_date"
                  label="New End Date"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  control={form.control}
                  name="new_monthly_rent"
                  label="New Monthly Rent"
                  type="number"
                  step="0.01"
                  required
                />
                <TextField
                  control={form.control}
                  name="deposit"
                  label="Deposit"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <Button type="submit" variant="default" disabled={isSubmitting}>
                {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
                {isSubmitting ? 'Renewing…' : 'Renew Lease'}
              </Button>
            </form>
          </Form>
        </DetailCard>
      ) : null}
    </>
  );
}

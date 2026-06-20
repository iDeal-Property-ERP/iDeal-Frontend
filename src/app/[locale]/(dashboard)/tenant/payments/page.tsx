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
import { paymentStatusVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { PaymentMethod } from '@/types/enums';
import type { TenantHomeOutput, TenantPaymentOutput } from '@/types/tenant';

/**
 * Tenant payment history page with a pay-rent form and paginated table.
 * @returns Payments page element.
 */
export default function TenantPaymentsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<TenantPaymentOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('online');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedData<TenantPaymentOutput>>('/tenant/payments/', {
        query: { page: p },
      });
      setData(res.page.object_list);
      setTotalPages(res.num_pages);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  const prefillRent = useCallback(async () => {
    try {
      const home = await apiFetch<TenantHomeOutput>('/tenant/home/');
      if (home.rent_due) {
        setAmount(home.rent_due);
      }
    } catch {
      // no active lease — leave blank
    }
  }, []);

  useEffect(() => {
    fetchData(page).catch(() => {
      void 0;
    });
  }, [page, fetchData]);

  async function submitPayment() {
    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch('/tenant/payments/', {
        method: 'POST',
        body: { amount: amount || undefined, method },
      });
      setMessage(t('pay_rent_success'));
      setShowForm(false);
      await fetchData(1);
      setPage(1);
    } catch {
      setMessage(t('pay_rent_error'));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<TenantPaymentOutput>[] = [
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'currency', header: 'Currency' },
    { accessorKey: 'payment_date', header: 'Paid On' },
    { accessorKey: 'due_date', header: 'Due Date' },
    { accessorKey: 'method', header: 'Method' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={paymentStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('payment_history')}
        backHref="/tenant"
        actions={
          <Button
            onClick={() => {
              setShowForm((v) => !v);
              if (!showForm) {
                prefillRent().catch(() => {
                  void 0;
                });
              }
            }}
          >
            {t('pay_rent')}
          </Button>
        }
      />

      {message ? <p className="mb-4 text-sm text-muted-foreground">{message}</p> : null}

      {showForm ? (
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="grid gap-1.5">
              <Label htmlFor="pay_amount">{t('pay_rent_amount')}</Label>
              <Input
                id="pay_amount"
                type="number"
                inputMode="decimal"
                value={amount}
                placeholder="0.00"
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="grid gap-1.5">
              <Label htmlFor="pay_method">{t('pay_rent_method')}</Label>
              <Select
                value={method}
                onValueChange={(v) => {
                  setMethod(v as PaymentMethod);
                }}
              >
                <SelectTrigger id="pay_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">online</SelectItem>
                  <SelectItem value="cash">cash</SelectItem>
                  <SelectItem value="bank_transfer">bank_transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={submitting}
            onClick={() => {
              submitPayment().catch(() => {
                void 0;
              });
            }}
          >
            {submitting ? t('pay_rent_submitting') : t('pay_rent_submit')}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}

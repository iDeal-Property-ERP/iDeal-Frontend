'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
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

  const columns = [
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'payment_date', header: 'Paid On', sortable: true },
    { key: 'due_date', header: 'Due Date', sortable: true },
    { key: 'method', header: 'Method' },
    {
      key: 'status',
      header: 'Status',
      render: (item: TenantPaymentOutput) => (
        <Badge variant={paymentStatusVariant(item.status)}>{item.status}</Badge>
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
            <FormField label={t('pay_rent_amount')}>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                placeholder="0.00"
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
              />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label={t('pay_rent_method')}>
              <Select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value as PaymentMethod);
                }}
              >
                <option value="online">online</option>
                <option value="cash">cash</option>
                <option value="bank_transfer">bank_transfer</option>
              </Select>
            </FormField>
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
          keyExtractor={(item) => String(item.id)}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}

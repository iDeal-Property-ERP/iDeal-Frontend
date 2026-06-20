'use client';

import { use, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DetailCard,
  DetailError,
  DetailGrid,
  DetailList,
  DetailLoading,
  DetailRow,
  DetailText,
} from '@/components/ui/detail';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { paymentStatusVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaymentOutput } from '@/types/finance';

/**
 * Detail view for a single payment with edit and mark-paid actions.
 * @param props - Page props containing the route params.
 * @returns Payment detail page.
 */
export default function PaymentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = async () =>
    await apiFetch<PaymentOutput>(`/finance/payments/${params.id}/`).then(setPayment);

  useEffect(() => {
    load()
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleMarkPaid = async () => {
    setMarking(true);
    try {
      await apiFetch(`/finance/payments/${params.id}/mark-paid/`, { method: 'POST' });
      await load();
    } catch {
      void 0;
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return <DetailLoading />;
  }
  if (!payment) {
    return <DetailError message="Payment not found" />;
  }

  return (
    <>
      <PageHeader
        title={`Payment #${payment.id}`}
        backHref="/finance/payments"
        actions={
          <div className="flex gap-2">
            {payment.status !== 'paid' ? (
              <Button variant="default" onClick={handleMarkPaid} disabled={marking}>
                {marking ? 'Marking…' : 'Mark Paid'}
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/finance/payments/${params.id}/edit`);
              }}
            >
              Edit
            </Button>
          </div>
        }
      />
      <DetailGrid>
        <DetailCard title="Payment">
          <DetailList>
            <DetailRow label="Amount" value={`${payment.amount} ${payment.currency}`} emphasized />
            <DetailRow
              label="Status"
              value={<Badge variant={paymentStatusVariant(payment.status)}>{payment.status}</Badge>}
            />
            <DetailRow label="Method" value={payment.method} />
            <DetailRow label="Tenant" value={payment.tenant_name || payment.tenant_id} />
            <DetailRow label="Lease" value={payment.lease_id} />
          </DetailList>
        </DetailCard>
        <DetailCard title="Dates">
          <DetailList>
            <DetailRow label="Payment Date" value={payment.payment_date} />
            <DetailRow label="Due Date" value={payment.due_date} />
          </DetailList>
        </DetailCard>
      </DetailGrid>
      {payment.notes ? (
        <DetailCard title="Notes" className="mt-6">
          <DetailText>{payment.notes}</DetailText>
        </DetailCard>
      ) : null}
    </>
  );
}

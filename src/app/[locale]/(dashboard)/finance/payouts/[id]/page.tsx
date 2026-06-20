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
} from '@/components/ui/detail';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { paymentStatusVariant } from '@/libs/badges';
import type { PayoutOutput } from '@/types/finance-extras';

/**
 * Detail view for a single payout with mark-paid and cancel actions.
 * @param props - Page props containing the route params.
 * @returns Payout detail page.
 */
export default function PayoutDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [payout, setPayout] = useState<PayoutOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () =>
    await apiFetch<PayoutOutput>(`/finance/payouts/${params.id}/`).then(setPayout);

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

  const runAction = async (action: 'mark-paid' | 'cancel') => {
    setBusy(true);
    try {
      await apiFetch(`/finance/payouts/${params.id}/${action}/`, { method: 'POST' });
      await load();
    } catch {
      void 0;
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <DetailLoading />;
  }
  if (!payout) {
    return <DetailError message="Payout not found" />;
  }

  const canAct = payout.status === 'scheduled';

  return (
    <>
      <PageHeader
        title={`Payout #${payout.id}`}
        backHref="/finance/payouts"
        actions={
          canAct ? (
            <div className="flex gap-2">
              <Button
                variant="default"
                disabled={busy}
                onClick={() => {
                  void runAction('mark-paid');
                }}
              >
                {busy ? 'Working…' : 'Mark Paid'}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  void runAction('cancel');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : null
        }
      />
      <DetailGrid>
        <DetailCard title="Payout">
          <DetailList>
            <DetailRow label="Amount" value={`${payout.amount} ${payout.currency}`} emphasized />
            <DetailRow
              label="Status"
              value={<Badge variant={paymentStatusVariant(payout.status)}>{payout.status}</Badge>}
            />
            <DetailRow label="Owner" value={payout.owner_id} />
          </DetailList>
        </DetailCard>
        <DetailCard title="Dates">
          <DetailList>
            <DetailRow label="Scheduled" value={payout.scheduled_date} />
            <DetailRow label="Paid On" value={payout.paid_date} />
          </DetailList>
        </DetailCard>
      </DetailGrid>
    </>
  );
}

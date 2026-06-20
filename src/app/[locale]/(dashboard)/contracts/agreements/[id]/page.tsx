'use client';

import { useState, useEffect, use } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { leaseStatusVariant } from '@/libs/badges';
import type { OwnerAgreementOutput } from '@/types/contract';

/**
 * Displays the detail view for a single owner agreement.
 * @param props - Page route params with agreement ID.
 * @returns Agreement detail page element.
 */
export default function AgreementDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);

  const [agreement, setAgreement] = useState<OwnerAgreementOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<OwnerAgreementOutput>(`/contracts/owner-agreements/${params.id}/`)
      .then(setAgreement)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <DetailLoading />;
  }
  if (!agreement) {
    return <DetailError message="Agreement not found" />;
  }

  return (
    <>
      <PageHeader
        title={`Agreement #${agreement.agreement_number}`}
        backHref="/contracts/agreements"
        actions={<Badge variant={leaseStatusVariant(agreement.status)}>{agreement.status}</Badge>}
      />
      <DetailGrid>
        <DetailCard title="Agreement Details">
          <DetailList>
            <DetailRow label="Agreement #" value={agreement.agreement_number} emphasized />
            <DetailRow label="Owner ID" value={agreement.owner_id} />
            <DetailRow label="Property ID" value={agreement.property_id} />
            <DetailRow
              label="Status"
              value={
                <Badge variant={leaseStatusVariant(agreement.status)}>{agreement.status}</Badge>
              }
            />
          </DetailList>
        </DetailCard>
        <DetailCard title="Dates & Commission">
          <DetailList>
            <DetailRow label="Signed" value={agreement.signed_date} />
            <DetailRow label="Start" value={agreement.start_date} />
            <DetailRow label="End" value={agreement.end_date} />
            <DetailRow label="Commission Rate" value={agreement.commission_rate} emphasized />
          </DetailList>
        </DetailCard>
      </DetailGrid>
      {agreement.terms ? (
        <DetailCard title="Terms" className="mt-6">
          <DetailText>{agreement.terms}</DetailText>
        </DetailCard>
      ) : null}
    </>
  );
}

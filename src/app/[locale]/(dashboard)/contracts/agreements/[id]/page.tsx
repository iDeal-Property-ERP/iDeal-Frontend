'use client';

import { useState, useEffect, use } from 'react';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { leaseStatusVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { OwnerAgreementOutput } from '@/types/contract';

/**
 * Displays the detail view for a single owner agreement.
 * @param props - Page route params with agreement ID.
 * @returns Agreement detail page element.
 */
export default function AgreementDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const id = Number(params.id);

  const [agreement, setAgreement] = useState<OwnerAgreementOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PaginatedData<OwnerAgreementOutput>>('/contracts/owner-agreements/', {
      query: { page: 1, per_page: 100 },
    })
      .then((res) => {
        const found = res.page.object_list.find((a) => a.id === id);
        setAgreement(found ?? null);
      })
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!agreement) {
    return <p className="text-sm text-danger">Agreement not found</p>;
  }

  return (
    <>
      <PageHeader
        title={`Agreement #${agreement.agreement_number}`}
        backHref="/contracts/agreements"
      />
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Agreement Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Agreement #</dt>
              <dd className="font-semibold">{agreement.agreement_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Owner ID</dt>
              <dd>{agreement.owner_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Property ID</dt>
              <dd>{agreement.property_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={leaseStatusVariant(agreement.status)}>{agreement.status}</Badge>
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Dates &amp; Commission</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Signed</dt>
              <dd>{agreement.signed_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Start</dt>
              <dd>{agreement.start_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">End</dt>
              <dd>{agreement.end_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Commission Rate</dt>
              <dd className="font-semibold">{agreement.commission_rate}</dd>
            </div>
          </dl>
        </div>
      </div>
      {agreement.terms ? (
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Terms</h3>
          <p className="text-sm whitespace-pre-wrap text-foreground">{agreement.terms}</p>
        </div>
      ) : null}
    </>
  );
}

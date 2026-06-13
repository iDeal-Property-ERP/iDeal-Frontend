'use client';

import { useState, useEffect, use } from 'react';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { OwnerAgreementOutput } from '@/types/contract';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  expired: 'danger',
  terminated: 'warning',
};

export default function AgreementDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const id = Number(params.id);

  const [agreement, setAgreement] = useState<OwnerAgreementOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PaginatedData<OwnerAgreementOutput>>('/owner-agreements/', {
      query: { per_page: 100 },
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
    return <p className="text-sm text-neutral-400">Loading...</p>;
  }
  if (!agreement) {
    return <p className="text-sm text-red-500">Agreement not found</p>;
  }

  return (
    <>
      <PageHeader
        title={`Agreement #${agreement.agreement_number}`}
        backHref="/contracts/agreements"
      />
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Agreement Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Agreement #</dt>
              <dd className="font-semibold">{agreement.agreement_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Owner ID</dt>
              <dd>{agreement.owner_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Property ID</dt>
              <dd>{agreement.property_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <Badge variant={STATUS_VARIANT[agreement.status] ?? 'default'}>
                  {agreement.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Dates &amp; Commission</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Signed</dt>
              <dd>{agreement.signed_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Start</dt>
              <dd>{agreement.start_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">End</dt>
              <dd>{agreement.end_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Commission Rate</dt>
              <dd className="font-semibold">{agreement.commission_rate}</dd>
            </div>
          </dl>
        </div>
      </div>
      {agreement.terms ? (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Terms</h3>
          <p className="text-sm whitespace-pre-wrap text-neutral-700">{agreement.terms}</p>
        </div>
      ) : null}
    </>
  );
}

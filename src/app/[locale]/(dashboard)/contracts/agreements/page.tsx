'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { leaseStatusVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { OwnerAgreementOutput } from '@/types/contract';

/**
 * Displays the paginated list of owner agreements with navigation to create or view an agreement.
 * @returns Agreements list page element.
 */
export default function AgreementsPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<OwnerAgreementOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedData<OwnerAgreementOutput>>(
        '/contracts/owner-agreements/',
        {
          query: { page: p },
        },
      );
      setData(res.page.object_list);
      setTotalPages(res.num_pages);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page).catch(() => {
      void 0;
    });
  }, [page, fetchData]);

  const columns = [
    { key: 'agreement_number', header: 'Agreement #', sortable: true },
    { key: 'owner_id', header: 'Owner' },
    { key: 'property_id', header: 'Property' },
    { key: 'signed_date', header: 'Signed', sortable: true },
    { key: 'start_date', header: 'Start' },
    { key: 'end_date', header: 'End' },
    { key: 'commission_rate', header: 'Commission' },
    {
      key: 'status',
      header: 'Status',
      render: (item: OwnerAgreementOutput) => (
        <Badge variant={leaseStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('owner_agreements')}
        description={t('owner_agreements_contracts_desc')}
        actions={
          <Button
            variant="default"
            onClick={() => {
              router.push('/contracts/agreements/new');
            }}
          >
            New Agreement
          </Button>
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          keyExtractor={(item) => String(item.id)}
          rowHref={(item) => `/contracts/agreements/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}

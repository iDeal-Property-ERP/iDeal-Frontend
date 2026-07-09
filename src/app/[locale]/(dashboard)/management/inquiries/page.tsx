'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ContactInquiryOutput } from '@/types/marketplace';

const NEXT_STATUS: Record<string, string | undefined> = {
  new: 'handled',
  handled: 'closed',
};

const INQUIRY_TONE: Record<string, 'warning' | 'success' | 'default'> = {
  new: 'warning',
  handled: 'success',
};

const statusTone = (status: string): 'warning' | 'success' | 'default' =>
  INQUIRY_TONE[status] ?? 'default';

/**
 * Management inbox for public "Message iDeal" contact inquiries — reads
 * `GET /management/inquiries/` and advances status (new → handled → closed) via
 * `PATCH /management/inquiries/{id}/`, so inbound leads are actionable in-product.
 * @returns The inquiries inbox page.
 */
export default function InquiriesInboxPage() {
  const t = useTranslations('Pages');
  const [rows, setRows] = useState<ContactInquiryOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetch<PaginatedData<ContactInquiryOutput>>('/management/inquiries/', {
        query: { page: 1 },
      });
      setRows(res.page.object_list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {
      // handled via error state
    });
  }, [load]);

  const advance = async (row: ContactInquiryOutput) => {
    const next = NEXT_STATUS[row.status];
    if (!next) {
      return;
    }
    try {
      await apiFetch(`/management/inquiries/${row.id}/`, {
        method: 'PATCH',
        body: { status: next },
      });
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
    } catch {
      toast.error(t('load_error'));
    }
  };

  const body = ((): ReactNode => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
    }
    if (error) {
      return <p className="text-sm text-danger">{t('load_error')}</p>;
    }
    if (rows.length === 0) {
      return <p className="text-sm text-muted-foreground">{t('inquiries_empty')}</p>;
    }
    return (
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{row.full_name}</span>
                <Badge variant={statusTone(row.status)}>
                  {t(`inquiry_status_${row.status}` as 'inquiry_status_new')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {row.phone}
                {row.email ? ` · ${row.email}` : ''}
              </p>
              <p className="mt-1 text-sm text-foreground">{row.message}</p>
            </div>
            {NEXT_STATUS[row.status] ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  advance(row).catch(() => {
                    // handled via toast
                  });
                }}
              >
                {t(`inquiry_mark_${NEXT_STATUS[row.status]}` as 'inquiry_mark_handled')}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    );
  })();

  return (
    <>
      <PageHeader title={t('inquiries_title')} description={t('inquiries_desc')} />
      {body}
    </>
  );
}

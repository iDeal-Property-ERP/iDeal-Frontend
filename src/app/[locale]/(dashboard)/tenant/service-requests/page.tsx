'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { TenantServiceRequestOutput } from '@/types/tenant';

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  cancelled: 'default',
};

const PRIORITY_VARIANT: Record<string, 'default' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const schema = z.object({
  property_id: z.coerce.number().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function TenantServiceRequestsPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<TenantServiceRequestOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedData<TenantServiceRequestOutput>>(
        '/tenant/service-requests/',
        { query: { page: p } },
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

  const onCreate = async (fd: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/tenant/service-requests/', { method: 'POST', body: fd });
      reset();
      void fetchData(page);
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to create request');
    }
    setSubmitting(false);
  };

  const columns = [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'property_name', header: 'Property' },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: TenantServiceRequestOutput) => (
        <Badge variant={PRIORITY_VARIANT[item.priority] ?? 'default'}>{item.priority}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: TenantServiceRequestOutput) => (
        <Badge variant={STATUS_VARIANT[item.status] ?? 'default'}>{item.status}</Badge>
      ),
    },
    { key: 'created_at', header: 'Created', sortable: true },
  ];

  return (
    <>
      <PageHeader
        title={t('my_service_requests')}
        backHref="/tenant"
        actions={
          <button
            onClick={() => {
              router.push('/tenant');
            }}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Home
          </button>
        }
      />
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-medium text-neutral-500">New Service Request</h3>
        <form onSubmit={handleSubmit(onCreate)} className="flex items-end gap-4">
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <input
              type="number"
              {...register('property_id')}
              className="w-28 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Title" error={errors.title?.message} required>
            <input
              {...register('title')}
              className="w-40 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Description" error={errors.description?.message} required>
            <input
              {...register('description')}
              className="w-48 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Priority" error={errors.priority?.message}>
            <select
              {...register('priority')}
              className="w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">--</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </FormField>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
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

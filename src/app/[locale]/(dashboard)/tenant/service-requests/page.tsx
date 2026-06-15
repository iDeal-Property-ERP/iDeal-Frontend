'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { apiFetch } from '@/libs/api';
import { maintenanceStatusVariant, priorityVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { TenantServiceRequestOutput } from '@/types/tenant';

const schema = z.object({
  property_id: z.coerce.number().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

/**
 * Tenant service requests page with new request form and paginated history.
 * @returns Service requests page element.
 */
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
        <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: TenantServiceRequestOutput) => (
        <Badge variant={maintenanceStatusVariant(item.status)}>{item.status}</Badge>
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
          <Button
            intent="outline"
            onClick={() => {
              router.push('/tenant');
            }}
          >
            Home
          </Button>
        }
      />
      {error ? (
        <p className="mb-4 rounded bg-danger-subtle p-3 text-sm text-danger">{error}</p>
      ) : null}
      <div className="mb-6 rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">New Service Request</h3>
        <form onSubmit={handleSubmit(onCreate)} className="flex items-end gap-4">
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <Input type="number" {...register('property_id')} className="w-28" />
          </FormField>
          <FormField label="Title" error={errors.title?.message} required>
            <Input {...register('title')} className="w-40" />
          </FormField>
          <FormField label="Description" error={errors.description?.message} required>
            <Input {...register('description')} className="w-48" />
          </FormField>
          <FormField label="Priority" error={errors.priority?.message}>
            <Select {...register('priority')} className="w-28">
              <option value="">--</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </FormField>
          <Button type="submit" intent="primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </div>
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

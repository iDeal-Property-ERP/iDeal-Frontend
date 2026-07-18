'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { startTransition, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PropertySelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import { EntityField, SelectField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { maintenanceStatusVariant, priorityVariant } from '@/libs/badges';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { TenantServiceRequestOutput } from '@/types/tenant';

const schema = z.object({
  property_id: z.coerce.number().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().optional(),
});

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

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

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const fetchData = useCallback(async (p: number) => {
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
    startTransition(() => {
      fetchData(page).catch(() => {
        void 0;
      });
    });
  }, [page, fetchData]);

  const onCreate = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch('/tenant/service-requests/', { method: 'POST', body: values }),
    success: 'Request created',
    error: 'Failed to create request',
    onSuccess: () => {
      form.reset();
      void fetchData(page);
    },
  });

  const { isSubmitting } = form.formState;

  const columns: ColumnDef<TenantServiceRequestOutput>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'property_name', header: 'Property' },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={priorityVariant(row.original.priority)}>{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={maintenanceStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    { accessorKey: 'created_at', header: 'Created' },
  ];

  return (
    <>
      <PageHeader
        title={t('my_service_requests')}
        backHref="/tenant"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              router.push('/tenant');
            }}
          >
            Home
          </Button>
        }
      />
      <div className="mb-6 rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">New Service Request</h3>
        <Form {...form}>
          <form onSubmit={onCreate} className="flex items-end gap-4">
            <EntityField
              control={form.control}
              name="property_id"
              label="Property"
              required
              className="w-56"
            >
              {(field, invalid) => (
                <PropertySelect
                  id="property_id"
                  value={field.value as number | null | undefined}
                  onChange={(v) => field.onChange(v)}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
            <TextField
              control={form.control}
              name="title"
              label="Title"
              required
              className="w-40"
            />
            <TextField
              control={form.control}
              name="description"
              label="Description"
              required
              className="w-48"
            />
            <SelectField
              control={form.control}
              name="priority"
              label="Priority"
              options={PRIORITY_OPTIONS}
              placeholder="--"
              className="w-28"
            />
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
          </form>
        </Form>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => {
            setLoading(true);
            setPage(p);
          }}
        />
      )}
    </>
  );
}

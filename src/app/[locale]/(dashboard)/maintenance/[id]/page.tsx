'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { ServiceRequestOutput } from '@/types/maintenance';

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

const assignSchema = z.object({
  assigned_to_id: z.coerce.number().min(1),
});

const resolveSchema = z.object({
  cost: z.string().min(1),
  resolution_notes: z.string().min(1),
});

export default function ServiceRequestDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [request, setRequest] = useState<ServiceRequestOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const assignForm = useForm({ resolver: zodResolver(assignSchema) });
  const resolveForm = useForm({ resolver: zodResolver(resolveSchema) });

  useEffect(() => {
    apiFetch<ServiceRequestOutput>(`/service-requests/${params.id}/`)
      .then(setRequest)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  const handleAssign = async (data: { assigned_to_id: number }) => {
    setActionError(null);
    try {
      await apiFetch(`/service-requests/${params.id}/assign/`, { method: 'POST', body: data });
      const updated = await apiFetch<ServiceRequestOutput>(`/service-requests/${params.id}/`);
      setRequest(updated);
    } catch (_error) {
      setActionError(_error instanceof Error ? _error.message : 'Failed to assign');
    }
  };

  const handleResolve = async (data: { cost: string; resolution_notes: string }) => {
    setActionError(null);
    try {
      await apiFetch(`/service-requests/${params.id}/resolve/`, { method: 'POST', body: data });
      const updated = await apiFetch<ServiceRequestOutput>(`/service-requests/${params.id}/`);
      setRequest(updated);
    } catch (_error) {
      setActionError(_error instanceof Error ? _error.message : 'Failed to resolve');
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading...</p>;
  }
  if (!request) {
    return <p className="text-sm text-red-500">Request not found</p>;
  }

  return (
    <>
      <PageHeader title={request.title} backHref="/maintenance" />
      {actionError ? (
        <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{actionError}</p>
      ) : null}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Property</dt>
              <dd>{request.property_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Tenant</dt>
              <dd>{request.tenant_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Assigned To</dt>
              <dd>{request.assigned_to_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Priority</dt>
              <dd>
                <Badge variant={PRIORITY_VARIANT[request.priority] ?? 'default'}>
                  {request.priority}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <Badge variant={STATUS_VARIANT[request.status] ?? 'default'}>
                  {request.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Cost</dt>
              <dd>{request.cost ?? '--'}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Description</h3>
          <p className="text-sm text-neutral-700">{request.description}</p>
          {request.resolution_notes ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-neutral-500">Resolution Notes</h3>
              <p className="text-sm text-neutral-700">{request.resolution_notes}</p>
            </div>
          ) : null}
        </div>
      </div>
      {request.status !== 'resolved' && request.status !== 'cancelled' ? (
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-medium text-neutral-500">Assign Staff</h3>
            <form onSubmit={assignForm.handleSubmit(handleAssign)} className="flex items-end gap-3">
              <FormField
                label="Staff ID"
                error={assignForm.formState.errors.assigned_to_id?.message}
              >
                <input
                  type="number"
                  {...assignForm.register('assigned_to_id')}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </FormField>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Assign
              </button>
            </form>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-medium text-neutral-500">Resolve</h3>
            <form onSubmit={resolveForm.handleSubmit(handleResolve)} className="space-y-3">
              <FormField label="Cost" error={resolveForm.formState.errors.cost?.message} required>
                <input
                  {...resolveForm.register('cost')}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </FormField>
              <FormField
                label="Resolution Notes"
                error={resolveForm.formState.errors.resolution_notes?.message}
                required
              >
                <textarea
                  {...resolveForm.register('resolution_notes')}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </FormField>
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Resolve
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

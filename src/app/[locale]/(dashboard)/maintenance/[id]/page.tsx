'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/Textarea';
import { apiFetch } from '@/libs/api';
import { maintenanceStatusVariant, priorityVariant } from '@/libs/badges';
import type { ServiceRequestOutput } from '@/types/maintenance';

const assignSchema = z.object({
  assigned_to_id: z.coerce.number().min(1),
});

const resolveSchema = z.object({
  cost: z.string().min(1),
  resolution_notes: z.string().min(1),
});

/**
 * Service request detail page — view and act on a single maintenance request.
 * @param props - Component props containing the route params.
 * @returns The service request detail page component.
 */
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
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!request) {
    return <p className="text-sm text-danger">Request not found</p>;
  }

  return (
    <>
      <PageHeader title={request.title} backHref="/maintenance" />
      {actionError ? (
        <p className="mb-4 rounded-lg border border-danger/30 bg-danger-subtle p-3 text-sm text-danger">
          {actionError}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Property</dt>
              <dd>{request.property_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tenant</dt>
              <dd>{request.tenant_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Assigned To</dt>
              <dd>{request.assigned_to_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Priority</dt>
              <dd>
                <Badge variant={priorityVariant(request.priority)}>{request.priority}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={maintenanceStatusVariant(request.status)}>{request.status}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cost</dt>
              <dd>{request.cost ?? '--'}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Description</h3>
          <p className="text-sm text-foreground">{request.description}</p>
          {request.resolution_notes ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Resolution Notes</h3>
              <p className="text-sm text-foreground">{request.resolution_notes}</p>
            </div>
          ) : null}
        </div>
      </div>
      {request.status !== 'resolved' && request.status !== 'cancelled' ? (
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Assign Staff</h3>
            <form onSubmit={assignForm.handleSubmit(handleAssign)} className="flex items-end gap-3">
              <FormField
                label="Staff ID"
                error={assignForm.formState.errors.assigned_to_id?.message}
              >
                <Input type="number" {...assignForm.register('assigned_to_id')} />
              </FormField>
              <Button type="submit">Assign</Button>
            </form>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Resolve</h3>
            <form onSubmit={resolveForm.handleSubmit(handleResolve)} className="space-y-3">
              <FormField label="Cost" error={resolveForm.formState.errors.cost?.message} required>
                <Input {...resolveForm.register('cost')} />
              </FormField>
              <FormField
                label="Resolution Notes"
                error={resolveForm.formState.errors.resolution_notes?.message}
                required
              >
                <Textarea {...resolveForm.register('resolution_notes')} rows={2} />
              </FormField>
              <Button type="submit" intent="primary">
                Resolve
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

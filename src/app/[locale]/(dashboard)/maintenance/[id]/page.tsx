'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StaffSelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import { EntityField, TextField, TextareaField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { maintenanceStatusVariant, priorityVariant } from '@/libs/badges';
import { createApiSubmit } from '@/libs/forms';
import type { ServiceRequestOutput } from '@/types/maintenance';

const assignSchema = z.object({
  assigned_to_id: z.coerce.number().min(1, 'Staff is required'),
});

const resolveSchema = z.object({
  cost: z.coerce.number().positive('Cost must be greater than 0'),
  resolution_notes: z.string().min(1, 'Resolution notes are required'),
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

  const assignForm = useForm({ resolver: zodResolver(assignSchema) });
  const resolveForm = useForm({ resolver: zodResolver(resolveSchema) });

  const loadRequest =  async () =>
    apiFetch<ServiceRequestOutput>(`/maintenance/requests/${params.id}/`).then(setRequest);

  useEffect(() => {
    loadRequest()
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleAssign = createApiSubmit(assignForm, {
    submit:  async (values) =>
      apiFetch(`/maintenance/requests/${params.id}/assign/`, { method: 'POST', body: values }),
    success: 'Staff assigned',
    error: 'Failed to assign',
    onSuccess: async () => {
      assignForm.reset();
      await loadRequest();
    },
  });

  const handleResolve = createApiSubmit(resolveForm, {
    submit:  async (values) =>
      apiFetch(`/maintenance/requests/${params.id}/resolve/`, { method: 'POST', body: values }),
    success: 'Request resolved',
    error: 'Failed to resolve',
    onSuccess: async () => {
      resolveForm.reset();
      await loadRequest();
    },
  });

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!request) {
    return <p className="text-sm text-danger">Request not found</p>;
  }

  return (
    <>
      <PageHeader title={request.title} backHref="/maintenance" />
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
            <Form {...assignForm}>
              <form onSubmit={handleAssign} className="flex items-end gap-3">
                <EntityField
                  control={assignForm.control}
                  name="assigned_to_id"
                  label="Staff"
                  className="flex-1"
                >
                  {(field, invalid) => (
                    <StaffSelect
                      id="assigned_to_id"
                      value={field.value as number | null | undefined}
                      onChange={field.onChange}
                      aria-invalid={invalid}
                    />
                  )}
                </EntityField>
                <Button type="submit" disabled={assignForm.formState.isSubmitting}>
                  {assignForm.formState.isSubmitting ? (
                    <Loader2Icon className="animate-spin" />
                  ) : null}
                  {assignForm.formState.isSubmitting ? 'Assigning…' : 'Assign'}
                </Button>
              </form>
            </Form>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Resolve</h3>
            <Form {...resolveForm}>
              <form onSubmit={handleResolve} className="space-y-3">
                <TextField
                  control={resolveForm.control}
                  name="cost"
                  label="Cost"
                  type="number"
                  step="0.01"
                  required
                />
                <TextareaField
                  control={resolveForm.control}
                  name="resolution_notes"
                  label="Resolution Notes"
                  rows={2}
                  required
                />
                <Button
                  type="submit"
                  variant="default"
                  disabled={resolveForm.formState.isSubmitting}
                >
                  {resolveForm.formState.isSubmitting ? (
                    <Loader2Icon className="animate-spin" />
                  ) : null}
                  {resolveForm.formState.isSubmitting ? 'Resolving…' : 'Resolve'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      ) : null}
    </>
  );
}

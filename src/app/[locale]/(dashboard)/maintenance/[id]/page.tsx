'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DetailCard,
  DetailError,
  DetailGrid,
  DetailList,
  DetailLoading,
  DetailRow,
  DetailText,
} from '@/components/ui/detail';
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

  const loadRequest = async () =>
    await apiFetch<ServiceRequestOutput>(`/maintenance/requests/${params.id}/`).then(setRequest);

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
    submit: async (values) =>
      await apiFetch(`/maintenance/requests/${params.id}/assign/`, {
        method: 'POST',
        body: values,
      }),
    success: 'Staff assigned',
    error: 'Failed to assign',
    onSuccess: async () => {
      assignForm.reset();
      await loadRequest();
    },
  });

  const handleResolve = createApiSubmit(resolveForm, {
    submit: async (values) =>
      await apiFetch(`/maintenance/requests/${params.id}/resolve/`, {
        method: 'POST',
        body: values,
      }),
    success: 'Request resolved',
    error: 'Failed to resolve',
    onSuccess: async () => {
      resolveForm.reset();
      await loadRequest();
    },
  });

  if (loading) {
    return <DetailLoading />;
  }
  if (!request) {
    return <DetailError message="Request not found" />;
  }

  return (
    <>
      <PageHeader
        title={request.title}
        backHref="/maintenance"
        actions={<Badge variant={maintenanceStatusVariant(request.status)}>{request.status}</Badge>}
      />
      <DetailGrid>
        <DetailCard title="Details">
          <DetailList>
            <DetailRow label="Property" value={request.property_id} />
            <DetailRow label="Tenant" value={request.tenant_id} />
            <DetailRow label="Assigned To" value={request.assigned_to_id} />
            <DetailRow
              label="Priority"
              value={<Badge variant={priorityVariant(request.priority)}>{request.priority}</Badge>}
            />
            <DetailRow
              label="Status"
              value={
                <Badge variant={maintenanceStatusVariant(request.status)}>{request.status}</Badge>
              }
            />
            <DetailRow label="Cost" value={request.cost} />
          </DetailList>
        </DetailCard>
        <DetailCard title="Description">
          <div className="space-y-4">
            <DetailText>{request.description}</DetailText>
            {request.resolution_notes ? (
              <DetailText title="Resolution Notes">{request.resolution_notes}</DetailText>
            ) : null}
          </div>
        </DetailCard>
      </DetailGrid>
      {request.status !== 'resolved' && request.status !== 'cancelled' ? (
        <DetailGrid className="mt-6">
          <DetailCard title="Assign Staff">
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
          </DetailCard>
          <DetailCard title="Resolve">
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
          </DetailCard>
        </DetailGrid>
      ) : null}
    </>
  );
}

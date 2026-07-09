'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { MethodSegmented } from '@/components/management/MethodSegmented';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PropertySelect, StaffSelect, TenantSelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  assignServiceRequest,
  cancelServiceRequest,
  createServiceRequest,
  resolveServiceRequest,
} from '@/libs/management/maintenanceAdapter';
import { cn } from '@/libs/utils';
import type { ManagementServiceRequestOutput } from '@/types/management';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

/**
 * The "Assign technician" dialog — picks a management/staff user (no dedicated
 * technician role exists yet) → `assignServiceRequest`, which moves the request
 * to In Progress.
 * @param props - The request, open state, change handler, and success callback.
 * @returns The assign dialog element (or null with no request).
 */
export function AssignTechnicianDialog(props: {
  request: ManagementServiceRequestOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { request } = props;
  const [userId, setUserId] = useState<number | null>(request?.assigned_to_id ?? null);
  const [busy, setBusy] = useState(false);

  if (!request) {
    return null;
  }

  const submit = async () => {
    if (!userId) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await assignServiceRequest(request.id, userId);
      toast.success(t('mnt_assign_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('mnt_assign_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('mnt_assign_title')}</DialogTitle>
          <DialogDescription>{t('mnt_assign_desc', { title: request.title })}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>{t('mnt_assign_field')}</Label>
          <StaffSelect value={userId} onChange={setUserId} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('mnt_assign_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Resolve request" dialog — cost, cost bearer (owner / platform), and
 * resolution notes → `resolveServiceRequest`, which stamps `resolved_at`.
 * @param props - The request, open state, change handler, and success callback.
 * @returns The resolve dialog element (or null with no request).
 */
export function ResolveRequestDialog(props: {
  request: ManagementServiceRequestOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { request } = props;
  const [cost, setCost] = useState('');
  const [bearer, setBearer] = useState('owner');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  if (!request) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await resolveServiceRequest(request.id, {
        cost: cost || '0',
        resolution_notes: notes,
        cost_bearer: bearer,
      });
      toast.success(t('mnt_resolve_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('mnt_resolve_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('mnt_resolve_title')}</DialogTitle>
          <DialogDescription>{t('mnt_resolve_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mnt-cost">{t('mnt_field_cost')}</Label>
              <Input
                id="mnt-cost"
                inputMode="decimal"
                placeholder="$0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
            <MethodSegmented
              label={t('mnt_field_bearer')}
              options={[
                { value: 'owner', label: t('mnt_bearer_owner') },
                { value: 'platform', label: t('mnt_bearer_platform') },
              ]}
              value={bearer}
              onChange={setBearer}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mnt-notes">{t('mnt_field_resolution')}</Label>
            <Textarea id="mnt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('mnt_resolve_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "New maintenance request" dialog — property, tenant, title, description,
 * and a priority chip grid → `createServiceRequest`.
 * @param props - Open state, change handler, and success callback.
 * @returns The new-request dialog element.
 */
export function NewRequestDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!propertyId || !tenantId || !title) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await createServiceRequest({
        property_id: propertyId,
        tenant_id: tenantId,
        title,
        description,
        priority,
      });
      toast.success(t('mnt_new_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('mnt_new_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('mnt_new_title')}</DialogTitle>
          <DialogDescription>{t('mnt_new_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('mnt_col_property')} *</Label>
            <PropertySelect value={propertyId} onChange={setPropertyId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('mnt_col_tenant')} *</Label>
            <TenantSelect value={tenantId} onChange={setTenantId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('mnt_field_priority')}</Label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'rounded-[10px] border px-3.5 py-2 text-sm font-medium transition-colors',
                    priority === p
                      ? 'border-transparent bg-primary-subtle text-primary-subtle-foreground'
                      : 'border-border text-muted-foreground hover:border-ring/40',
                  )}
                >
                  {t(`priority_${p}` as never)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mnt-title">{t('mnt_field_title')} *</Label>
            <Input id="mnt-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mnt-desc">{t('mnt_field_description')}</Label>
            <Textarea
              id="mnt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('mnt_new_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The destructive "Cancel request" dialog — consequences plus an optional reason
 * → `cancelServiceRequest`.
 * @param props - The request, open state, change handler, and success callback.
 * @returns The cancel dialog element (or null with no request).
 */
export function CancelRequestDialog(props: {
  request: ManagementServiceRequestOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { request } = props;
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!request) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await cancelServiceRequest(request.id, reason || undefined);
      toast.success(t('mnt_cancel_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('mnt_cancel_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('mnt_cancel_q', { number: `SRQ-${request.id}` })}</DialogTitle>
          <DialogDescription>{request.title}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 rounded-[10px] bg-danger-subtle px-3.5 py-3 text-xs text-danger-subtle-foreground">
          <li>{t('mnt_cancel_c1')}</li>
          <li>{t('mnt_cancel_c2')}</li>
          <li>{t('mnt_cancel_c3')}</li>
        </ul>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mnt-cancel-reason">{t('mnt_cancel_reason')}</Label>
          <Textarea
            id="mnt-cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('mnt_keep_request')}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {t('mnt_cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

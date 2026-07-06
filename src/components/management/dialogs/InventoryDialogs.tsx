'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LeaseSelect, PropertySelect } from '@/components/ui/entity-selects';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ACT_TYPES, createAct, finalizeAct } from '@/libs/management/inventoryAdapter';
import { cn } from '@/libs/utils';
import type { InventoryActListOutput } from '@/types/management';

/**
 * The "New act" creation dialog — property, act type (handover / return /
 * general), an optional lease, and notes → `createAct`. Errors surface as a
 * toast; on success it closes and notifies the caller to refetch.
 * @param props - Open state, change handler, and success callback.
 * @returns The new-act dialog element.
 */
export function NewActDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  typeLabel: (type: string) => string;
}) {
  const t = useTranslations('Management');
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [actType, setActType] = useState<string>('handover');
  const [leaseId, setLeaseId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!propertyId) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await createAct({
        property_id: propertyId,
        act_type: actType,
        lease_id: leaseId,
        notes: notes || null,
      });
      toast.success(t('inv_created'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('inv_create_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('inv_new')}</DialogTitle>
          <DialogDescription>{t('inv_new_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_property')} *</Label>
            <PropertySelect value={propertyId} onChange={setPropertyId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('inv_field_type')} *</Label>
            <div className="grid grid-cols-3 gap-2">
              {ACT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActType(type)}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-[10px] border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                    actType === type
                      ? 'border-transparent bg-primary-subtle text-primary-subtle-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  {props.typeLabel(type)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('inv_field_lease')}</Label>
            <LeaseSelect value={leaseId} onChange={setLeaseId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="act-notes">{t('inv_field_notes')}</Label>
            <Textarea
              id="act-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('inv_notes_ph')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('inv_create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Finalize act" confirmation dialog — a warning-toned list of consequences
 * plus an explicit acknowledgment checkbox → `finalizeAct`. Finalizing is a
 * constructive step (it locks the condition passport), so the confirm uses the
 * default primary button, not a destructive one.
 * @param props - The act, open state, change handler, and success callback.
 * @returns The finalize-act dialog element (or null with no act).
 */
export function FinalizeActDialog(props: {
  act: InventoryActListOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { act } = props;
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!act) {
    return null;
  }

  const submit = async () => {
    if (!ack) {
      return;
    }
    setBusy(true);
    try {
      await finalizeAct(act.id);
      toast.success(t('inv_finalized'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('inv_finalize_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('inv_finalize_q')}</DialogTitle>
          <DialogDescription>
            {t('inv_finalize_desc', { id: act.id, property: act.property_name })}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 rounded-[10px] bg-warning-subtle px-3.5 py-3 text-xs text-warning-subtle-foreground">
          <li>{t('inv_finalize_c1')}</li>
          <li>{t('inv_finalize_c2')}</li>
          <li>{t('inv_finalize_c3')}</li>
        </ul>
        <label className="flex items-center gap-2.5 text-sm text-foreground">
          <Checkbox checked={ack} onCheckedChange={(value) => setAck(value === true)} />
          {t('inv_finalize_ack')}
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy || !ack}>
            {t('inv_finalize')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

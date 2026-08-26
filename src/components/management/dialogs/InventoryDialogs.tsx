'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { acknowledgeAct } from '@/libs/management/inventoryAdapter';
import type { InventoryActListOutput, InventoryActOutput } from '@/types/management';

/**
 * The "Acknowledge act" dialog — records counterparty acknowledgment for a finalized act.
 * @param props - The act, open state, change handler, and success callback.
 * @returns The acknowledge-act dialog element.
 */
export function AcknowledgeActDialog(props: {
  act: InventoryActListOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (act: InventoryActOutput) => void;
}) {
  const t = useTranslations('Management');
  const { act } = props;
  const [ackName, setAckName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!act) {
    return null;
  }

  const submit = async () => {
    if (!ackName.trim()) {
      toast.error(t('inv_ack_name_required'));
      return;
    }
    setBusy(true);
    try {
      const acknowledgedAct = await acknowledgeAct(act.id, {
        acknowledged_by_name: ackName.trim(),
        acknowledgment_note: note.trim() || null,
      });
      toast.success(t('inv_acknowledge_success'));
      props.onSuccess(acknowledgedAct);
      props.onOpenChange(false);
      setAckName('');
      setNote('');
    } catch {
      toast.error(t('inv_acknowledge_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('inv_acknowledge')}</DialogTitle>
          <DialogDescription>
            {t('inv_acknowledge_desc', { id: act.id, property: act.property_name })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ack-name">{t('inv_ack_name_label')} *</Label>
            <Input
              id="ack-name"
              value={ackName}
              onChange={(e) => setAckName(e.target.value)}
              placeholder={t('inv_ack_name_placeholder')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ack-notes">{t('inv_ack_note_label')}</Label>
            <Textarea
              id="ack-notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('inv_ack_note_placeholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy || !ackName.trim()}>
            {busy ? t('inv_ack_recording') : t('inv_ack_record')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

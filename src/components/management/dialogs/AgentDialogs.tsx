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
import { PropertySelect, UserSelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createAgent, recordDeal, updateAgent } from '@/libs/management/agentsAdapter';
import type { AgentOutput } from '@/types/management';

const TODAY = () => new Date().toISOString().slice(0, 10);

/**
 * The "Record deal" dialog — property, deal date, rent amount, and status →
 * `recordDeal(agent.id, …)`. Errors surface as a toast; on success it closes
 * and notifies the caller to refetch.
 * @param props - The agent, open state, change handler, and success callback.
 * @returns The record-deal dialog element (or null with no agent).
 */
export function RecordDealDialog(props: {
  agent: AgentOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { agent } = props;
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [dealDate, setDealDate] = useState(TODAY());
  const [rentAmount, setRentAmount] = useState('');
  const [status, setStatus] = useState('closed');
  const [busy, setBusy] = useState(false);

  if (!agent) {
    return null;
  }

  const submit = async () => {
    if (!propertyId || !rentAmount) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await recordDeal(agent.id, {
        property_id: propertyId,
        deal_date: dealDate,
        rent_amount: rentAmount,
        status,
      });
      toast.success(t('agt_deal_recorded'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('agt_deal_record_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('agt_record_deal')}</DialogTitle>
          <DialogDescription>
            {t('agt_record_deal_desc', { name: agent.user_name })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('field_property')} *</Label>
            <PropertySelect value={propertyId} onChange={setPropertyId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-date">{t('agt_field_deal_date')}</Label>
              <Input
                id="deal-date"
                type="date"
                value={dealDate}
                onChange={(event) => setDealDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-rent">{t('agt_field_rent_amount')} *</Label>
              <Input
                id="deal-rent"
                inputMode="decimal"
                placeholder="$0"
                value={rentAmount}
                onChange={(event) => setRentAmount(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('agt_field_deal_status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="closed">{t('agt_deal_closed')}</SelectItem>
                <SelectItem value="pending">{t('agt_deal_pending')}</SelectItem>
                <SelectItem value="cancelled">{t('agt_deal_cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('agt_record_deal')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "New agent" creation dialog — user (role agent), commission rate, and an
 * active flag → `createAgent`. Errors surface as a toast; on success it closes
 * and notifies the caller to refetch.
 * @param props - Open state, change handler, and success callback.
 * @returns The new-agent dialog element.
 */
export function NewAgentDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const [userId, setUserId] = useState<number | null>(null);
  const [commissionRate, setCommissionRate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!userId || !commissionRate) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await createAgent({
        user_id: userId,
        commission_rate: commissionRate,
        is_active: isActive,
      });
      toast.success(t('agt_created'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('agt_create_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('agt_new_agent')}</DialogTitle>
          <DialogDescription>{t('agt_new_agent_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('agt_field_user')} *</Label>
            <UserSelect value={userId} onChange={setUserId} placeholder={t('agt_field_user_ph')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-commission">{t('agt_field_commission_rate')} *</Label>
            <Input
              id="agent-commission"
              inputMode="decimal"
              placeholder="0"
              value={commissionRate}
              onChange={(event) => setCommissionRate(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={isActive} onCheckedChange={(value) => setIsActive(value === true)} />
            {t('agt_field_is_active')}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('agt_create_agent')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Edit agent" dialog — commission rate and active flag → `updateAgent`.
 * Pre-fills from the selected agent.
 * @param props - The agent, open state, change handler, and success callback.
 * @returns The edit-agent dialog element (or null with no agent).
 */
export function EditAgentDialog(props: {
  agent: AgentOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { agent } = props;
  const [commissionRate, setCommissionRate] = useState(agent?.commission_rate ?? '');
  const [isActive, setIsActive] = useState(agent?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  if (!agent) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await updateAgent(agent.id, {
        commission_rate: commissionRate || agent.commission_rate,
        is_active: isActive,
      });
      toast.success(t('agt_updated'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('agt_update_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('agt_edit_agent')}</DialogTitle>
          <DialogDescription>
            {t('agt_edit_agent_desc', { name: agent.user_name })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-commission">{t('agt_field_commission_rate')} *</Label>
            <Input
              id="edit-commission"
              inputMode="decimal"
              value={commissionRate}
              onChange={(event) => setCommissionRate(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={isActive} onCheckedChange={(value) => setIsActive(value === true)} />
            {t('agt_field_is_active')}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('agt_save_agent')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

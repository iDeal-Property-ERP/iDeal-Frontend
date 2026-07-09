'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
import { PropertySelect, TenantSelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createCatalogItem,
  createVasOrder,
  setVasOrderStatus,
  updateCatalogItem,
} from '@/libs/management/servicesAdapter';
import type { ServiceCatalogItemOutput, ServiceOrderOutput } from '@/types/vas';

const SERVICE_TYPES = ['cleaning', 'handyman', 'utility', 'internet', 'moving', 'other'];

/**
 * The "Add / edit catalog item" dialog per the Figma design — name, service
 * type, partner, price, commission %, cashback %, description, and an active
 * switch. Creates when `item` is null, patches otherwise.
 * @param props - The item to edit (or null), open state, and callbacks.
 * @returns The catalog item dialog element.
 */
export function CatalogItemDialog(props: {
  item: ServiceCatalogItemOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { item } = props;
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('cleaning');
  const [partner, setPartner] = useState('');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('');
  const [cashback, setCashback] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    setName(item?.name ?? '');
    setServiceType(item?.service_type ?? 'cleaning');
    setPartner(item?.partner_name ?? '');
    setPrice(item?.base_price ?? '');
    setCommission(item?.commission_rate ?? '');
    setCashback(item?.cashback_rate ?? '');
    setDescription(item?.description ?? '');
    setIsActive(item?.is_active ?? true);
  }, [props.open, item]);

  const submit = async () => {
    if (!name || !price) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    const payload = {
      name,
      service_type: serviceType as ServiceCatalogItemOutput['service_type'],
      partner_name: partner || undefined,
      base_price: price,
      commission_rate: commission || undefined,
      cashback_rate: cashback || undefined,
      description: description || undefined,
      is_active: isActive,
    };
    try {
      await (item ? updateCatalogItem(item.id, payload) : createCatalogItem(payload));
      toast.success(t('svc_item_saved'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('svc_item_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{item ? t('svc_item_edit_title') : t('svc_item_add_title')}</DialogTitle>
          <DialogDescription>{t('svc_item_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('svc_field_type')}</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`vas_type_${type}` as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-name">{t('svc_field_name')}</Label>
              <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-partner">{t('svc_field_partner')}</Label>
              <Input
                id="svc-partner"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-price">{t('svc_field_price')}</Label>
              <Input
                id="svc-price"
                inputMode="decimal"
                placeholder="$0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-commission">{t('svc_field_commission')}</Label>
              <Input
                id="svc-commission"
                inputMode="decimal"
                placeholder="12"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-cashback">{t('svc_field_cashback')}</Label>
              <Input
                id="svc-cashback"
                inputMode="decimal"
                placeholder="3"
                value={cashback}
                onChange={(e) => setCashback(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-desc">{t('svc_field_description')}</Label>
            <Textarea
              id="svc-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <MethodSegmented
            label={t('svc_field_active')}
            value={isActive ? 'active' : 'inactive'}
            onChange={(v) => setIsActive(v === 'active')}
            options={[
              { value: 'active', label: t('svc_active') },
              { value: 'inactive', label: t('svc_inactive') },
            ]}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('svc_item_save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "New service order" dialog — catalog item, tenant, property, optional
 * cost override (defaults server-side to the base price), scheduled date, and
 * notes, per the Figma design.
 * @param props - The catalog for the service select, open state, and callbacks.
 * @returns The new order dialog element.
 */
export function NewOrderDialog(props: {
  catalog: ServiceCatalogItemOutput[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const [itemId, setItemId] = useState<string>('');
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [cost, setCost] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedItem = props.catalog.find((c) => String(c.id) === itemId) ?? null;

  const submit = async () => {
    if (!itemId || !tenantId || !propertyId) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await createVasOrder({
        catalog_item_id: Number(itemId),
        tenant_id: tenantId,
        property_id: propertyId,
        cost: cost || undefined,
        scheduled_for: scheduledFor || undefined,
        notes: notes || undefined,
      });
      toast.success(t('svc_order_created'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('svc_order_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('svc_new_order_title')}</DialogTitle>
          <DialogDescription>{t('svc_new_order_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('svc_field_service')}</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder={t('svc_field_service_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {props.catalog
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} — ${c.base_price}
                      {c.partner_name ? ` · ${c.partner_name}` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t('svc_field_tenant')}</Label>
              <TenantSelect value={tenantId} onChange={setTenantId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('svc_field_property')}</Label>
              <PropertySelect value={propertyId} onChange={setPropertyId} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-order-cost">{t('svc_field_cost')}</Label>
              <Input
                id="svc-order-cost"
                inputMode="decimal"
                placeholder={selectedItem ? `$${selectedItem.base_price}` : '$0'}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-order-date">{t('svc_field_scheduled')}</Label>
              <Input
                id="svc-order-date"
                type="date"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-order-notes">{t('svc_field_notes')}</Label>
            <Textarea
              id="svc-order-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('svc_place_order')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Confirm & schedule order" dialog — confirms a new order (optionally
 * setting/adjusting the scheduled date first), per the Figma design.
 * @param props - The order, open state, and callbacks.
 * @returns The confirm dialog element (or null with no order).
 */
export function ConfirmScheduleDialog(props: {
  order: ServiceOrderOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { order } = props;
  const [busy, setBusy] = useState(false);

  if (!order) {
    return null;
  }

  const submit = async () => {
    setBusy(true);
    try {
      await setVasOrderStatus(order.id, 'confirmed');
      toast.success(t('svc_confirm_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('svc_confirm_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('svc_confirm_title', { id: order.id })}</DialogTitle>
          <DialogDescription>
            {order.catalog_item_name} · {order.property_name} · {order.tenant_name}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 rounded-[10px] bg-muted px-3.5 py-3 text-sm text-muted-foreground">
          <li>{t('svc_confirm_line_tenant')}</li>
          {order.partner_name ? (
            <li>{t('svc_confirm_line_partner', { partner: order.partner_name })}</li>
          ) : null}
          <li>{t('svc_confirm_line_commission', { amount: `$${order.commission_earned}` })}</li>
        </ul>
        <div className="text-sm text-muted-foreground">
          {order.scheduled_for
            ? t('svc_confirm_scheduled_for', { date: order.scheduled_for })
            : t('svc_alert_unscheduled')}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('svc_not_yet')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('svc_confirm_order')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Cancel order" dialog — destructive confirm with a required reason,
 * per the Figma design (no commission accrues; the order stays in history).
 * @param props - The order, open state, and callbacks.
 * @returns The cancel dialog element (or null with no order).
 */
export function CancelOrderDialog(props: {
  order: ServiceOrderOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { order } = props;
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!order) {
    return null;
  }

  const submit = async () => {
    if (!reason.trim()) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await setVasOrderStatus(order.id, 'cancelled', reason.trim());
      toast.success(t('svc_cancel_toast'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('svc_cancel_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('svc_cancel_title', { id: order.id })}</DialogTitle>
          <DialogDescription>
            {order.catalog_item_name} · {order.property_name} · {order.tenant_name}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 rounded-[10px] bg-muted px-3.5 py-3 text-sm text-muted-foreground">
          <li>{t('svc_cancel_line_tenant')}</li>
          <li>{t('svc_cancel_line_commission')}</li>
          <li>{t('svc_cancel_line_history')}</li>
        </ul>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-cancel-reason">{t('svc_field_reason')}</Label>
          <Textarea
            id="svc-cancel-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('svc_reason_placeholder')}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('svc_keep_order')}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {t('svc_cancel_order')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

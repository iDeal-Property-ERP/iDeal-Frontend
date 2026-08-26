'use client';

import { CheckCircle2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailError, DetailLoading } from '@/components/ui/detail';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/libs/forms';
import { acknowledgeAct, getAct } from '@/libs/management/inventoryAdapter';
import type { InventoryActOutput } from '@/types/management';

function conditionLabel(
  t: ReturnType<typeof useTranslations<'Management'>>,
  condition: string,
): string {
  // SAFETY: Condition rating matches valid ConditionRating string
  return t(`inv_condition_${condition.toLowerCase()}` as 'inv_condition_good');
}

/**
 * Inventory act detail page for finalized acts and counterparty acknowledgment.
 * @returns Inventory act detail page.
 */
export default function InventoryActDetailPage() {
  const t = useTranslations('Management');
  const format = useFormatter();
  const params = useParams<{ id: string }>();
  const [act, setAct] = useState<InventoryActOutput | null>(null);
  const [ackName, setAckName] = useState('');
  const [ackNote, setAckNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    const data = await getAct(Number(params.id));
    setAct(data);
  }, [params.id]);

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } catch (error) {
        setLoadError(true);
        toast.error(getApiErrorMessage(error, t('inv_load_failed')));
      }
    };
    void run();
  }, [load, t]);

  const onAcknowledge = async () => {
    if (!ackName.trim()) {
      toast.error(t('inv_ack_name_required'));
      return;
    }
    setBusy(true);
    try {
      await acknowledgeAct(Number(params.id), {
        acknowledged_by_name: ackName.trim(),
        acknowledgment_note: ackNote.trim() || null,
      });
      await load();
      toast.success(t('inv_finalized'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('inv_finalize_failed')));
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return <DetailError message={t('inv_load_failed')} />;
  }

  if (!act) {
    return <DetailLoading />;
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${t('inv_code', { id: act.id })} — ${act.property_name}`}
        backHref="/management/inventory"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success">{t('inv_status_finalized')}</Badge>
            {act.acknowledged_at ? (
              <Badge variant="outline" className="gap-1 text-success">
                <CheckCircle2 className="size-3" /> {t('inv_status_acknowledged')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-warning">
                {t('inv_status_awaiting_ack')}
              </Badge>
            )}
          </div>
        }
      />

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{t('inv_act_info')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-xs text-muted-foreground">{t('inv_field_type')}</span>
            <span className="font-medium capitalize">{act.act_type}</span>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">{t('inv_finalized_date')}</span>
            <span className="font-medium">
              {act.finalized_at
                ? format.dateTime(new Date(act.finalized_at), { dateStyle: 'medium' })
                : '—'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">{t('inv_field_notes')}</span>
            <span className="font-medium">{act.notes ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            {t('inv_tab_items')} ({act.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="divide-y divide-border rounded-lg border border-border">
            {act.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-foreground">{item.area}</span>
                  {item.notes ? (
                    <p className="text-xs text-muted-foreground">{item.notes}</p>
                  ) : null}
                </div>
                <Badge
                  variant={
                    item.condition === 'damaged' || item.condition === 'poor' ? 'danger' : 'outline'
                  }
                >
                  {conditionLabel(t, item.condition)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photos Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            {t('inv_tab_photos')} ({act.photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {act.photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('inv_empty_photos')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {act.photos.map((p) => (
                <div key={p.id} className="space-y-1.5">
                  <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image_url ?? ''}
                      alt={p.caption ?? t('inv_photo_alt')}
                      className="size-full object-cover"
                    />
                  </div>
                  {p.caption ? (
                    <p className="truncate text-xs text-muted-foreground">{p.caption}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acknowledgment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{t('inv_counterparty_ack')}</CardTitle>
        </CardHeader>
        <CardContent>
          {act.acknowledged_at ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {t('inv_ack_by_on', {
                  name: act.acknowledged_by_name ?? '',
                  date: format.dateTime(new Date(act.acknowledged_at), { dateStyle: 'medium' }),
                })}
              </p>
            </div>
          ) : (
            <div className="max-w-md space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ack-name">{t('inv_ack_name_label')} *</Label>
                <Input
                  id="ack-name"
                  value={ackName}
                  onChange={(e) => setAckName(e.target.value)}
                  placeholder={t('inv_ack_name_placeholder')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ack-note">{t('inv_ack_note_label')}</Label>
                <Textarea
                  id="ack-note"
                  rows={2}
                  value={ackNote}
                  onChange={(e) => setAckNote(e.target.value)}
                  placeholder={t('inv_ack_note_placeholder')}
                />
              </div>
              <Button onClick={onAcknowledge} disabled={busy || !ackName.trim()}>
                {busy ? t('inv_ack_recording') : t('inv_ack_record')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

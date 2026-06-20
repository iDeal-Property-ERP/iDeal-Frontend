'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailError, DetailLoading } from '@/components/ui/detail';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch, apiUpload } from '@/libs/api';
import { getApiErrorMessage } from '@/libs/forms';
import type { ConditionRating } from '@/types/enums';
import type { InventoryActItemInput, InventoryActOutput } from '@/types/inventory';

const CONDITIONS: ConditionRating[] = ['excellent', 'good', 'fair', 'poor', 'damaged'];

/**
 * Inventory act detail: edit items, upload photos, and finalize.
 * @returns Inventory act detail page.
 */
export default function InventoryActDetailPage() {
  const t = useTranslations('Pages');
  const params = useParams<{ id: string }>();
  const [act, setAct] = useState<InventoryActOutput | null>(null);
  const [items, setItems] = useState<InventoryActItemInput[]>([]);
  const [ackName, setAckName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch<InventoryActOutput>(`/inventory/acts/${params.id}/`);
    setAct(data);
    setItems(
      data.items.map((i) => ({ area: i.area, condition: i.condition, notes: i.notes ?? '' })),
    );
  }, [params.id]);

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } catch (error) {
        setLoadError(true);
        toast.error(getApiErrorMessage(error, 'Failed to load inventory act'));
      }
    };
    void run();
  }, [load]);

  const isDraft = act?.status === 'draft';

  async function saveItems() {
    setBusy(true);
    try {
      await apiFetch(`/inventory/acts/${params.id}/items/`, {
        method: 'POST',
        body: { items: items.filter((i) => i.area.trim()) },
      });
      await load();
      toast.success('Items saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save items'));
    }
    setBusy(false);
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      for (const f of files) {
        fd.append('images', f);
      }
      await apiUpload(`/inventory/acts/${params.id}/photos/`, fd);
      await load();
      toast.success('Photos uploaded');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload photos'));
    }
    setBusy(false);
  }

  async function finalize() {
    setBusy(true);
    try {
      await apiFetch(`/inventory/acts/${params.id}/finalize/`, {
        method: 'POST',
        body: { acknowledged_by_name: ackName || undefined },
      });
      await load();
      toast.success('Inventory act finalized');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to finalize act'));
    }
    setBusy(false);
  }

  if (loadError) {
    return <DetailError message="Failed to load inventory act." />;
  }

  if (!act) {
    return <DetailLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('inventory_act')} #${act.id} — ${act.property_name}`}
        backHref="/management/inventory"
        actions={<Badge>{act.status}</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('inventory_items')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder={t('inventory_area')}
                value={item.area}
                disabled={!isDraft}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, area: e.target.value };
                  setItems(next);
                }}
              />
              <Select
                value={item.condition}
                disabled={!isDraft}
                onValueChange={(value) => {
                  const next = [...items];
                  next[idx] = { ...item, condition: value as ConditionRating };
                  setItems(next);
                }}
              >
                <SelectTrigger className="sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={t('inventory_notes')}
                value={item.notes ?? ''}
                disabled={!isDraft}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, notes: e.target.value };
                  setItems(next);
                }}
              />
            </div>
          ))}
          {isDraft ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setItems([...items, { area: '', condition: 'good', notes: '' }]);
                }}
              >
                {t('inventory_add_item')}
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => {
                  void saveItems();
                }}
              >
                {t('inventory_save_items')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('inventory_photos')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {act.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.image_url ?? ''}
                alt={p.caption ?? 'photo'}
                className="size-24 rounded-md object-cover"
              />
            ))}
            {act.photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('inventory_no_photos')}</p>
            ) : null}
          </div>
          {isDraft ? (
            <Input
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              onChange={(e) => {
                void uploadPhotos(e.target.files);
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      {isDraft ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('inventory_finalize')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={t('inventory_ack_name')}
              value={ackName}
              onChange={(e) => {
                setAckName(e.target.value);
              }}
              className="max-w-sm"
            />
            <Button
              disabled={busy}
              onClick={() => {
                void finalize();
              }}
            >
              {t('inventory_finalize_btn')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            {t('inventory_finalized_on')}: {act.finalized_at}
            {act.acknowledged_by_name ? ` — ${act.acknowledged_by_name}` : ''}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

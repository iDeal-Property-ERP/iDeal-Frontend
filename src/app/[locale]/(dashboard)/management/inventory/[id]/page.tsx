'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { apiFetch, apiUpload } from '@/libs/api';
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

  const load = useCallback(async () => {
    const data = await apiFetch<InventoryActOutput>(`/inventory/acts/${params.id}/`);
    setAct(data);
    setItems(
      data.items.map((i) => ({ area: i.area, condition: i.condition, notes: i.notes ?? '' })),
    );
  }, [params.id]);

  useEffect(() => {
    load().catch(() => {
      void 0;
    });
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
    } catch {
      void 0;
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
    } catch {
      void 0;
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
    } catch {
      void 0;
    }
    setBusy(false);
  }

  if (!act) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('inventory_act')} #${act.id} — ${act.property_name}`}
        backHref="/management/inventory"
        actions={<Badge>{act.status}</Badge>}
      />

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">{t('inventory_items')}</h3>
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
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...item, condition: e.target.value as ConditionRating };
                setItems(next);
              }}
              className="sm:w-40"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
                saveItems().catch(() => {
                  void 0;
                });
              }}
            >
              {t('inventory_save_items')}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">{t('inventory_photos')}</h3>
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
              uploadPhotos(e.target.files).catch(() => {
                void 0;
              });
            }}
          />
        ) : null}
      </section>

      {isDraft ? (
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">{t('inventory_finalize')}</h3>
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
              finalize().catch(() => {
                void 0;
              });
            }}
          >
            {t('inventory_finalize_btn')}
          </Button>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {t('inventory_finalized_on')}: {act.finalized_at}
          {act.acknowledged_by_name ? ` — ${act.acknowledged_by_name}` : ''}
        </section>
      )}
    </div>
  );
}

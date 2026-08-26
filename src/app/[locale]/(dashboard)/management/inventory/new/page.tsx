'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaseSelect, PropertySelect } from '@/components/ui/entity-selects';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from '@/libs/I18nNavigation';
import { submitAct } from '@/libs/management/inventoryAdapter';
import type { ConditionRating } from '@/types/enums';

const CONDITIONS: ConditionRating[] = ['excellent', 'good', 'fair', 'poor', 'damaged'];

const ACT_TYPES = [
  { value: 'handover', labelKey: 'inv_type_handover' as const },
  { value: 'return', labelKey: 'inv_type_return' as const },
  { value: 'general', labelKey: 'inv_type_general' as const },
];

type ItemRow = {
  area: string;
  condition: ConditionRating;
  notes: string;
};

type PhotoRow = {
  file: File;
  previewUrl: string;
  caption: string;
  itemIndex?: number;
};

function conditionLabel(
  t: ReturnType<typeof useTranslations<'Management'>>,
  condition: string,
): string {
  // SAFETY: Condition rating matches valid ConditionRating string
  return t(`inv_condition_${condition.toLowerCase()}` as 'inv_condition_good');
}

/**
 * Creates a finalized inventory act atomically in a single multipart request.
 * @returns New inventory act composer page.
 */
export default function NewInventoryActPage() {
  const t = useTranslations('Management');
  const router = useRouter();

  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [leaseId, setLeaseId] = useState<number | null>(null);
  const [actType, setActType] = useState('handover');
  const [notes, setNotes] = useState('');
  const [ackName, setAckName] = useState('');
  const [ackNote, setAckNote] = useState('');

  const [items, setItems] = useState<ItemRow[]>([{ area: '', condition: 'good', notes: '' }]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePropertyChange = (newPropertyId: number | null) => {
    if (newPropertyId !== propertyId) {
      setPropertyId(newPropertyId);
      setLeaseId(null);
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, { area: '', condition: 'good', notes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error(t('inv_error_min_item'));
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.itemIndex === undefined) {
          return p;
        }
        if (p.itemIndex === index) {
          return { ...p, itemIndex: undefined };
        }
        if (p.itemIndex > index) {
          return { ...p, itemIndex: p.itemIndex - 1 };
        }
        return p;
      }),
    );
  };

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const onAddPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const newPhotos: PhotoRow[] = [...files].map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, caption } : p)));
  };

  const updatePhotoItem = (index: number, itemIndex: number | undefined) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, itemIndex } : p)));
  };

  const onSubmit = async () => {
    if (!propertyId) {
      toast.error(t('inv_error_select_property'));
      return;
    }

    const itemIndexMap = new Map<number, number>();
    const validItems: ItemRow[] = [];
    for (const [oldIdx, item] of items.entries()) {
      if (item.area.trim().length > 0) {
        itemIndexMap.set(oldIdx, validItems.length);
        validItems.push(item);
      }
    }

    if (validItems.length === 0) {
      toast.error(t('inv_error_item_area'));
      return;
    }

    setSubmitting(true);
    try {
      const photoItemMap: Record<string, number> = {};
      for (const [idx, p] of photos.entries()) {
        if (p.itemIndex !== undefined && itemIndexMap.has(p.itemIndex)) {
          photoItemMap[String(idx)] = itemIndexMap.get(p.itemIndex)!;
        }
      }

      const payload = {
        property_id: propertyId,
        lease_id: leaseId ?? null,
        act_type: actType,
        notes: notes ?? null,
        items: validItems.map((item, idx) => ({
          area: item.area.trim(),
          condition: item.condition,
          notes: item.notes ?? null,
          sort_order: idx,
        })),
        photo_item_map: photoItemMap,
        captions: photos.map((p) => p.caption || ''),
        acknowledged_by_name: ackName.trim() || null,
        acknowledgment_note: ackNote.trim() || null,
      };

      const result = await submitAct(
        payload,
        photos.map((p) => p.file),
      );
      toast.success(t('inv_finalized'));
      router.push(`/management/inventory/${result.id}`);
    } catch {
      toast.error(t('inv_create_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title={t('inv_new')} backHref="/management/inventory" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basic metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('inv_new')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('field_property')} *</Label>
                  <PropertySelect value={propertyId} onChange={handlePropertyChange} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('inv_field_lease')}</Label>
                  <LeaseSelect
                    value={leaseId}
                    onChange={setLeaseId}
                    disabled={!propertyId}
                    query={propertyId ? { property_id: propertyId } : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('inv_field_type')} *</Label>
                  <Select value={actType} onValueChange={setActType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('inv_select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ACT_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('inv_field_notes')}</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('inv_notes_ph')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Condition Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">
                {t('inv_tab_items')} ({items.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addItem} className="gap-1.5">
                <Plus className="size-4" /> {t('inv_add_item')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('inv_area_label')} *</Label>
                    <Input
                      placeholder={t('inv_area_placeholder')}
                      value={item.area}
                      onChange={(e) => updateItem(index, { area: e.target.value })}
                    />
                  </div>
                  <div className="w-full space-y-1 sm:w-40">
                    <Label className="text-xs text-muted-foreground">
                      {t('inv_trio_condition')}
                    </Label>
                    <Select
                      value={item.condition}
                      onValueChange={(val) => {
                        // SAFETY: Condition rating matches ConditionRating enum
                        updateItem(index, { condition: val as ConditionRating });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {conditionLabel(t, c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('inv_field_notes')}</Label>
                    <Input
                      placeholder={t('inv_notes_item_placeholder')}
                      value={item.notes}
                      onChange={(e) => updateItem(index, { notes: e.target.value })}
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="self-end text-muted-foreground hover:text-destructive sm:self-center"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">
                {t('inv_tab_photos')} ({photos.length})
              </CardTitle>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => onAddPhotos(e.target.files)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Plus className="size-4" /> {t('inv_add_photos')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground transition hover:bg-muted/40"
                >
                  <Plus className="mb-2 size-6" />
                  <span>{t('inv_add_photos_cta')}</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((p, idx) => (
                    <div key={idx} className="space-y-2 rounded-lg border border-border p-2">
                      <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.previewUrl}
                          alt={t('inv_photo_alt')}
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <Input
                        placeholder={t('inv_photo_caption_placeholder')}
                        value={p.caption}
                        onChange={(e) => updatePhotoCaption(idx, e.target.value)}
                        className="text-xs"
                      />
                      <Select
                        value={p.itemIndex !== undefined ? String(p.itemIndex) : 'none'}
                        onValueChange={(val) =>
                          updatePhotoItem(idx, val === 'none' ? undefined : Number(val))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={t('inv_link_to_item')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('inv_general_no_item')}</SelectItem>
                          {items.map((item, itemIdx) => (
                            <SelectItem key={itemIdx} value={String(itemIdx)}>
                              {t('inv_item_num', {
                                num: itemIdx + 1,
                                area: item.area || t('inv_untitled_item'),
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar: Acknowledgment & Submit */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('inv_counterparty_ack')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ack-name">{t('inv_ack_name_label')}</Label>
                <Input
                  id="ack-name"
                  placeholder={t('inv_ack_name_placeholder')}
                  value={ackName}
                  onChange={(e) => setAckName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ack-note">{t('inv_ack_note_label')}</Label>
                <Textarea
                  id="ack-note"
                  rows={2}
                  placeholder={t('inv_ack_note_placeholder')}
                  value={ackNote}
                  onChange={(e) => setAckNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full font-semibold shadow-md"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? t('inv_creating_and_finalizing') : t('inv_create_and_finalize')}
          </Button>
        </div>
      </div>
    </div>
  );
}

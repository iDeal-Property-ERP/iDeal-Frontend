'use client';

import {
  Building2,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  PanelRightClose,
  Pencil,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AvatarInitials, initialsOf } from '@/components/management/columns/AvatarInitials';
import {
  inventoryStatusTone,
  inventoryTypeTone,
  StatusPill,
} from '@/components/management/columns/StatusPill';
import type { PillTone } from '@/components/management/columns/StatusPill';
import { EmptyState } from '@/components/management/states/EmptyState';
import { Button } from '@/components/ui/button';
import { getAct } from '@/libs/management/inventoryAdapter';
import { cn } from '@/libs/utils';
import type { InventoryActListOutput, InventoryActOutput } from '@/types/management';
import type { ActivityEvent } from './ActivityTimeline';
import { ActivityTimeline } from './ActivityTimeline';
import { OwnerAgreementCard } from './OwnerAgreementCard';
import { PricingTrio } from './PricingTrio';
import { RecordPanel } from './RecordPanel';
import { RecordPanelTabs } from './RecordPanelTabs';
import { VacancyAlert } from './VacancyAlert';

/** Condition ratings ordered best → worst, so the highest index is "worst". */
const CONDITION_ORDER = ['excellent', 'good', 'fair', 'poor', 'damaged'] as const;

/**
 * Formats an ISO date to a short "Jun 20, 2025" label.
 * @param iso - The ISO date string (or null).
 * @returns The formatted date, or an empty string when unparseable.
 */
function longDate(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Maps an item condition rating to a pill tone.
 * @param condition - The backend condition rating.
 * @returns The matching pill tone.
 */
function conditionTone(condition: string): PillTone {
  const c = condition.toLowerCase();
  if (c === 'excellent' || c === 'good') {
    return 'success';
  }
  if (c === 'fair') {
    return 'warning';
  }
  if (c === 'poor' || c === 'damaged') {
    return 'danger';
  }
  return 'neutral';
}

/**
 * The worst (lowest-quality) condition present across an act's items.
 * @param items - The act's inventory items.
 * @returns The worst condition rating, or null when there are no items.
 */
function worstCondition(items: InventoryActOutput['items']): string | null {
  let worstIndex = -1;
  for (const item of items) {
    // SAFETY: item.condition string lowercased to match CONDITION_ORDER elements
    const cond = item.condition.toLowerCase() as (typeof CONDITION_ORDER)[number];
    const index = CONDITION_ORDER.indexOf(cond);
    if (index > worstIndex) {
      worstIndex = index;
    }
  }
  return worstIndex >= 0 ? (CONDITION_ORDER[worstIndex] ?? null) : null;
}

/**
 * Computes the display label for the worst item condition across an act.
 * @param items - The act's inventory items.
 * @param t - The translator function.
 * @returns The condition display label.
 */
function computeConditionValue(
  items: InventoryActOutput['items'],
  t: (key: string) => string,
): string {
  const worst = worstCondition(items);
  // SAFETY: Condition key mapped to localized condition label
  return worst ? t(`inv_condition_${worst}` as 'inv_condition_good') : t('inv_condition_good');
}

/**
 * Filters items whose condition is "poor" or "damaged" — the flagged set.
 * @param items - The act's inventory items.
 * @returns The flagged items.
 */
function computeFlagged(items: InventoryActOutput['items']): InventoryActOutput['items'] {
  return items.filter((item) => {
    const c = item.condition.toLowerCase();
    return c === 'poor' || c === 'damaged';
  });
}

/**
 * The tab body for the inventory-act record panel — renders the active tab's
 * content (overview/activity timeline, items list, photo grid, or an empty
 * documents state). Kept a self-contained sub-component so the parent panel
 * stays under the complexity budget.
 * @param props - The active tab id, plus the act's items, photos, and activity.
 * @returns The tab body element.
 */
function InventoryActTabBody(props: {
  activeTab: string;
  items: InventoryActOutput['items'];
  photos: InventoryActOutput['photos'];
  activity: ActivityEvent[];
}) {
  const t = useTranslations('Management');
  const { activeTab, items, photos, activity } = props;
  if (activeTab === 'overview' || activeTab === 'activity') {
    return <ActivityTimeline heading={t('recent_activity')} events={activity} />;
  }
  if (activeTab === 'items') {
    return items.length > 0 ? (
      <div className="flex w-full flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-[12px] border border-border bg-background px-3.5 py-3"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">{item.area}</span>
              {item.notes ? (
                <span className="truncate text-xs text-muted-foreground">{item.notes}</span>
              ) : null}
            </div>
            <StatusPill
              tone={conditionTone(item.condition)}
              // SAFETY: Condition key mapped to localized condition label
              label={t(`inv_condition_${item.condition.toLowerCase()}` as 'inv_condition_good')}
            />
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={ClipboardList}
        title={t('inv_empty_items')}
        tone="muted"
        className="py-10"
      />
    );
  }
  if (activeTab === 'photos') {
    return photos.length > 0 ? (
      <div className="grid w-full grid-cols-3 gap-2.5">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="flex flex-col gap-1.5 overflow-hidden rounded-[12px] border border-border bg-background"
          >
            <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
              {photo.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.image_url}
                  alt={photo.caption ?? t('inv_photo_alt')}
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-6" strokeWidth={1.5} />
              )}
            </div>
            {photo.caption ? (
              <figcaption className="truncate px-2 pb-2 text-xs text-muted-foreground">
                {photo.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    ) : (
      <EmptyState icon={ImageIcon} title={t('inv_empty_photos')} tone="muted" className="py-10" />
    );
  }
  return (
    <EmptyState icon={ClipboardList} title={t('empty_documents')} tone="muted" className="py-10" />
  );
}

/**
 * The header slot for the inventory-act record panel — title code, status/type
 * pills, property name, created date, and close button.
 * @param props - Act data, labelers, and close handler.
 * @returns The header element.
 */
function InventoryActHeader(props: {
  act: InventoryActListOutput;
  statusLabel: (status: string) => string;
  typeLabel: (type: string) => string;
  onClose: () => void;
}) {
  const t = useTranslations('Management');
  const { act, statusLabel, typeLabel, onClose } = props;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {t('inv_code', { id: act.id })}
          </h2>
          <StatusPill tone={inventoryStatusTone(act.status)} label={statusLabel(act.status)} />
          <StatusPill tone={inventoryTypeTone(act.act_type)} label={typeLabel(act.act_type)} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {act.property_name} · {t('inv_created_on', { date: longDate(act.created_at) })}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="max-lg:hidden"
          aria-label={t('record_close')}
          onClick={onClose}
        >
          <PanelRightClose className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * The footer slot for the inventory-act record panel — finalize button (draft
 * only) and edit button.
 * @param props - Draft flag and finalize callback.
 * @returns The footer element.
 */
function InventoryActFooter(props: { isDraft: boolean; onFinalize: () => void }) {
  const t = useTranslations('Management');
  const { isDraft, onFinalize } = props;
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        {isDraft ? (
          <Button
            type="button"
            className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
            onClick={onFinalize}
          >
            <CheckCircle2 className="size-[15px]" />
            {t('inv_finalize')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
          onClick={() => toast.message(t('inv_edit_soon'))}
        >
          <Pencil className="size-[15px]" />
          {t('record_edit')}
        </Button>
      </div>
    </div>
  );
}

/**
 * The body content for the inventory-act record panel — hero image, pricing trio,
 * flagged-items alert, creator card, tabs, and tab body.
 * @param props - Act data, derived state, and tab state.
 * @returns The body element.
 */
function InventoryActBody(props: {
  act: InventoryActListOutput;
  detail: InventoryActOutput | null;
  itemCount: number;
  photoCount: number;
  conditionValue: string;
  flagged: InventoryActOutput['items'];
  createdByName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  items: InventoryActOutput['items'];
  photos: InventoryActOutput['photos'];
  activity: ActivityEvent[];
}) {
  const t = useTranslations('Management');
  const {
    act,
    detail,
    itemCount,
    photoCount,
    conditionValue,
    flagged,
    createdByName,
    activeTab,
    setActiveTab,
    items,
    photos,
    activity,
  } = props;
  return (
    <>
      <div className="flex h-[180px] w-full items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
        <Building2 className="size-10" strokeWidth={1.5} />
      </div>

      <PricingTrio
        items={[
          {
            label: t('inv_trio_items'),
            value: String(itemCount),
            caption: t('inv_trio_items_caption'),
          },
          {
            label: t('inv_trio_condition'),
            value: conditionValue,
            caption: t('inv_trio_condition_caption'),
          },
          {
            label: t('inv_trio_photos'),
            value: String(photoCount),
            caption: t('inv_trio_photos_caption'),
          },
        ]}
      />

      {flagged.length > 0 ? (
        <VacancyAlert
          title={t('inv_flagged_title', { count: flagged.length })}
          detail={t('inv_flagged_detail', { areas: flagged.map((item) => item.area).join(', ') })}
          actionLabel={t('inv_review_items')}
          onAction={() => setActiveTab('items')}
        />
      ) : null}

      <OwnerAgreementCard
        initials={initialsOf(createdByName)}
        ownerLine={createdByName}
        detailLine={t('inv_owner_detail', {
          property: act.property_name,
          date: longDate(act.created_at),
        })}
        statusLabel={detail?.acknowledged_by_name ? t('inv_acknowledged') : undefined}
      />

      <RecordPanelTabs
        tabs={[
          { id: 'overview', label: t('tab_overview') },
          { id: 'items', label: t('inv_tab_items') },
          { id: 'photos', label: t('inv_tab_photos') },
          { id: 'documents', label: t('tab_documents') },
          { id: 'activity', label: t('tab_activity') },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <InventoryActTabBody
        activeTab={activeTab}
        items={items}
        photos={photos}
        activity={activity}
      />
    </>
  );
}

/**
 * The Inventory-act instance of the record panel (archetype D) — fills the
 * reusable RecordPanel with an act's header, property hero, items/condition/photos
 * trio, a flagged-items alert, the created-by card, tabs (overview, items, photos,
 * documents, activity), and a sticky Finalize / Edit footer. The full detail
 * (items + photos) is fetched per act on open.
 * @param props - The act row, open/close state, finalize callback, and labelers.
 * @returns The inventory-act record panel element.
 */
export function InventoryActRecordPanel(props: {
  act: InventoryActListOutput | null;
  open: boolean;
  onClose: () => void;
  onFinalize: () => void;
  statusLabel: (status: string) => string;
  typeLabel: (type: string) => string;
}) {
  const t = useTranslations('Management');
  const { act } = props;
  const [detail, setDetail] = useState<InventoryActOutput | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const prevActRef = useRef(act?.id ?? null);
  if (prevActRef.current !== (act?.id ?? null)) {
    prevActRef.current = act?.id ?? null;
    setActiveTab('overview');
    setDetail(null);
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!act) {
        return;
      }
      try {
        const res = await getAct(act.id);
        if (active) {
          setDetail(res);
        }
      } catch {
        // Detail is supplementary — the panel falls back to the list-row counts.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [act]);

  if (!act) {
    return null;
  }

  const items = detail?.items ?? [];
  const photos = detail?.photos ?? [];
  const itemCount = detail ? items.length : act.item_count;
  const photoCount = detail ? photos.length : act.photo_count;
  const isDraft = act.status.toLowerCase() === 'draft';
  // SAFETY: Dynamic key passed to localized translator
  const conditionValue = computeConditionValue(items, (key) => t(key as 'inv_condition_good'));
  const flagged = computeFlagged(items);

  const createdByName =
    detail?.acknowledged_by_name ??
    (detail ? t('inv_created_by', { id: detail.created_by_id }) : t('inv_created_by_unknown'));

  const activity: ActivityEvent[] = [
    {
      id: 'created',
      title: t('inv_activity_created'),
      time: longDate(act.created_at),
      tone: 'accent',
    },
    {
      id: 'updated',
      title: t('inv_activity_updated'),
      time: longDate(act.updated_at),
      tone: 'muted',
    },
  ];
  if (detail?.finalized_at) {
    activity.push({
      id: 'finalized',
      title: t('inv_activity_finalized'),
      time: longDate(detail.finalized_at),
      tone: 'success',
    });
  }

  const header = (
    <InventoryActHeader
      act={act}
      statusLabel={props.statusLabel}
      typeLabel={props.typeLabel}
      onClose={props.onClose}
    />
  );

  const footer = <InventoryActFooter isDraft={isDraft} onFinalize={props.onFinalize} />;

  return (
    <RecordPanel
      open={props.open}
      onClose={props.onClose}
      title={t('record_type_inventory')}
      header={header}
      footer={footer}
    >
      <InventoryActBody
        act={act}
        detail={detail}
        itemCount={itemCount}
        photoCount={photoCount}
        conditionValue={conditionValue}
        flagged={flagged}
        createdByName={createdByName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        items={items}
        photos={photos}
        activity={activity}
      />
    </RecordPanel>
  );
}

/**
 * A small inline avatar row (exported for reuse by act list cells).
 * @param props - The person's name.
 * @returns The avatar-with-name cell.
 */
export function ActorCell(props: { name: string; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', props.className)}>
      <AvatarInitials name={props.name} size={28} />
      <span className="truncate text-foreground">{props.name}</span>
    </span>
  );
}

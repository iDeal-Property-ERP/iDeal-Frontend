'use client';

import { CheckCircle2, ClipboardList, Send } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { inventoryStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import type { MobileChip } from '@/components/management/mobile/MobileWorkbench';
import { MobileWorkbench } from '@/components/management/mobile/MobileWorkbench';
import { ModuleListCard } from '@/components/management/mobile/ModuleListCard';
import type { SwipeAction } from '@/components/management/mobile/SwipeActionRow';
import { SwipeActionRow } from '@/components/management/mobile/SwipeActionRow';
import type { InventoryActListOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

/**
 * Localizes an inventory act type (handover/return/general).
 * @param t - The translator.
 * @param value - The backend act type.
 * @returns The localized type label.
 */
function actTypeLabelOf(t: Translator, value: string): string {
  const v = value.toLowerCase();
  if (v === 'handover') {
    return t('inv_type_handover');
  }
  if (v === 'return') {
    return t('inv_type_return');
  }
  if (v === 'general') {
    return t('inv_type_general');
  }
  return value.replaceAll('_', ' ');
}

/**
 * The mobile Inventory-acts workbench — drafts-first card list keyed on the
 * property, with the act type and item count as the subtitle and a status pill;
 * a tapped row opens the shared act record panel full-screen.
 * @param props - Rows, chips, search, record slot, and handlers.
 * @returns The mobile inventory view.
 */
export function InventoryMobileView(props: {
  t: Translator;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  rows: InventoryActListOutput[];
  chips: MobileChip[];
  activeChip: string;
  onChip: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  statusLabel: (value: string) => string;
  onOpen: (row: InventoryActListOutput) => void;
  /** Finalize (mark signed) a draft act. */
  onSign: (row: InventoryActListOutput) => void;
  /** Send/export a copy of the act (client CSV fallback). */
  onSendCopy: (row: InventoryActListOutput) => void;
  record?: ReactNode;
  onCloseRecord: () => void;
  empty: ReactNode;
}) {
  const { t } = props;
  const card = (row: InventoryActListOutput) => (
    <ModuleListCard
      leading={
        <span className="flex size-11 items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
          <ClipboardList className="size-5" />
        </span>
      }
      title={row.property_name}
      subtitle={`${actTypeLabelOf(t, row.act_type)} · ${t('inv_items_count', { count: row.item_count })}`}
      meta={
        <StatusPill tone={inventoryStatusTone(row.status)} label={props.statusLabel(row.status)} />
      }
      onClick={() => props.onOpen(row)}
    />
  );
  return (
    <MobileWorkbench
      title={props.title}
      subtitle={props.subtitle}
      chips={props.chips}
      activeChip={props.activeChip}
      onChipChange={props.onChip}
      search={{
        value: props.search,
        onChange: props.onSearch,
        placeholder: props.searchPlaceholder,
      }}
      isEmpty={props.rows.length === 0}
      empty={props.empty}
      record={props.record}
      onCloseRecord={props.onCloseRecord}
      backLabel={t('back')}
    >
      {props.rows.map((row) => {
        const actions: SwipeAction[] =
          row.status.toLowerCase() === 'draft'
            ? [
                {
                  label: t('inv_mark_signed'),
                  icon: CheckCircle2,
                  tone: 'success',
                  onAction: () => props.onSign(row),
                },
                {
                  label: t('inv_send_copy'),
                  icon: Send,
                  tone: 'accent',
                  onAction: () => props.onSendCopy(row),
                },
              ]
            : [
                {
                  label: t('inv_send_copy'),
                  icon: Send,
                  tone: 'accent',
                  onAction: () => props.onSendCopy(row),
                },
              ];
        return (
          <SwipeActionRow key={row.id} actions={actions}>
            {card(row)}
          </SwipeActionRow>
        );
      })}
    </MobileWorkbench>
  );
}

'use client';

import type { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { PropertyThumbnail } from '@/components/management/columns/PropertyThumbnail';
import { propertyStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatMoney } from '@/components/management/format';
import type { FilterGroup } from '@/components/management/mobile/MobileFilterSheet';
import { MobileFilterSheet } from '@/components/management/mobile/MobileFilterSheet';
import type { MobileChip } from '@/components/management/mobile/MobileWorkbench';
import { MobileWorkbench } from '@/components/management/mobile/MobileWorkbench';
import { ModuleListCard } from '@/components/management/mobile/ModuleListCard';
import type { ManagementPropertyOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

/**
 * The effective monthly rent for a property (tenant charge, falling back to ask).
 * @param row - The property row.
 * @returns The rent as a number, or 0 when unset.
 */
function rentOf(row: ManagementPropertyOutput): number {
  const charge = Number.parseFloat(row.tenant_charge_price ?? '');
  if (!Number.isNaN(charge) && charge > 0) {
    return charge;
  }
  const ask = Number.parseFloat(row.ask_price ?? '');
  return Number.isNaN(ask) ? 0 : ask;
}

/**
 * The display currency symbol for a property.
 * @param row - The property row.
 * @returns A currency prefix.
 */
function currencyOf(row: ManagementPropertyOutput): string {
  return row.ask_currency === 'UZS' ? "so'm " : '$';
}

/**
 * The dot-joined tenant-or-vacancy subtitle for a mobile card — tenant name +
 * since-date when rented, days · accrued loss when vacant, else the
 * district · rooms fallback.
 * @param t - The translator.
 * @param row - The property row.
 * @returns The subtitle string.
 */
function subtitleOf(t: Translator, row: ManagementPropertyOutput): string {
  if (row.tenant_name) {
    return row.tenant_since
      ? `${row.tenant_name} · ${t('tenant_since_caption', { date: new Date(row.tenant_since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })}`
      : row.tenant_name;
  }
  if (row.vacant_days !== null && row.vacancy_loss_per_day !== null) {
    const perDay = Number.parseFloat(row.vacancy_loss_per_day);
    if (!Number.isNaN(perDay)) {
      return t('vacancy_inline', {
        days: row.vacant_days,
        amount: formatMoney(row.vacant_days * perDay, currencyOf(row)),
      });
    }
  }
  return `${row.district_name ?? '—'} · ${row.rooms === null ? '—' : t('rooms_count', { count: row.rooms })}`;
}

/**
 * The mobile Properties workbench — the list-screen archetype on mobile: a card
 * list with status pills and rent, a floating "Add property" FAB, and a tapped
 * row that opens the shared property record panel full-screen.
 * @param props - Rows, chips, search, record slot, and handlers.
 * @returns The mobile properties view.
 */
export function PropertiesMobileView(props: {
  t: Translator;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  addLabel: string;
  rows: ManagementPropertyOutput[];
  chips: MobileChip[];
  activeChip: string;
  onChip: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  statusLabel: (value: string) => string;
  onOpen: (row: ManagementPropertyOutput) => void;
  onAdd: () => void;
  record?: ReactNode;
  onCloseRecord: () => void;
  empty: ReactNode;
  /** Secondary-filter groups (District, Tariff, Price, Sort) for the filter sheet. */
  filterGroups: FilterGroup[];
  activeFilterCount: number;
  onResetFilters: () => void;
}) {
  const { t } = props;
  const [filterOpen, setFilterOpen] = useState(false);
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
      fab={{ label: props.addLabel, onClick: props.onAdd }}
      onOpenFilters={() => setFilterOpen(true)}
      activeFilterCount={props.activeFilterCount}
      filtersLabel={t('filters')}
      filterSheet={
        <MobileFilterSheet
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title={t('filters_title')}
          resetLabel={t('filters_reset')}
          cancelLabel={t('cancel')}
          applyLabel={t('filters_show', { count: props.rows.length })}
          onReset={props.onResetFilters}
          groups={props.filterGroups}
        />
      }
    >
      {props.rows.map((row) => (
        <ModuleListCard
          key={row.id}
          leading={<PropertyThumbnail src={row.cover_image_url} alt={row.name} />}
          title={row.name}
          subtitle={subtitleOf(t, row)}
          meta={
            <StatusPill
              tone={propertyStatusTone(row.status)}
              label={props.statusLabel(row.status)}
            />
          }
          value={formatMoney(rentOf(row), currencyOf(row))}
          onClick={() => props.onOpen(row)}
        />
      ))}
    </MobileWorkbench>
  );
}

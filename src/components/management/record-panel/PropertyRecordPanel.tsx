'use client';

import {
  Building2,
  ChevronDown,
  MoreHorizontal,
  PanelRightClose,
  Pencil,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { StatusPill, propertyStatusTone } from '@/components/management/columns/StatusPill';
import { formatMoney } from '@/components/management/format';
import { EmptyState } from '@/components/management/states/EmptyState';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/libs/I18nNavigation';
import { listAgreements } from '@/libs/management/agreementsAdapter';
import { PROPERTY_STATUSES } from '@/libs/management/propertiesAdapter';
import { cn } from '@/libs/utils';
import type { ManagementAgreementOutput, ManagementPropertyOutput } from '@/types/management';
import type { ActivityEvent } from './ActivityTimeline';
import { ActivityTimeline } from './ActivityTimeline';
import { OwnerAgreementCard } from './OwnerAgreementCard';
import { PricingTrio } from './PricingTrio';
import { RecordPanel } from './RecordPanel';
import { RecordPanelTabs } from './RecordPanelTabs';
import { VacancyAlert } from './VacancyAlert';

const TARIFF_PILL = {
  standard: 'bg-muted text-muted-foreground',
  comfort: 'bg-info-subtle text-info-subtle-foreground',
  premium: 'bg-warning-subtle text-warning-subtle-foreground',
} satisfies Record<string, string>;

/**
 * Parses a nullable decimal string into a number (0 when null/unparseable).
 * @param value - The decimal string or null.
 * @returns The parsed number, or 0.
 */
function parseAmount(value: string | null): number {
  return Number(value ?? '') || 0;
}

/**
 * The "address · N rooms · area m²" meta line, tolerating null draft fields.
 * @param t - The Management translator.
 * @param property - The property row.
 * @returns The meta line string.
 */
function metaLineOf(
  t: ReturnType<typeof useTranslations<'Management'>>,
  property: ManagementPropertyOutput,
): string {
  const rooms = property.rooms === null ? '—' : t('rooms_count', { count: property.rooms });
  return `${property.address} · ${rooms} · ${property.area_sqm ?? 0} m²`;
}

/**
 * Formats an ISO date to a short "Jun 20" label.
 * @param iso - The ISO date string (or null).
 * @returns The short date, or an empty string when unparseable.
 */
function shortDate(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Two-letter initials from a person's name.
 * @param name - The full name.
 * @returns Up to two uppercase initials.
 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/u);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * The header slot for the property record panel — title, status pill, meta line,
 * tariff badge, and action buttons (open-full + close).
 * @param props - Property data, meta line strings, labelers, and close handler.
 * @returns The header element.
 */
function PropertyRecordPanelHeader(props: {
  property: ManagementPropertyOutput;
  metaLine: string;
  statusLabel: (status: string) => string;
  tariffLabel: (tariff: string) => string;
  onClose: () => void;
}) {
  const { property, metaLine, statusLabel, tariffLabel, onClose } = props;
  const t = useTranslations('Management');
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {property.name}
          </h2>
          <StatusPill
            tone={propertyStatusTone(property.status)}
            label={statusLabel(property.status)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{metaLine}</span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
              (property.tariff in TARIFF_PILL
                ? // SAFETY: Property tariff verified as key in TARIFF_PILL lookup
                  TARIFF_PILL[property.tariff as keyof typeof TARIFF_PILL]
                : undefined) ?? 'bg-muted text-muted-foreground',
            )}
          >
            {tariffLabel(property.tariff)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild variant="ghost" size="icon-sm" aria-label={t('record_open_full')}>
          <Link href={`/management/properties/${property.id}/edit`}>
            <SquareArrowOutUpRight className="size-4" />
          </Link>
        </Button>
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
 * The footer slot for the property record panel — edit button, change-status
 * dropdown, and more-actions menu.
 * @param props - Property data and status change callbacks.
 * @returns The footer element.
 */
function PropertyRecordPanelFooter(props: {
  property: ManagementPropertyOutput;
  onChangeStatus: (status: string) => void;
  statusLabel: (status: string) => string;
}) {
  const { property, onChangeStatus, statusLabel } = props;
  const t = useTranslations('Management');
  return (
    <div className="flex w-full items-center gap-2.5">
      <Button
        asChild
        className="h-11 flex-1 gap-2 rounded-xl px-2 text-[15px] shadow-sm lg:h-10 lg:rounded-[10px]"
      >
        <Link href={`/management/properties/${property.id}/edit`}>
          <Pencil className="size-[15px]" />
          <span className="truncate">{t('record_edit')}</span>
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-11 flex-1 gap-2 rounded-xl px-2 text-[15px] shadow-none lg:h-10 lg:rounded-[10px]"
          >
            <span className="truncate">{t('change_status')}</span>
            <ChevronDown className="size-[15px]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {PROPERTY_STATUSES.map((status) => (
            <DropdownMenuItem
              key={status}
              disabled={status === property.status}
              onSelect={() => onChangeStatus(status)}
            >
              <StatusPill tone={propertyStatusTone(status)} label={statusLabel(status)} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('row_more')}
            className="size-11 shrink-0 rounded-full shadow-none lg:size-10 lg:rounded-[10px]"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/management/properties/${property.id}/edit`}>
              <SquareArrowOutUpRight className="size-4" />
              {t('record_open_full')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * The body content for the property record panel — hero image, pricing trio,
 * vacancy alert, owner agreement card, tabs, and activity timeline.
 * @param props - Property data, derived values, and tab state.
 * @returns The body element.
 */
function PropertyRecordPanelBody(props: {
  property: ManagementPropertyOutput;
  agreement: ManagementAgreementOutput | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: string;
  price: (amount: string | null) => string;
  isVacant: boolean;
  margin: number;
  marginPct: number;
  dailyLoss: number;
  accrued: number;
  tabs: { id: string; label: string }[];
  activity: ActivityEvent[];
}) {
  const {
    property,
    agreement,
    activeTab,
    setActiveTab,
    currency,
    price,
    isVacant,
    margin,
    marginPct,
    dailyLoss,
    accrued,
    tabs,
    activity,
  } = props;
  const t = useTranslations('Management');
  return (
    <>
      <div className="flex h-[180px] w-full items-center justify-center overflow-hidden rounded-[12px] bg-muted text-muted-foreground">
        {property.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote media host; next/image adds no value in a side panel
          <img
            src={property.cover_image_url}
            alt={property.name}
            className="size-full object-cover"
          />
        ) : (
          <Building2 className="size-10" strokeWidth={1.5} />
        )}
      </div>

      <PricingTrio
        items={[
          {
            label: t('price_ask'),
            value: price(property.ask_price),
            caption: t('price_ask_caption'),
          },
          {
            label: t('price_owner_guaranteed'),
            value: price(property.owner_guaranteed_price),
            caption: t('price_owner_caption'),
          },
          {
            label: t('price_tenant_charge'),
            value: price(property.tenant_charge_price ?? '0'),
            caption: t('price_margin_caption', {
              amount: formatMoney(margin, currency),
              pct: marginPct,
            }),
          },
        ]}
      />

      {isVacant &&
      property.engagement_type !== 'one_off' &&
      !((property.vacant_days ?? 0) === 0 && dailyLoss === 0) ? (
        <VacancyAlert
          title={t('vacancy_title', { days: property.vacant_days ?? 0 })}
          detail={t('vacancy_detail', {
            perDay: formatMoney(dailyLoss, currency),
            accrued: formatMoney(accrued, currency),
          })}
        />
      ) : null}

      {property.engagement_type !== 'one_off' && agreement ? (
        <OwnerAgreementCard
          initials={initialsOf(property.owner_name ?? '—')}
          ownerLine={`${property.owner_name ?? '—'} ${t('owner_suffix')}`}
          detailLine={t('agreement_detail', {
            number: agreement.agreement_number,
            rate: agreement.commission_rate,
            date: shortDate(agreement.end_date),
          })}
          statusLabel={/active/iu.test(agreement.status) ? t('agreement_active') : undefined}
        />
      ) : null}

      {property.engagement_type !== 'one_off' && !agreement ? (
        <OwnerAgreementCard
          initials={initialsOf(property.owner_name ?? '—')}
          ownerLine={`${property.owner_name ?? '—'} ${t('owner_suffix')}`}
          detailLine={t('no_agreement')}
        />
      ) : null}

      <RecordPanelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' || activeTab === 'activity' ? (
        <ActivityTimeline heading={t('recent_activity')} events={activity} />
      ) : (
        <EmptyState
          icon={Building2}
          // SAFETY: Active tab identifier maps to localized empty state title
          title={t(`empty_${activeTab}` as 'empty_payments')}
          tone="muted"
          className="py-10"
        />
      )}
    </>
  );
}

/**
 * The Property instance of the record panel (archetype D) — fills the reusable
 * RecordPanel with a property's header, hero, pricing trio, vacancy alert, owner
 * agreement, tabs, and derived activity, plus a sticky Edit / Change status
 * footer. Wired to real endpoints; the owner agreement is fetched per property.
 * @param props - The property, open/close state, and status/edit callbacks.
 * @returns The property record panel element.
 */
export function PropertyRecordPanel(props: {
  property: ManagementPropertyOutput | null;
  open: boolean;
  onClose: () => void;
  onChangeStatus: (status: string) => void;
  statusLabel: (status: string) => string;
  tariffLabel: (tariff: string) => string;
}) {
  const t = useTranslations('Management');
  const { property } = props;
  const [agreement, setAgreement] = useState<ManagementAgreementOutput | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const prevPropertyRef = useRef(property?.id ?? null);
  if (prevPropertyRef.current !== (property?.id ?? null)) {
    prevPropertyRef.current = property?.id ?? null;
    setActiveTab('overview');
    setAgreement(null);
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!property) {
        return;
      }
      try {
        const res = await listAgreements({ page: 1, propertyId: property.id });
        if (active) {
          setAgreement(res.items[0] ?? null);
        }
      } catch {
        // Agreement is supplementary — a missing one simply hides the card.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [property]);

  if (!property) {
    return null;
  }

  const currency = property.ask_currency === 'UZS' ? "so'm " : '$';
  const price = (amount: string | null) => formatMoney(amount ?? '0', currency);
  const isVacant = /vacant|available/iu.test(property.status);

  const tenantCharge = parseAmount(property.tenant_charge_price);
  const ownerGuaranteed = parseAmount(property.owner_guaranteed_price);
  const margin = tenantCharge - ownerGuaranteed;
  const marginPct = tenantCharge ? Math.round((margin / tenantCharge) * 100) : 0;

  const dailyLoss = tenantCharge / 30;
  const accrued = dailyLoss * (property.vacant_days ?? 0);
  const metaLine = metaLineOf(t, property);

  const tabs = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'payments', label: t('tab_payments') },
    { id: 'maintenance', label: t('tab_maintenance') },
    { id: 'inventory', label: t('tab_inventory') },
    { id: 'activity', label: t('tab_activity') },
  ];

  const activity: ActivityEvent[] = [];
  if (isVacant && property.vacant_since) {
    activity.push({
      id: 'vacant',
      title: t('activity_vacant'),
      time: shortDate(property.vacant_since),
      tone: 'warning',
    });
  }
  activity.push(
    {
      id: 'updated',
      title: t('activity_updated'),
      time: shortDate(property.updated_at),
      tone: 'accent',
    },
    {
      id: 'created',
      title: t('activity_listed'),
      time: shortDate(property.created_at),
      tone: 'muted',
    },
  );

  const header = (
    <PropertyRecordPanelHeader
      property={property}
      metaLine={metaLine}
      statusLabel={props.statusLabel}
      tariffLabel={props.tariffLabel}
      onClose={props.onClose}
    />
  );

  const footer = (
    <PropertyRecordPanelFooter
      property={property}
      onChangeStatus={props.onChangeStatus}
      statusLabel={props.statusLabel}
    />
  );

  return (
    <RecordPanel
      open={props.open}
      onClose={props.onClose}
      title={t('record_type_property')}
      header={header}
      footer={footer}
    >
      <PropertyRecordPanelBody
        property={property}
        agreement={agreement}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        price={price}
        isVacant={isVacant}
        margin={margin}
        marginPct={marginPct}
        dailyLoss={dailyLoss}
        accrued={accrued}
        tabs={tabs}
        activity={activity}
      />
    </RecordPanel>
  );
}

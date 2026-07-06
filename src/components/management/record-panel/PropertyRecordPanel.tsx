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
import { useEffect, useState } from 'react';
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
import { apiFetch } from '@/libs/api';
import { Link } from '@/libs/I18nNavigation';
import { PROPERTY_STATUSES } from '@/libs/management/propertiesAdapter';
import { cn } from '@/libs/utils';
import type { PaginatedData } from '@/types/api';
import type { ManagementAgreementOutput, ManagementPropertyOutput } from '@/types/management';
import type { ActivityEvent } from './ActivityTimeline';
import { ActivityTimeline } from './ActivityTimeline';
import { OwnerAgreementCard } from './OwnerAgreementCard';
import { PricingTrio } from './PricingTrio';
import { RecordPanel } from './RecordPanel';
import { RecordPanelTabs } from './RecordPanelTabs';
import { VacancyAlert } from './VacancyAlert';

const TARIFF_PILL: Record<string, string> = {
  standard: 'bg-muted text-muted-foreground',
  comfort: 'bg-info-subtle text-info-subtle-foreground',
  premium: 'bg-warning-subtle text-warning-subtle-foreground',
};

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

  useEffect(() => {
    setActiveTab('overview');
    setAgreement(null);
    let active = true;
    const load = async () => {
      if (!property) {
        return;
      }
      try {
        const res = await apiFetch<PaginatedData<ManagementAgreementOutput>>(
          '/management/agreements/',
          { query: { page: 1, property_id: property.id } },
        );
        if (active) {
          setAgreement(res.page.object_list[0] ?? null);
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
  const price = (amount: string) => formatMoney(amount, currency);
  const isVacant = /vacant|available/iu.test(property.status);

  const margin =
    Number.parseFloat(property.tenant_charge_price) -
    Number.parseFloat(property.owner_guaranteed_price);
  const marginPct = Number.parseFloat(property.tenant_charge_price)
    ? Math.round((margin / Number.parseFloat(property.tenant_charge_price)) * 100)
    : 0;

  const dailyLoss = Number.parseFloat(property.tenant_charge_price) / 30;
  const accrued = dailyLoss * property.vacant_days;

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
  activity.push({
    id: 'updated',
    title: t('activity_updated'),
    time: shortDate(property.updated_at),
    tone: 'accent',
  });
  activity.push({
    id: 'created',
    title: t('activity_listed'),
    time: shortDate(property.created_at),
    tone: 'muted',
  });

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {property.name}
          </h2>
          <StatusPill
            tone={propertyStatusTone(property.status)}
            label={props.statusLabel(property.status)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {property.address} · {t('rooms_count', { count: property.rooms })} · {property.area_sqm}{' '}
            m²
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
              TARIFF_PILL[property.tariff] ?? 'bg-muted text-muted-foreground',
            )}
          >
            {props.tariffLabel(property.tariff)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild variant="ghost" size="icon-sm" aria-label={t('record_open_full')}>
          <Link href={`/properties/${property.id}`}>
            <SquareArrowOutUpRight className="size-4" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('record_close')}
          onClick={props.onClose}
        >
          <PanelRightClose className="size-4" />
        </Button>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <Button asChild className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm">
          <Link href={`/properties/${property.id}`}>
            <Pencil className="size-[15px]" />
            {t('record_edit')}
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
            >
              {t('change_status')}
              <ChevronDown className="size-[15px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {PROPERTY_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                disabled={status === property.status}
                onSelect={() => props.onChangeStatus(status)}
              >
                <StatusPill tone={propertyStatusTone(status)} label={props.statusLabel(status)} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('row_more')}
            className="size-10 rounded-[10px] shadow-none"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/properties/${property.id}`}>
              <SquareArrowOutUpRight className="size-4" />
              {t('record_open_full')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <RecordPanel open={props.open} onClose={props.onClose} header={header} footer={footer}>
      <div className="flex h-[180px] w-full items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
        <Building2 className="size-10" strokeWidth={1.5} />
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
            value: price(property.tenant_charge_price),
            caption: t('price_margin_caption', {
              amount: formatMoney(margin, currency),
              pct: marginPct,
            }),
          },
        ]}
      />

      {isVacant ? (
        <VacancyAlert
          title={t('vacancy_title', { days: property.vacant_days })}
          detail={t('vacancy_detail', {
            perDay: formatMoney(dailyLoss, currency),
            accrued: formatMoney(accrued, currency),
          })}
        />
      ) : null}

      {agreement ? (
        <OwnerAgreementCard
          initials={initialsOf(property.owner_name)}
          ownerLine={`${property.owner_name} ${t('owner_suffix')}`}
          detailLine={t('agreement_detail', {
            number: agreement.agreement_number,
            rate: agreement.commission_rate,
            date: shortDate(agreement.end_date),
          })}
          statusLabel={/active/iu.test(agreement.status) ? t('agreement_active') : undefined}
        />
      ) : (
        <OwnerAgreementCard
          initials={initialsOf(property.owner_name)}
          ownerLine={`${property.owner_name} ${t('owner_suffix')}`}
          detailLine={t('no_agreement')}
        />
      )}

      <RecordPanelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' || activeTab === 'activity' ? (
        <ActivityTimeline heading={t('recent_activity')} events={activity} />
      ) : (
        <EmptyState
          icon={Building2}
          title={t(`empty_${activeTab}` as 'empty_payments')}
          tone="muted"
          className="py-10"
        />
      )}
    </RecordPanel>
  );
}

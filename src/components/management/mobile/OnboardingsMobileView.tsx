'use client';

import { CheckCircle2, ChevronLeft, ChevronRight, DollarSign, Mail, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { StatusPill, onboardingStatusTone } from '@/components/management/columns/StatusPill';
import { PhotoStrip } from '@/components/management/record-panel/PhotoStrip';
import type { OnboardingAction } from '@/components/management/triage/onboardings/OnboardingDetail';
import { OnboardingQueueCard } from '@/components/management/triage/onboardings/OnboardingQueueCard';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { Button } from '@/components/ui/button';
import { titleCase } from '@/libs/management/format';
import type {
  ManagementOnboardingDetailOutput,
  ManagementOnboardingOutput,
} from '@/types/management';

/**
 * The compact mobile onboarding detail — a centered title bar, owner header,
 * labeled Call/Message buttons, the submitted-property card, a condensed two-chip
 * pricing row (market + suggested), a note block, the photo strip, and a sticky
 * footer (Approve… / Request info / Reject…). Mirrors Figma 444:2 / 444:114; the
 * heavier four-card {@link PricingGrid} stays desktop-only.
 * @param props - The detail payload, back handler, and action dispatcher.
 * @returns The mobile onboarding detail element.
 */
function MobileOnboardingDetail(props: {
  detail: ManagementOnboardingDetailOutput;
  onBack: () => void;
  onAction: (detail: ManagementOnboardingDetailOutput, action: OnboardingAction) => void;
}) {
  const t = useTranslations('Management');
  const { detail } = props;
  const terminal = detail.status === 'approved' || detail.status === 'rejected';

  const specs = [t('lead_rooms', { count: detail.rooms }), `${detail.area_sqm} m²`].join(' · ');
  const market =
    detail.market_min && detail.market_max ? `$${detail.market_min}–${detail.market_max}` : '—';

  const offerNote =
    detail.offer_version && detail.offer_accepted_at
      ? t('onb_offer_accepted_on', {
          version: detail.offer_version,
          date: new Date(detail.offer_accepted_at).toLocaleDateString(),
        })
      : null;
  const noteText =
    detail.review_notes ??
    [
      offerNote ? `${offerNote.charAt(0).toUpperCase()}${offerNote.slice(1)}.` : null,
      t('onb_asks_negotiable', { price: `$${detail.ask_price}` }),
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="flex min-h-[calc(100svh-8rem)] flex-col">
      <div className="relative flex h-11 items-center justify-center">
        <button
          type="button"
          onClick={props.onBack}
          aria-label={t('onb_back')}
          className="absolute left-0 flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-base font-semibold text-foreground">{t('onb_detail_title')}</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 pt-4">
        <div className="flex items-start gap-3">
          <AvatarInitials name={detail.owner_name} size={48} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-[22px] leading-7 font-bold text-foreground">
                {detail.owner_name}
              </span>
              <StatusPill
                tone={onboardingStatusTone(detail.status)}
                label={titleCase(detail.status)}
              />
            </div>
            {detail.owner_phone ? (
              <span className="text-sm text-muted-foreground">{detail.owner_phone}</span>
            ) : null}
          </div>
        </div>

        {detail.owner_phone ? (
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${detail.owner_phone}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-border bg-card text-[15px] font-semibold text-foreground"
            >
              <Phone className="size-[18px]" />
              {t('lead_call')}
            </a>
            <a
              href={`sms:${detail.owner_phone}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-border bg-card text-[15px] font-semibold text-foreground"
            >
              <Mail className="size-[18px]" />
              {t('lead_message')}
            </a>
          </div>
        ) : null}

        <Link
          href={`/management/map?property=${detail.property_id}`}
          className="flex items-center gap-3 rounded-[12px] border border-border bg-card px-3.5 py-3"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate text-[15px] font-semibold text-foreground">
              {detail.property_name}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[8px] bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary-subtle-foreground">
                {specs}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('onb_asks', { price: `$${detail.ask_price}/mo` })}
              </span>
            </div>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {t('onb_pricing')}
          </span>
          <div className="flex flex-wrap gap-2.5">
            <span className="flex items-center gap-1.5 rounded-[10px] bg-primary-subtle px-3 py-2 text-sm font-medium text-primary-subtle-foreground">
              <DollarSign className="size-4" />
              {t('onb_market_short', { value: market })}
            </span>
            <span className="flex items-center gap-1.5 rounded-[10px] bg-primary-subtle px-3 py-2 text-sm font-medium text-primary-subtle-foreground">
              <DollarSign className="size-4" />
              {t('onb_suggested_short', {
                value: detail.suggested_price ? `$${detail.suggested_price}` : '—',
              })}
            </span>
          </div>
        </div>

        {noteText ? (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {t('onb_note')}
            </span>
            <p className="text-sm leading-5 text-foreground">“{noteText}”</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {t('onb_photos', { count: detail.photos.length })}
          </span>
          <PhotoStrip
            urls={detail.photos}
            altPrefix={detail.property_name}
            emptyLabel={t('onb_no_photos')}
          />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 flex flex-col gap-2.5 border-t border-border bg-background px-4 py-3.5">
        <Button
          className="h-12 w-full"
          onClick={() => props.onAction(detail, 'approve')}
          disabled={terminal}
        >
          <CheckCircle2 className="size-4" />
          {t('onb_approve')}
        </Button>
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={() => props.onAction(detail, 'request-info')}
            disabled={terminal}
          >
            {t('onb_request_info')}
          </Button>
          <button
            type="button"
            onClick={() => props.onAction(detail, 'reject')}
            disabled={terminal}
            className="px-4 text-sm font-medium text-danger disabled:text-muted-foreground"
          >
            {t('onb_reject')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The mobile Onboardings experience — a tab bar over a card list that pushes to a
 * compact full-screen detail (see {@link MobileOnboardingDetail}). The parent owns
 * data, selection, and actions.
 * @param props - Onboardings, tabs, selection, detail state, and action dispatcher.
 * @returns The mobile onboardings view.
 */
export function OnboardingsMobileView(props: {
  onboardings: ManagementOnboardingOutput[];
  views: SavedView[];
  activeView: string;
  onViewChange: (id: string) => void;
  selectedId: number | null;
  detail: ManagementOnboardingDetailOutput | null;
  detailLoading: boolean;
  onSelect: (id: number | null) => void;
  onAction: (detail: ManagementOnboardingDetailOutput, action: OnboardingAction) => void;
}) {
  const t = useTranslations('Management');

  if (props.selectedId !== null) {
    if (props.detailLoading || !props.detail) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          {t('onb_loading_detail')}
        </div>
      );
    }
    return (
      <MobileOnboardingDetail
        detail={props.detail}
        onBack={() => props.onSelect(null)}
        onAction={props.onAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SavedViewTabs views={props.views} active={props.activeView} onChange={props.onViewChange} />
      <div className="flex flex-col gap-2">
        {props.onboardings.map((onboarding) => (
          <OnboardingQueueCard
            key={onboarding.id}
            onboarding={onboarding}
            selected={false}
            onSelect={() => props.onSelect(onboarding.id)}
          />
        ))}
      </div>
    </div>
  );
}

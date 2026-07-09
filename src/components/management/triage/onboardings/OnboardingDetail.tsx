'use client';

import { CheckCircle2, MapPin, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { StatusPill, onboardingStatusTone } from '@/components/management/columns/StatusPill';
import { PhotoStrip } from '@/components/management/record-panel/PhotoStrip';
import { PricingGrid } from '@/components/management/triage/onboardings/PricingGrid';
import { Button } from '@/components/ui/button';
import { titleCase } from '@/libs/management/format';
import type { ManagementOnboardingDetailOutput } from '@/types/management';

export type OnboardingAction = 'approve' | 'request-info' | 'reject';

/**
 * The onboarding detail panel — owner header (properties-count chip, phone,
 * offer-accepted line), the submitted-property card with a map link, the pricing
 * grid, the photo strip, and a sticky footer (Approve… / Request more info /
 * Reject…). Fetched per-selection; renders a skeleton while loading.
 * @param props - The detail payload (or null while loading) and action dispatcher.
 * @returns The onboarding detail element.
 */
export function OnboardingDetail(props: {
  detail: ManagementOnboardingDetailOutput | null;
  isLoading: boolean;
  onAction: (detail: ManagementOnboardingDetailOutput, action: OnboardingAction) => void;
}) {
  const t = useTranslations('Management');
  const { detail } = props;

  if (props.isLoading || !detail) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
        {t('onb_loading_detail')}
      </div>
    );
  }

  const specs = [
    detail.district_name,
    t('lead_rooms', { count: detail.rooms }),
    `${detail.area_sqm} m²`,
    detail.total_floors ? `${detail.floor}/${detail.total_floors} fl` : `${detail.floor} fl`,
  ].join(' · ');

  const terminal = detail.status === 'approved' || detail.status === 'rejected';

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AvatarInitials name={detail.owner_name} size={44} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-[22px] leading-7 font-bold text-foreground">
                  {detail.owner_name}
                </span>
                <StatusPill
                  tone={onboardingStatusTone(detail.status)}
                  label={titleCase(detail.status)}
                />
                <StatusPill
                  tone="neutral"
                  label={t('onb_existing_owner', { count: detail.owner_properties_count })}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {[
                  detail.owner_phone,
                  detail.offer_version && detail.offer_accepted_at
                    ? t('onb_offer_accepted_on', {
                        version: detail.offer_version,
                        date: new Date(detail.offer_accepted_at).toLocaleDateString(),
                      })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
          {detail.owner_phone ? (
            <a
              href={`tel:${detail.owner_phone}`}
              aria-label={t('lead_call')}
              className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border text-foreground hover:bg-muted"
            >
              <Phone className="size-4" />
            </a>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {t('onb_submitted_property')}
          </span>
          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-background px-3.5 py-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium text-foreground">
                {detail.property_name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {detail.property_address} · {specs}
              </span>
            </div>
            <Link
              href={`/management/map?property=${detail.property_id}`}
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent-brand"
            >
              <MapPin className="size-4" />
              {t('onb_map')}
            </Link>
          </div>
        </div>

        <PricingGrid detail={detail} />

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

      <div className="flex shrink-0 items-center gap-3 border-t border-border px-6 py-3.5">
        <Button onClick={() => props.onAction(detail, 'approve')} disabled={terminal}>
          <CheckCircle2 className="size-4" />
          {t('onb_approve')}
        </Button>
        <Button
          variant="outline"
          onClick={() => props.onAction(detail, 'request-info')}
          disabled={terminal}
        >
          {t('onb_request_info')}
        </Button>
        <span className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground lg:inline">
            {t('onb_approve_hint')}
          </span>
          <button
            type="button"
            onClick={() => props.onAction(detail, 'reject')}
            disabled={terminal}
            className="text-sm font-medium text-danger disabled:text-muted-foreground"
          >
            {t('onb_reject')}
          </button>
        </span>
      </div>
    </div>
  );
}

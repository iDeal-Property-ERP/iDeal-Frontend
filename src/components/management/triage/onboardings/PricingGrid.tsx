'use client';

import { useTranslations } from 'next-intl';
import { titleCase } from '@/libs/management/format';
import type { ManagementOnboardingDetailOutput } from '@/types/management';

/**
 * The onboarding pricing grid — four cards surfacing the pricing decision:
 * the owner's ask, the district market estimate, iDeal's suggested price, and
 * the tariff fit. Market fields degrade gracefully to a dash when the district
 * has no comparable properties (BACKEND-GAP: computed from live comps only).
 * @param props - The onboarding detail payload.
 * @returns The pricing grid element.
 */
export function PricingGrid(props: { detail: ManagementOnboardingDetailOutput }) {
  const t = useTranslations('Management');
  const { detail } = props;

  const market =
    detail.market_min && detail.market_max ? `$${detail.market_min}–${detail.market_max}` : '—';

  const cards = [
    {
      label: t('onb_owner_asks'),
      value: `$${detail.ask_price}/mo`,
      caption: t('onb_negotiable'),
    },
    {
      label: t('onb_market_estimate'),
      value: market,
      caption: t('onb_district_median'),
    },
    {
      label: t('onb_suggested_price'),
      value: detail.suggested_price ? `$${detail.suggested_price}` : '—',
      caption: t('onb_margin_hint'),
    },
    {
      label: t('onb_tariff_fit'),
      value: titleCase(detail.tariff),
      caption: t('onb_district_median'),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-1 rounded-[12px] border border-border bg-background px-3.5 py-3"
        >
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {card.label}
          </span>
          <span className="font-display text-[20px] leading-6 font-bold text-foreground tabular-nums">
            {card.value}
          </span>
          <span className="truncate text-xs text-muted-foreground">{card.caption}</span>
        </div>
      ))}
    </div>
  );
}

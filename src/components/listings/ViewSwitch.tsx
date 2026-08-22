'use client';

import { Columns2, LayoutGrid, Map as MapIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useListingParams } from '@/hooks/useListingParams';
import { DEFAULT_DISCOVERY_VIEW, DISCOVERY_VIEWS } from '@/libs/marketplace';
import { cn } from '@/libs/utils';
import type { DiscoveryView } from '@/types/marketplace';

const ICONS = {
  list: LayoutGrid,
  split: Columns2,
  map: MapIcon,
} satisfies Record<DiscoveryView, LucideIcon>;

type ViewSwitchProps = {
  view: DiscoveryView;
};

/**
 * Desktop List / Split / Map segmented control (Figma 238:3). Writes the chosen view to the URL
 * `?view=`, keeping the default out of the URL so it stays canonical. Hidden on mobile, which always
 * uses the list + map-overlay experience.
 * @param props - The currently active view (resolved on the server so SSR matches the URL).
 * @returns The segmented control.
 */
export function ViewSwitch(props: ViewSwitchProps) {
  const { view } = props;
  const t = useTranslations('Listings');
  const { get, set } = useListingParams();

  const select = (next: DiscoveryView) => {
    set({
      view: next === DEFAULT_DISCOVERY_VIEW ? undefined : next,
      page: get('page') || undefined,
    });
  };

  return (
    <fieldset
      aria-label={t('aria_view_switch')}
      className="hidden shrink-0 items-center gap-1 rounded-[10px] border border-border bg-muted p-1 lg:inline-flex"
    >
      {DISCOVERY_VIEWS.map((v) => {
        const Icon = ICONS[v];
        const active = v === view;
        return (
          <button
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-[9px] text-sm font-medium transition',
              active
                ? 'bg-primary-subtle text-primary-subtle-foreground shadow-[0_1px_2px_0_rgba(11,18,32,0.14)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            key={v}
            onClick={() => select(v)}
            type="button"
          >
            <Icon className="size-[18px]" />
            {t(`view_${v}`)}
          </button>
        );
      })}
    </fieldset>
  );
}

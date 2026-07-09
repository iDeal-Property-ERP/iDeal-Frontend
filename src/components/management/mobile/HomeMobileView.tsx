'use client';

import { Plus } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { AttentionItem } from '@/components/management/dashboard/NeedsAttention';
import { NeedsAttention } from '@/components/management/dashboard/NeedsAttention';
import { OccupancyPanel } from '@/components/management/dashboard/OccupancyPanel';
import type { KpiItem } from '@/components/management/KpiStrip';
import { KpiStrip } from '@/components/management/KpiStrip';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/libs/auth';
import { Link } from '@/libs/I18nNavigation';
import type { ManagementDashboardOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

/**
 * The mobile Management dashboard — a calm, single-column rethink of the desktop
 * home: a greeting header with the primary "Add property" action, a 2-column
 * grid of the key KPI tiles, and the occupancy and needs-attention cards stacked
 * full-width. Reuses the shared dashboard components so light/dark and tokens
 * stay in parity with desktop; the page stays a thin desktop/mobile switch.
 * @param props - Translator, the dashboard payload, and the derived KPI/attention data.
 * @returns The mobile dashboard view.
 */
export function HomeMobileView(props: {
  t: Translator;
  dashboard: ManagementDashboardOutput;
  kpiItems: KpiItem[];
  attention: AttentionItem[];
}) {
  const { t, dashboard } = props;
  const { occupancy } = dashboard;
  const { user } = useAuth();
  // Build the greeting client-side via next-intl instead of the backend's baked
  // Uzbek string, so it follows the active locale.
  const greeting = t('mgmt_greeting', { name: user?.first_name ?? '' });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            {[dashboard.location, dashboard.date].filter(Boolean).join(' · ')}
          </p>
          <h1 className="font-display text-[26px] leading-[32px] font-extrabold tracking-[-0.4px] text-foreground">
            {greeting}
          </h1>
        </div>
        <Button
          asChild
          className="h-11 w-full gap-2 rounded-[12px] text-[15px] font-medium shadow-sm"
        >
          <Link href="/management/properties/new">
            <Plus className="size-[17px]" />
            {t('add_property')}
          </Link>
        </Button>
      </header>

      <KpiStrip items={props.kpiItems} />

      <OccupancyPanel
        title={t('occupancy')}
        rate={occupancy.rate}
        rented={occupancy.rented}
        vacant={occupancy.vacant}
        maintenance={occupancy.maintenance}
        rentedLabel={t('occ_rented')}
        vacantLabel={t('occ_vacant')}
        maintenanceLabel={t('occ_maintenance')}
      />

      <NeedsAttention
        title={t('needs_attention')}
        items={props.attention}
        emptyTitle={t('empty_attention')}
        emptyDescription={t('empty_attention_desc')}
      />
    </div>
  );
}

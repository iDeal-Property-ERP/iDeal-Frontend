'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { OnboardingDetail } from '@/components/management/triage/onboardings/OnboardingDetail';
import type { OnboardingAction } from '@/components/management/triage/onboardings/OnboardingDetail';
import { OnboardingQueueCard } from '@/components/management/triage/onboardings/OnboardingQueueCard';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import type {
  ManagementOnboardingDetailOutput,
  ManagementOnboardingOutput,
} from '@/types/management';

/**
 * The mobile Onboardings experience — a tab bar over a card list that pushes to
 * a full-screen detail. Reuses {@link OnboardingQueueCard} and
 * {@link OnboardingDetail}; the parent owns data, selection, and actions.
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
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => props.onSelect(null)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
          {t('onb_back')}
        </button>
        <div className="rounded-[16px] border border-border bg-card">
          <OnboardingDetail
            detail={props.detail}
            isLoading={props.detailLoading}
            onAction={props.onAction}
          />
        </div>
      </div>
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

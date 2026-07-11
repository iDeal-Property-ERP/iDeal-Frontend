'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import {
  ApproveOnboardingDrawer,
  RejectOnboardingDialog,
  RequestInfoDialog,
} from '@/components/management/dialogs/OnboardingDialogs';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { MobileSearchToggle } from '@/components/management/mobile/MobileSearchToggle';
import { OnboardingsMobileView } from '@/components/management/mobile/OnboardingsMobileView';
import { ErrorState } from '@/components/management/states/ErrorState';
import { OnboardingDetail } from '@/components/management/triage/onboardings/OnboardingDetail';
import type { OnboardingAction } from '@/components/management/triage/onboardings/OnboardingDetail';
import { OnboardingQueueCard } from '@/components/management/triage/onboardings/OnboardingQueueCard';
import { TriageShell } from '@/components/management/triage/TriageShell';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { usePaginatedResource } from '@/hooks/management/usePaginatedResource';
import { useQueueKeyboard } from '@/hooks/management/useQueueKeyboard';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  getOnboarding,
  getOnboardingsStats,
  listOnboardings,
} from '@/libs/management/onboardingsAdapter';
import type {
  ManagementOnboardingDetailOutput,
  ManagementOnboardingOutput,
  OnboardingsStats,
} from '@/types/management';

const TABS = ['submitted', 'offer_accepted', 'approved', 'rejected'] as const;

export default function ManagementOnboardingsPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();

  const [tab, setTab] = useState<string>('submitted');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ManagementOnboardingDetailOutput | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState<OnboardingsStats | null>(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const anyDialogOpen = approveOpen || rejectOpen || infoOpen;

  const resource = usePaginatedResource<ManagementOnboardingOutput>(
    async ({ page, query }) =>
      await listOnboardings({
        page,
        perPage: 50,
        status: query.status as string,
        search: (query.search as string) || undefined,
      }),
    { initialQuery: { status: 'submitted', search: '' } },
  );
  const { patchQuery, refetch, data: onboardings } = resource;

  const reloadStats = useCallback(() => {
    getOnboardingsStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);
  useEffect(() => {
    reloadStats();
  }, [reloadStats]);

  // Keep the selection valid, and on desktop auto-select the first onboarding to fill the
  // two-pane detail. Mobile reuses `selectedId` for push navigation (list ↔ full-screen
  // detail), so it must default to the list — auto-selecting there traps the user in a
  // detail on load, since "back" clears the selection and this effect re-selects instantly.
  useEffect(() => {
    if (selectedId && !onboardings.some((o) => o.id === selectedId)) {
      setSelectedId(null);
      return;
    }
    if (!isMobile && !selectedId && onboardings.length > 0) {
      setSelectedId(onboardings[0]!.id);
    }
  }, [onboardings, selectedId, isMobile]);

  // Fetch the rich detail whenever the selection changes.
  useEffect(() => {
    if (selectedId === null) {
      setDetail(null);
      return () => {
        // No selection — nothing to tear down.
      };
    }
    let active = true;
    setDetailLoading(true);
    getOnboarding(selectedId)
      .then((d) => {
        if (active) {
          setDetail(d);
        }
      })
      .catch(() => {
        if (active) {
          setDetail(null);
        }
      })
      .finally(() => {
        if (active) {
          setDetailLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const changeTab = (next: string) => {
    setTab(next);
    setSelectedId(null);
    patchQuery({ status: next });
  };
  const changeSearch = (next: string) => {
    setSearch(next);
    patchQuery({ search: next });
  };

  const afterMutation = () => {
    refetch();
    reloadStats();
    if (selectedId !== null) {
      getOnboarding(selectedId)
        .then(setDetail)
        .catch(() => setDetail(null));
    }
  };

  const onAction = useCallback(
    (_detail: ManagementOnboardingDetailOutput, action: OnboardingAction) => {
      if (action === 'approve') {
        setApproveOpen(true);
      } else if (action === 'request-info') {
        setInfoOpen(true);
      } else if (action === 'reject') {
        setRejectOpen(true);
      }
    },
    [],
  );

  useQueueKeyboard({
    ids: onboardings.map((o) => String(o.id)),
    selectedId: selectedId === null ? null : String(selectedId),
    onSelect: (id) => setSelectedId(Number(id)),
    enabled: !anyDialogOpen && !isMobile,
  });

  const views: SavedView[] = TABS.map((id) => ({
    id,
    label: t(`onb_tab_${id}`),
    count: stats?.counts[id],
  }));

  const subtitle = stats ? t('onb_subtitle', { count: stats.open }) : t('onb_subtitle_loading');

  const dialogs = (
    <>
      <ApproveOnboardingDrawer
        detail={detail}
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onSuccess={afterMutation}
      />
      <RejectOnboardingDialog
        detail={detail}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSuccess={afterMutation}
      />
      <RequestInfoDialog
        detail={detail}
        open={infoOpen}
        onOpenChange={setInfoOpen}
        onSuccess={afterMutation}
      />
    </>
  );

  const railContent = ((): React.ReactNode => {
    if (resource.isLoading && onboardings.length === 0) {
      return <p className="px-1 py-8 text-center text-sm text-muted-foreground">{t('loading')}</p>;
    }
    if (onboardings.length === 0) {
      return (
        <p className="px-1 py-8 text-center text-sm text-muted-foreground">{t('onb_empty')}</p>
      );
    }
    return onboardings.map((onboarding) => (
      <OnboardingQueueCard
        key={onboarding.id}
        onboarding={onboarding}
        selected={onboarding.id === selectedId}
        onSelect={() => setSelectedId(onboarding.id)}
      />
    ));
  })();

  if (resource.error) {
    return (
      <ErrorState
        title={t('onb_error')}
        message={resource.error}
        onRetry={resource.refetch}
        retryLabel={t('retry')}
      />
    );
  }

  if (isMobile) {
    return (
      <>
        <ManagementPageHeader
          title={t('nav_onboardings')}
          subtitle={subtitle}
          topRight={
            <MobileSearchToggle
              ariaLabel={t('onb_search')}
              onChange={changeSearch}
              placeholder={t('onb_search')}
              value={search}
            />
          }
        />
        <div className="mt-4">
          <OnboardingsMobileView
            onboardings={onboardings}
            views={views}
            activeView={tab}
            onViewChange={changeTab}
            selectedId={selectedId}
            detail={detail}
            detailLoading={detailLoading}
            onSelect={setSelectedId}
            onAction={onAction}
          />
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <TriageShell
        header={<ManagementPageHeader title={t('nav_onboardings')} subtitle={subtitle} />}
        tabs={<SavedViewTabs views={views} active={tab} onChange={changeTab} />}
        rail={railContent}
        railFooter={t('onb_kbd_hint')}
        detail={
          selectedId !== null ? (
            <OnboardingDetail detail={detail} isLoading={detailLoading} onAction={onAction} />
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
              {t('onb_select_prompt')}
            </div>
          )
        }
      />
      {dialogs}
    </>
  );
}

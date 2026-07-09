'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConvertToLeaseWizard } from '@/components/management/dialogs/ConvertToLeaseWizard';
import {
  ApproveBookingDialog,
  CancelLeadDialog,
  ProposeTimeDialog,
} from '@/components/management/dialogs/LeadDialogs';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { MethodSegmented } from '@/components/management/MethodSegmented';
import { LeadsMobileView } from '@/components/management/mobile/LeadsMobileView';
import { ErrorState } from '@/components/management/states/ErrorState';
import { LeadDetail } from '@/components/management/triage/leads/LeadDetail';
import type { LeadAction } from '@/components/management/triage/leads/LeadDetail';
import { LeadQueueCard } from '@/components/management/triage/leads/LeadQueueCard';
import { TriageShell } from '@/components/management/triage/TriageShell';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { SearchField } from '@/components/management/workbench/SearchField';
import { usePaginatedResource } from '@/hooks/management/usePaginatedResource';
import { useQueueKeyboard } from '@/hooks/management/useQueueKeyboard';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  confirmViewing,
  getLeadsStats,
  isLeadUnread,
  listLeads,
  markLeadSeen,
} from '@/libs/management/leadsAdapter';
import type { LeadsStats, ManagementLeadOutput } from '@/types/management';

const TABS = ['new', 'scheduled', 'awaiting', 'closed'] as const;

export default function ManagementLeadsPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();

  const [tab, setTab] = useState<string>('new');
  const [type, setType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<LeadsStats | null>(null);

  const [proposeLead, setProposeLead] = useState<ManagementLeadOutput | null>(null);
  const [cancelLead, setCancelLead] = useState<ManagementLeadOutput | null>(null);
  const [convertLead, setConvertLead] = useState<ManagementLeadOutput | null>(null);
  const [approveLead, setApproveLead] = useState<ManagementLeadOutput | null>(null);
  const anyDialogOpen = Boolean(proposeLead ?? cancelLead ?? convertLead ?? approveLead);

  const resource = usePaginatedResource<ManagementLeadOutput>(
    async ({ page, query }) =>
      await listLeads({
        page,
        perPage: 50,
        tab: query.tab as string,
        type: query.type === 'all' ? undefined : (query.type as string),
        search: (query.search as string) || undefined,
      }),
    { initialQuery: { tab: 'new', type: 'all', search: '' } },
  );

  const { patchQuery, refetch, data: leads } = resource;

  const reloadStats = useCallback(() => {
    getLeadsStats({ type: type === 'all' ? undefined : type, search: search || undefined })
      .then(setStats)
      .catch(() => setStats(null));
  }, [type, search]);

  useEffect(() => {
    reloadStats();
  }, [reloadStats]);

  // Auto-select the first lead whenever the list changes and nothing valid is selected.
  useEffect(() => {
    if (leads.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !leads.some((l) => l.id === selectedId)) {
      setSelectedId(leads[0]!.id);
    }
  }, [leads, selectedId]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  useEffect(() => {
    if (selected) {
      markLeadSeen(selected);
    }
  }, [selected]);

  const changeTab = (next: string) => {
    setTab(next);
    setSelectedId(null);
    patchQuery({ tab: next });
  };
  const changeType = (next: string) => {
    setType(next);
    setSelectedId(null);
    patchQuery({ type: next });
  };
  const changeSearch = (next: string) => {
    setSearch(next);
    patchQuery({ search: next });
  };

  const afterMutation = () => {
    refetch();
    reloadStats();
  };

  const onAction = async (lead: ManagementLeadOutput, action: LeadAction) => {
    try {
      if (action === 'confirm') {
        await confirmViewing(lead.source_id);
        afterMutation();
      } else if (action === 'approve') {
        setApproveLead(lead);
      } else if (action === 'propose') {
        setProposeLead(lead);
      } else if (action === 'cancel' || action === 'reject') {
        setCancelLead(lead);
      } else if (action === 'convert') {
        setConvertLead(lead);
      }
    } catch {
      // toast handled inside dialogs; direct actions fail silently to the list
    }
  };

  // Keyboard: ↑/↓ navigate, Enter no-op (already open), C = confirm/approve.
  useQueueKeyboard({
    ids: leads.map((l) => l.id),
    selectedId,
    onSelect: setSelectedId,
    hotkeys: {
      c: () => {
        if (selected) {
          void onAction(selected, selected.type === 'viewing' ? 'confirm' : 'approve');
        }
      },
    },
    enabled: !anyDialogOpen && !isMobile,
  });

  const views: SavedView[] = TABS.map((id) => ({
    id,
    label: t(`lead_tab_${id}`),
    count: stats?.counts[id],
  }));

  const typeOptions = [
    { value: 'all', label: t('lead_type_all') },
    { value: 'viewing', label: t('lead_type_viewings') },
    { value: 'booking', label: t('lead_type_bookings') },
  ];

  const subtitle = stats ? t('lead_subtitle', { count: stats.open }) : t('lead_subtitle_loading');

  const dialogs = (
    <>
      <ProposeTimeDialog
        key={proposeLead?.id ?? 'propose'}
        lead={proposeLead}
        open={Boolean(proposeLead)}
        onOpenChange={(o) => !o && setProposeLead(null)}
        onSuccess={afterMutation}
      />
      <CancelLeadDialog
        lead={cancelLead}
        open={Boolean(cancelLead)}
        onOpenChange={(o) => !o && setCancelLead(null)}
        onSuccess={afterMutation}
      />
      <ApproveBookingDialog
        lead={approveLead}
        open={Boolean(approveLead)}
        onOpenChange={(o) => !o && setApproveLead(null)}
        onSuccess={afterMutation}
      />
      <ConvertToLeaseWizard
        key={convertLead?.id ?? 'convert'}
        lead={convertLead}
        open={Boolean(convertLead)}
        onOpenChange={(o) => !o && setConvertLead(null)}
        onSuccess={afterMutation}
      />
    </>
  );

  const railContent = ((): React.ReactNode => {
    if (resource.isLoading && leads.length === 0) {
      return <p className="px-1 py-8 text-center text-sm text-muted-foreground">{t('loading')}</p>;
    }
    if (leads.length === 0) {
      return (
        <p className="px-1 py-8 text-center text-sm text-muted-foreground">{t('lead_empty')}</p>
      );
    }
    return leads.map((lead) => (
      <LeadQueueCard
        key={lead.id}
        lead={lead}
        selected={lead.id === selectedId}
        unread={isLeadUnread(lead)}
        onSelect={() => setSelectedId(lead.id)}
      />
    ));
  })();

  if (resource.error) {
    return (
      <ErrorState
        title={t('lead_error')}
        message={resource.error}
        onRetry={resource.refetch}
        retryLabel={t('retry')}
      />
    );
  }

  if (isMobile) {
    return (
      <>
        <ManagementPageHeader title={t('nav_leads')} subtitle={subtitle} />
        <div className="mt-4">
          <LeadsMobileView
            leads={leads}
            views={views}
            activeView={tab}
            onViewChange={changeTab}
            selected={selected}
            onSelect={(l) => setSelectedId(l?.id ?? null)}
            onAction={onAction}
            isUnread={isLeadUnread}
          />
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <TriageShell
        header={
          <ManagementPageHeader
            title={t('nav_leads')}
            subtitle={subtitle}
            actions={<MethodSegmented options={typeOptions} value={type} onChange={changeType} />}
          />
        }
        tabs={<SavedViewTabs views={views} active={tab} onChange={changeTab} />}
        search={
          <SearchField
            value={search}
            onChange={changeSearch}
            placeholder={t('lead_search')}
            ariaLabel={t('lead_search')}
            clearLabel={t('clear')}
          />
        }
        rail={railContent}
        railFooter={t('lead_kbd_hint')}
        detail={
          selected ? (
            <LeadDetail lead={selected} onAction={onAction} />
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
              {t('lead_select_prompt')}
            </div>
          )
        }
      />
      {dialogs}
    </>
  );
}

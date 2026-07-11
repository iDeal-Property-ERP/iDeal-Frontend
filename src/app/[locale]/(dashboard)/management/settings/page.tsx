'use client';

import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { EmptyState } from '@/components/management/states/EmptyState';

/**
 * The Management settings page — the sidebar-footer Settings destination.
 * Currently a shell consistent with the other Management pages; workspace,
 * profile, and notification preferences will land here.
 * @returns The settings page.
 */
export default function ManagementSettingsPage() {
  const t = useTranslations('Management');

  return (
    <div className="flex flex-col gap-5">
      <ManagementPageHeader
        title={t('settings')}
        subtitle={t('settings_subtitle')}
        showBell={false}
      />
      <div className="rounded-[16px] border border-border bg-card shadow-sm">
        <EmptyState
          icon={Settings}
          title={t('settings_empty')}
          description={t('settings_empty_desc')}
          tone="muted"
        />
      </div>
    </div>
  );
}

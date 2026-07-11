'use client';

import { CreditCard, FileText, PanelRightClose } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { initialsOf } from '@/components/management/columns/AvatarInitials';
import { roleTone, StatusPill, userStatusTone } from '@/components/management/columns/StatusPill';
import { EmptyState } from '@/components/management/states/EmptyState';
import { Button } from '@/components/ui/button';
import { relativeTimeFromNow, updateUser } from '@/libs/management/usersAdapter';
import type { UserOutput } from '@/types/management';
import type { ActivityEvent } from './ActivityTimeline';
import { ActivityTimeline } from './ActivityTimeline';
import { OwnerAgreementCard } from './OwnerAgreementCard';
import { PricingTrio } from './PricingTrio';
import { RecordPanel } from './RecordPanel';
import { RecordPanelTabs } from './RecordPanelTabs';

/**
 * Formats an ISO date to a short "Jun 20, 2025" label.
 * @param iso - The ISO date string (or null).
 * @returns The formatted date, or an empty string when unparseable.
 */
function longDate(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * The full display name of a user ("first last"), trimmed and space-collapsed.
 * @param user - The user record.
 * @returns The full name.
 */
function fullName(user: UserOutput): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username;
}

/**
 * The User instance of the record panel (archetype D, people variant) — fills
 * the reusable RecordPanel with a user's header (name + status + role pills),
 * a role / verified / last-active trio, a contact card, tabs, and derived
 * activity, plus a sticky Edit / Activate–Deactivate footer. No hero photo (a
 * listing thumbnail would be meaningless for a person).
 * @param props - The user, open/close state, and edit / toggle callbacks.
 * @returns The user record panel element (or null with no user).
 */
export function UserRecordPanel(props: {
  user: UserOutput | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  roleLabel: (role: string) => string;
  statusLabel: (isActive: boolean) => string;
  /** Optional post-toggle hook (parent refetch); the panel owns the mutation. */
  onToggleActive?: () => void;
}) {
  const t = useTranslations('Management');
  const { user } = props;
  const [activeTab, setActiveTab] = useState('overview');
  const [busy, setBusy] = useState(false);

  if (!user) {
    return null;
  }

  const rel = relativeTimeFromNow(user.updated_at);
  const activeValue =
    rel.unit === 'today'
      ? t('usr_active_today')
      : t(`usr_active_${rel.unit}` as 'usr_active_days', { count: rel.count });

  const tabs = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'leases', label: t('usr_tab_leases') },
    { id: 'payments', label: t('tab_payments') },
    { id: 'documents', label: t('tab_documents') },
    { id: 'activity', label: t('tab_activity') },
  ];

  const activity: ActivityEvent[] = [
    {
      id: 'created',
      title: t('usr_activity_created'),
      time: longDate(user.created_at),
      tone: 'accent',
    },
    ...(user.is_verified
      ? [
          {
            id: 'verified',
            title: t('usr_activity_verified'),
            time: longDate(user.updated_at),
            tone: 'success' as const,
          },
        ]
      : []),
    {
      id: 'updated',
      title: t('usr_activity_updated'),
      time: longDate(user.updated_at),
      tone: 'muted',
    },
  ];

  const handleToggle = async () => {
    setBusy(true);
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? t('usr_deactivated') : t('usr_activated'));
      props.onToggleActive?.();
    } catch {
      toast.error(t('usr_toggle_failed'));
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="truncate font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {fullName(user)}
          </h2>
          <StatusPill
            tone={userStatusTone(user.is_active)}
            label={props.statusLabel(user.is_active)}
          />
          <StatusPill tone={roleTone(user.role)} label={props.roleLabel(user.role)} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{user.email}</span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            @{user.username}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="max-lg:hidden"
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
        <Button
          type="button"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-sm"
          onClick={props.onEdit}
        >
          {t('usr_edit')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] shadow-none"
          onClick={handleToggle}
          disabled={busy}
        >
          {user.is_active ? t('usr_deactivate') : t('usr_activate')}
        </Button>
      </div>
    </div>
  );

  let emptyIcon = FileText;
  let emptyTitle = t('usr_empty_leases');
  if (activeTab === 'payments') {
    emptyIcon = CreditCard;
    emptyTitle = t('empty_payments');
  } else if (activeTab === 'documents') {
    emptyTitle = t('empty_documents');
  }

  return (
    <RecordPanel
      open={props.open}
      onClose={props.onClose}
      title={t('record_type_user')}
      header={header}
      footer={footer}
    >
      <PricingTrio
        items={[
          {
            label: t('usr_trio_role'),
            value: props.roleLabel(user.role),
            caption: `@${user.username}`,
          },
          {
            label: t('usr_trio_verified'),
            value: user.is_verified ? t('usr_yes') : t('usr_no'),
            caption: t('usr_trio_verified_caption'),
          },
          {
            label: t('usr_trio_active'),
            value: activeValue,
            caption: t('usr_trio_active_caption'),
          },
        ]}
      />

      <OwnerAgreementCard
        initials={initialsOf(fullName(user))}
        ownerLine={t('usr_contact_line', {
          name: fullName(user),
          role: props.roleLabel(user.role),
        })}
        detailLine={t('usr_contact_detail', { phone: user.phone || '—', email: user.email })}
        statusLabel={user.is_verified ? t('usr_verified') : undefined}
      />

      <RecordPanelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' || activeTab === 'activity' ? (
        <ActivityTimeline heading={t('recent_activity')} events={activity} />
      ) : (
        <EmptyState icon={emptyIcon} title={emptyTitle} tone="muted" className="py-10" />
      )}
    </RecordPanel>
  );
}

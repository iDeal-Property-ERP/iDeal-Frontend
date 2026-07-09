'use client';

import type { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { roleTone, StatusPill, userStatusTone } from '@/components/management/columns/StatusPill';
import type { MobileChip } from '@/components/management/mobile/MobileWorkbench';
import { MobileWorkbench } from '@/components/management/mobile/MobileWorkbench';
import { ModuleListCard } from '@/components/management/mobile/ModuleListCard';
import { relativeTimeFromNow } from '@/libs/management/usersAdapter';
import type { UserOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations<'Management'>>;

/**
 * The full display name of a user ("first last").
 * @param user - The user record.
 * @returns The full name, falling back to the username.
 */
function fullName(user: UserOutput): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username;
}

/**
 * A relative "last active" label for a user's most recent update.
 * @param t - The Management translator.
 * @param iso - The ISO timestamp.
 * @returns The localized relative "last active" label.
 */
function activeLabel(t: Translator, iso: string): string {
  const rel = relativeTimeFromNow(iso);
  if (rel.unit === 'today') {
    return t('usr_active_today');
  }
  return t(`usr_active_${rel.unit}` as 'usr_active_days', { count: rel.count });
}

/**
 * The mobile Users workbench — a card list of accounts across roles with an
 * initials avatar, status + role pills, and a relative last-active value; a
 * tapped row opens the shared user record panel full-screen.
 * @param props - Rows, chips, search, record slot, and handlers.
 * @returns The mobile users view.
 */
export function UsersMobileView(props: {
  t: Translator;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  rows: UserOutput[];
  chips: MobileChip[];
  activeChip: string;
  onChip: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  roleLabel?: (value: string) => string;
  statusLabel?: (value: boolean) => string;
  onOpen: (row: UserOutput) => void;
  record?: ReactNode;
  onCloseRecord: () => void;
  empty: ReactNode;
}) {
  const { t } = props;
  return (
    <MobileWorkbench
      title={props.title}
      subtitle={props.subtitle}
      chips={props.chips}
      activeChip={props.activeChip}
      onChipChange={props.onChip}
      search={{
        value: props.search,
        onChange: props.onSearch,
        placeholder: props.searchPlaceholder,
      }}
      isEmpty={props.rows.length === 0}
      empty={props.empty}
      record={props.record}
      onCloseRecord={props.onCloseRecord}
      backLabel={t('back')}
    >
      {props.rows.map((user) => (
        <ModuleListCard
          key={user.id}
          leading={<AvatarInitials name={fullName(user)} size={44} />}
          title={fullName(user)}
          subtitle={user.email}
          meta={
            <>
              <StatusPill
                tone={userStatusTone(user.is_active)}
                label={props.statusLabel ? props.statusLabel(user.is_active) : ''}
              />
              <StatusPill
                tone={roleTone(user.role)}
                label={props.roleLabel ? props.roleLabel(user.role) : user.role}
              />
            </>
          }
          value={activeLabel(t, user.updated_at)}
          onClick={() => props.onOpen(user)}
        />
      ))}
    </MobileWorkbench>
  );
}

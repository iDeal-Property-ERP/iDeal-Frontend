'use client';

import type { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { agentStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatMoney } from '@/components/management/format';
import type { MobileChip } from '@/components/management/mobile/MobileWorkbench';
import { MobileWorkbench } from '@/components/management/mobile/MobileWorkbench';
import { ModuleListCard } from '@/components/management/mobile/ModuleListCard';
import type { AgentOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

/**
 * The mobile Agents workbench — partner-agent card list with status pills and
 * total volume; a tapped row opens the shared agent record panel full-screen.
 * @param props - Rows, chips, search, record slot, and handlers.
 * @returns The mobile agents view.
 */
export function AgentsMobileView(props: {
  t: Translator;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  rows: AgentOutput[];
  chips: MobileChip[];
  activeChip: string;
  onChip: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  statusLabel: (active: boolean) => string;
  onOpen: (row: AgentOutput) => void;
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
      {props.rows.map((row) => (
        <ModuleListCard
          key={row.id}
          leading={<AvatarInitials name={row.user_name} size={44} />}
          title={row.user_name}
          subtitle={t('agt_col_agent_secondary')}
          meta={
            <StatusPill
              tone={agentStatusTone(row.is_active)}
              label={props.statusLabel(row.is_active)}
            />
          }
          value={formatMoney(row.total_revenue)}
          onClick={() => props.onOpen(row)}
        />
      ))}
    </MobileWorkbench>
  );
}

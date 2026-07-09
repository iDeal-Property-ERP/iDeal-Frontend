'use client';

import { ScrollText } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { agreementStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import type { MobileChip } from '@/components/management/mobile/MobileWorkbench';
import { MobileWorkbench } from '@/components/management/mobile/MobileWorkbench';
import { ModuleListCard } from '@/components/management/mobile/ModuleListCard';
import type { ManagementAgreementOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

/**
 * The mobile Owner Agreements workbench — a card list of trust-management
 * contracts with status pills and commission; a tapped row opens the shared
 * agreement record panel full-screen.
 * @param props - Rows, chips, search, record slot, and handlers.
 * @returns The mobile agreements view.
 */
export function AgreementsMobileView(props: {
  t: Translator;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  rows: ManagementAgreementOutput[];
  chips: MobileChip[];
  activeChip: string;
  onChip: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  statusLabel: (value: string) => string;
  onOpen: (row: ManagementAgreementOutput) => void;
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
          leading={
            <span className="flex size-11 items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
              <ScrollText className="size-5" />
            </span>
          }
          title={`${row.agreement_number} · ${row.owner_name}`}
          subtitle={row.property_name}
          meta={
            <StatusPill
              tone={agreementStatusTone(row.status)}
              label={props.statusLabel(row.status)}
            />
          }
          value={t('agr_commission_value', { rate: row.commission_rate })}
          onClick={() => props.onOpen(row)}
        />
      ))}
    </MobileWorkbench>
  );
}

'use client';

import { FileText } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { leaseStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatMoney } from '@/components/management/format';
import type { MobileChip } from '@/components/management/mobile/MobileWorkbench';
import { MobileWorkbench } from '@/components/management/mobile/MobileWorkbench';
import { ModuleListCard } from '@/components/management/mobile/ModuleListCard';
import type { ManagementLeaseOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

/**
 * The mobile Leases workbench — expiring-first card list with status pills and
 * rent; a tapped row opens the shared lease record panel full-screen.
 * @param props - Rows, chips, search, record slot, and handlers.
 * @returns The mobile leases view.
 */
export function LeasesMobileView(props: {
  t: Translator;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  rows: ManagementLeaseOutput[];
  chips: MobileChip[];
  activeChip: string;
  onChip: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  statusLabel: (value: string) => string;
  onOpen: (row: ManagementLeaseOutput) => void;
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
              <FileText className="size-5" />
            </span>
          }
          title={row.tenant_name}
          subtitle={row.property_name}
          meta={
            <StatusPill tone={leaseStatusTone(row.status)} label={props.statusLabel(row.status)} />
          }
          value={formatMoney(row.monthly_rent)}
          onClick={() => props.onOpen(row)}
        />
      ))}
    </MobileWorkbench>
  );
}

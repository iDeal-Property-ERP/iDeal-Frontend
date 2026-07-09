'use client';

import { CheckCircle2, Clock, HandCoins } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { payoutStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatCurrency } from '@/components/management/format';
import type { MobileChip } from '@/components/management/mobile/MobileWorkbench';
import { MobileWorkbench } from '@/components/management/mobile/MobileWorkbench';
import { ModuleListCard } from '@/components/management/mobile/ModuleListCard';
import { SwipeActionRow } from '@/components/management/mobile/SwipeActionRow';
import type { ManagementPayoutOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

/** Payouts that can still be paid or held (not already paid/cancelled). */
const ACTIONABLE = new Set(['scheduled', 'held']);

/**
 * The mobile Payouts workbench — the due-first owner-payout card list with status
 * pills and amounts; a tapped row opens the shared payout record panel
 * full-screen.
 * @param props - Rows, chips, search, record slot, and handlers.
 * @returns The mobile payouts view.
 */
export function PayoutsMobileView(props: {
  t: Translator;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  rows: ManagementPayoutOutput[];
  chips: MobileChip[];
  activeChip: string;
  onChip: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  statusLabel: (value: string) => string;
  onOpen: (row: ManagementPayoutOutput) => void;
  onPaid: (row: ManagementPayoutOutput) => void;
  onHold: (row: ManagementPayoutOutput) => void;
  record?: ReactNode;
  onCloseRecord: () => void;
  empty: ReactNode;
}) {
  const { t } = props;
  const card = (row: ManagementPayoutOutput) => (
    <ModuleListCard
      leading={
        <span className="flex size-11 items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
          <HandCoins className="size-5" />
        </span>
      }
      title={row.owner_name}
      subtitle={row.property_name ?? undefined}
      meta={
        <StatusPill tone={payoutStatusTone(row.status)} label={props.statusLabel(row.status)} />
      }
      value={formatCurrency(row.amount, row.currency)}
      onClick={() => props.onOpen(row)}
    />
  );
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
      {props.rows.map((row) =>
        ACTIONABLE.has(row.status.toLowerCase()) ? (
          <SwipeActionRow
            key={row.id}
            actions={[
              {
                label: t('payout_swipe_paid'),
                icon: CheckCircle2,
                tone: 'success',
                onAction: () => props.onPaid(row),
              },
              {
                label: t('payout_swipe_hold'),
                icon: Clock,
                tone: 'warning',
                onAction: () => props.onHold(row),
              },
            ]}
          >
            {card(row)}
          </SwipeActionRow>
        ) : (
          <div key={row.id}>{card(row)}</div>
        ),
      )}
    </MobileWorkbench>
  );
}

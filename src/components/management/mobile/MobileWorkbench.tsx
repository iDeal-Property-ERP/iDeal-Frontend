'use client';

import { Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

export type MobileChip = { id: string; label: string; count?: number };

type MobileWorkbenchProps = {
  title: string;
  subtitle: string;
  chips: MobileChip[];
  activeChip: string;
  onChipChange: (id: string) => void;
  search: { value: string; onChange: (value: string) => void; placeholder: string };
  /** The rendered card list (already mapped from rows). */
  children: ReactNode;
  /** Empty-state node shown when there are no rows. */
  empty?: ReactNode;
  isEmpty: boolean;
  /** Optional floating action button (Portfolio only). */
  fab?: { label: string; onClick: () => void };
  /** The record panel — rendered as its own full-screen dialog overlay on tap. */
  record?: ReactNode;
  /** Retained for caller API compatibility (the panel self-manages close). */
  onCloseRecord?: () => void;
  backLabel?: string;
};

/**
 * The generic mobile workbench for admin module lists — a title/subtitle header,
 * a horizontally-scrollable filter-chip row, an inline search field, and a
 * card list. Selecting a row swaps the whole view for a full-screen record
 * overlay. One shared shell for Leases, Agreements, Inventory, Payouts, Users,
 * Agents, and Properties on mobile.
 * @param props - Header, chips, search, card list, empty state, and record slot.
 * @returns The mobile workbench.
 */
export function MobileWorkbench(props: MobileWorkbenchProps) {
  // The record panel renders as its own full-screen dialog on mobile (self-managed
  // close), so it's rendered as an overlay sibling over the list, not a swap.
  return (
    <>
      {props.record}
      <div className="flex flex-col gap-4 p-4">
        <div>
          <h1 className="font-display text-[26px] leading-8 font-bold tracking-[-0.12px] text-foreground">
            {props.title}
          </h1>
          <p className="text-sm text-muted-foreground">{props.subtitle}</p>
        </div>

        <label className="flex h-11 items-center gap-2 rounded-[12px] border border-border bg-card px-3.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={props.search.value}
            onChange={(event) => props.search.onChange(event.target.value)}
            placeholder={props.search.placeholder}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-0.5">
          {props.chips.map((chip) => {
            const active = chip.id === props.activeChip;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => props.onChipChange(chip.id)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  active
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {chip.label}
                {chip.count !== undefined ? (
                  <span className={active ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                    {chip.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {props.isEmpty ? (
          props.empty
        ) : (
          <div className="flex flex-col gap-2.5">{props.children}</div>
        )}

        {props.fab ? (
          <button
            type="button"
            onClick={props.fab.onClick}
            aria-label={props.fab.label}
            className="fixed right-5 bottom-20 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
          >
            <Plus className="size-6" />
          </button>
        ) : null}
      </div>
    </>
  );
}

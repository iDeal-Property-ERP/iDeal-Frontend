'use client';

import { Search } from 'lucide-react';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { cn } from '@/libs/utils';

type SearchConfig = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
};

type ManagementPageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Inline search field shown on the right (desktop), full-width on mobile. */
  search?: SearchConfig;
  /** Whether to render the notification bell (defaults to true). */
  showBell?: boolean;
  /** Primary action(s) rendered at the far right (e.g. an "Add property" button). */
  actions?: React.ReactNode;
  /** Record count shown next to the title, e.g. "128 properties". */
  count?: string;
};

/**
 * The Figma Management top row: title + subtitle on the left; a search field,
 * notification bell, and primary action on the right. Matches the 28px Bricolage
 * heading and the 40px bordered controls.
 * @param props - Title, subtitle, optional search, bell, and action slots.
 * @returns The page header row.
 */
export function ManagementPageHeader(props: ManagementPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-[28px] leading-[34px] font-bold tracking-[-0.14px] text-foreground">
            {props.title}
          </h1>
          {props.count ? (
            <span className="text-sm font-medium text-muted-foreground">· {props.count}</span>
          ) : null}
        </div>
        {props.subtitle ? (
          <p className="text-sm leading-5 text-muted-foreground">{props.subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2.5">
        {props.search ? (
          <label
            className={cn(
              'flex h-10 items-center gap-2 rounded-[10px] border border-border bg-card px-3.5',
              'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
              'w-full sm:w-60',
            )}
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={props.search.value}
              onChange={(event) => props.search?.onChange(event.target.value)}
              placeholder={props.search.placeholder}
              aria-label={props.search.ariaLabel}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        ) : null}
        {props.showBell === false ? null : <NotificationBell appearance="bordered" />}
        {props.actions}
      </div>
    </div>
  );
}

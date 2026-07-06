'use client';

import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/libs/utils';

export type ActionMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  variant?: 'default' | 'destructive';
  /** Renders a separator above this item. */
  separatorBefore?: boolean;
  disabled?: boolean;
};

/**
 * A kebab (⋯) overflow menu built on the shared dropdown. Generic across every
 * workbench row and header; stops click propagation so it never triggers a row
 * open.
 * @param props - The menu items, an accessible label, alignment, and class.
 * @returns The overflow menu element.
 */
export function ActionMenu(props: {
  items: ActionMenuItem[];
  label: string;
  align?: 'start' | 'end';
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={props.label}
          onClick={(event) => event.stopPropagation()}
          className={cn('text-muted-foreground hover:text-foreground', props.className)}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={props.align ?? 'end'}
        className="w-52"
        onClick={(event) => event.stopPropagation()}
      >
        {props.items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id}>
              {item.separatorBefore ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                variant={item.variant}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {Icon ? <Icon className="size-4" /> : null}
                {item.label}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

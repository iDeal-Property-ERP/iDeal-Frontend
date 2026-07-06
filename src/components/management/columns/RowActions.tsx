'use client';

import { PanelRightOpen, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/libs/utils';
import { ActionMenu } from './ActionMenu';
import type { ActionMenuItem } from './ActionMenu';

/**
 * The trailing quick-actions cluster for a workbench row: an Open (record panel)
 * and Edit icon button revealed on row hover/focus, plus an always-present kebab
 * overflow menu. All clicks stop propagation so they never open the record panel
 * by bubbling to the row.
 * @param props - Handlers, overflow items, labels, and visibility class.
 * @returns The row actions element.
 */
export function RowActions(props: {
  onOpen: () => void;
  onEdit?: () => void;
  menuItems: ActionMenuItem[];
  labels: { open: string; edit: string; more: string };
  /** Extra classes controlling hover-reveal (e.g. opacity transitions). */
  quickClassName?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <div className={cn('flex items-center gap-0.5', props.quickClassName)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={props.labels.open}
              onClick={(event) => {
                event.stopPropagation();
                props.onOpen();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <PanelRightOpen className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{props.labels.open}</TooltipContent>
        </Tooltip>
        {props.onEdit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={props.labels.edit}
                onClick={(event) => {
                  event.stopPropagation();
                  props.onEdit?.();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{props.labels.edit}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <ActionMenu items={props.menuItems} label={props.labels.more} align="end" />
    </div>
  );
}

'use client';

import { Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusPill, priorityTone } from '@/components/management/columns/StatusPill';
import { SwipeActionRow } from '@/components/management/mobile/SwipeActionRow';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { relativeTime } from '@/libs/management/format';
import type { ManagementServiceRequestOutput } from '@/types/management';

/**
 * The mobile Maintenance experience — tab pills over a swipeable card list.
 * Swipe reveals Resolve / Assign; tapping a card opens the (auto full-screen)
 * record panel owned by the page. The parent owns data, selection, and actions.
 * @param props - Requests, tabs, and the tap/swipe action handlers.
 * @returns The mobile maintenance view.
 */
export function MaintenanceMobileView(props: {
  requests: ManagementServiceRequestOutput[];
  views: SavedView[];
  activeView: string;
  onViewChange: (id: string) => void;
  onOpen: (request: ManagementServiceRequestOutput) => void;
  onAssign: (request: ManagementServiceRequestOutput) => void;
  onResolve: (request: ManagementServiceRequestOutput) => void;
}) {
  const t = useTranslations('Management');

  return (
    <div className="flex flex-col gap-4">
      <SavedViewTabs views={props.views} active={props.activeView} onChange={props.onViewChange} />
      <div className="flex flex-col gap-2">
        {props.requests.map((request) => (
          <SwipeActionRow
            key={request.id}
            onPaid={() => props.onResolve(request)}
            onRemind={() => props.onAssign(request)}
            paidLabel={t('mnt_resolve')}
            remindLabel={t('mnt_assign')}
          >
            <button
              type="button"
              onClick={() => props.onOpen(request)}
              className="flex w-full items-start gap-3 rounded-[12px] border border-border bg-card px-3.5 py-3 text-left"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-muted text-muted-foreground">
                <Wrench className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {request.title}
                  </span>
                  <StatusPill
                    tone={priorityTone(request.priority)}
                    label={t(`priority_${request.priority}` as never)}
                  />
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {request.property_name} · {request.assigned_to_name ?? t('mnt_unassigned')} ·{' '}
                  {relativeTime(request.created_at)}
                </span>
              </div>
            </button>
          </SwipeActionRow>
        ))}
      </div>
    </div>
  );
}

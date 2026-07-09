'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import {
  StatusPill,
  priorityTone,
  serviceRequestStatusTone,
} from '@/components/management/columns/StatusPill';
import { ActivityTimeline } from '@/components/management/record-panel/ActivityTimeline';
import type { ActivityEvent } from '@/components/management/record-panel/ActivityTimeline';
import { CommentThread } from '@/components/management/record-panel/CommentThread';
import { PhotoStrip } from '@/components/management/record-panel/PhotoStrip';
import { PricingTrio } from '@/components/management/record-panel/PricingTrio';
import { RecordPanel } from '@/components/management/record-panel/RecordPanel';
import { RecordPanelTabs } from '@/components/management/record-panel/RecordPanelTabs';
import { Button } from '@/components/ui/button';
import { relativeTime, titleCase } from '@/libs/management/format';
import {
  addServiceRequestComment,
  listServiceRequestComments,
} from '@/libs/management/maintenanceAdapter';
import type { ManagementServiceRequestOutput, ServiceRequestComment } from '@/types/management';

/**
 * The maintenance record panel — the workbench side sheet for a service request.
 * Header (title + SRQ number + status pill), the Priority/SLA/Cost trio, reporter
 * and assignee cards, a photo strip, and Details/Activity tabs where Activity is
 * a derived timeline plus a comment thread. Footer: Assign · Resolve · Cancel.
 * Comments load lazily when the panel opens.
 * @param props - The request, open state, close handler, and action callbacks.
 * @returns The maintenance record panel element (null when closed).
 */
export function MaintenanceRecordPanel(props: {
  request: ManagementServiceRequestOutput | null;
  open: boolean;
  onClose: () => void;
  onAssign: () => void;
  onResolve: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Management');
  const [tab, setTab] = useState('details');
  const [comments, setComments] = useState<ServiceRequestComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const { request } = props;
  const requestId = request?.id ?? null;

  useEffect(() => {
    setTab('details');
  }, [requestId]);

  useEffect(() => {
    if (!props.open || requestId === null) {
      return () => {
        // Panel closed — nothing to tear down.
      };
    }
    let active = true;
    setCommentsLoading(true);
    listServiceRequestComments(requestId)
      .then((c) => {
        if (active) {
          setComments(c);
        }
      })
      .catch(() => {
        if (active) {
          setComments([]);
        }
      })
      .finally(() => {
        if (active) {
          setCommentsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [props.open, requestId]);

  if (!request) {
    return null;
  }

  const number = `SRQ-${request.id}`;
  const resolved = request.status === 'resolved' || request.status === 'cancelled';

  const trio = [
    {
      label: t('mnt_trio_priority'),
      value: t(`priority_${request.priority}` as never),
      caption: request.status === 'open' ? t('mnt_unassigned') : titleCase(request.status),
    },
    {
      label: t('mnt_trio_sla'),
      value: titleCase(request.status),
      caption: relativeTime(request.created_at),
    },
    {
      label: t('mnt_trio_cost'),
      value: request.cost ? `$${request.cost}` : '—',
      caption: request.cost_bearer ? titleCase(request.cost_bearer) : t('mnt_cost_none'),
    },
  ];

  const activity: ActivityEvent[] = [
    {
      id: 'created',
      title: t('mnt_activity_created', { name: request.tenant_name }),
      time: new Date(request.created_at).toLocaleString(),
      tone: 'accent',
    },
    ...(request.assigned_to_name
      ? [
          {
            id: 'assigned',
            title: t('mnt_activity_assigned', { name: request.assigned_to_name }),
            time: new Date(request.updated_at).toLocaleString(),
            tone: 'muted' as const,
          },
        ]
      : []),
    ...(request.resolved_at
      ? [
          {
            id: 'resolved',
            title: t('mnt_activity_resolved'),
            time: new Date(request.resolved_at).toLocaleString(),
            tone: 'success' as const,
          },
        ]
      : []),
  ];

  const submitComment = async (body: string) => {
    const created = await addServiceRequestComment(request.id, body);
    setComments((prev) => [...prev, created]);
  };

  const header = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-[22px] leading-7 font-bold text-foreground">
            {request.title}
          </span>
          <StatusPill
            tone={serviceRequestStatusTone(request.status)}
            label={titleCase(request.status)}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {number} · {request.property_name}
        </span>
      </div>
      <StatusPill
        tone={priorityTone(request.priority)}
        label={t(`priority_${request.priority}` as never)}
      />
    </div>
  );

  return (
    <RecordPanel
      open={props.open}
      onClose={props.onClose}
      header={header}
      footer={
        <div className="flex items-center gap-3">
          <Button onClick={props.onAssign} disabled={resolved}>
            {request.assigned_to_id ? t('mnt_reassign') : t('mnt_assign')}
          </Button>
          <Button variant="outline" onClick={props.onResolve} disabled={resolved}>
            {t('mnt_resolve')}
          </Button>
          <button
            type="button"
            onClick={props.onCancel}
            disabled={resolved}
            className="ml-auto text-sm font-medium text-danger disabled:text-muted-foreground"
          >
            {t('mnt_cancel')}
          </button>
        </div>
      }
    >
      <PricingTrio items={trio} />

      <PhotoStrip
        urls={request.photo_urls}
        altPrefix={request.title}
        emptyLabel={t('mnt_cost_none')}
      />

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t('mnt_reporter')}
        </span>
        <div className="flex items-center gap-3 rounded-[12px] border border-border bg-background px-3.5 py-3">
          <AvatarInitials name={request.tenant_name} size={36} />
          <span className="text-sm font-medium text-foreground">{request.tenant_name}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t('mnt_assignee')}
        </span>
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-background px-3.5 py-3">
          <div className="flex items-center gap-3">
            {request.assigned_to_name ? (
              <AvatarInitials name={request.assigned_to_name} size={36} />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                —
              </span>
            )}
            <span
              className={
                request.assigned_to_name
                  ? 'text-sm font-medium text-foreground'
                  : 'text-sm font-medium text-warning'
              }
            >
              {request.assigned_to_name ?? t('mnt_unassigned')}
            </span>
          </div>
          <button
            type="button"
            onClick={props.onAssign}
            disabled={resolved}
            className="text-sm font-medium text-accent-brand disabled:text-muted-foreground"
          >
            {request.assigned_to_id ? t('mnt_reassign') : t('mnt_assign')}
          </button>
        </div>
      </div>

      <RecordPanelTabs
        tabs={[
          { id: 'details', label: t('mnt_tab_details') },
          { id: 'comments', label: t('mnt_tab_comments') },
          { id: 'activity', label: t('mnt_tab_activity') },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'details' ? (
        <p className="text-sm leading-5 text-foreground">{request.description}</p>
      ) : null}
      {tab === 'comments' ? (
        <CommentThread
          comments={comments}
          onSubmit={submitComment}
          isLoading={commentsLoading}
          labels={{
            placeholder: t('mnt_comment_placeholder'),
            post: t('mnt_comment_post'),
            empty: t('mnt_comment_empty'),
            relativeTime,
          }}
        />
      ) : null}
      {tab === 'activity' ? (
        <ActivityTimeline heading={t('mnt_tab_activity')} events={activity} />
      ) : null}
    </RecordPanel>
  );
}

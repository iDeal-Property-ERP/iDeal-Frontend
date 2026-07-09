'use client';

import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { StatusPill, onboardingStatusTone } from '@/components/management/columns/StatusPill';
import { QueueCard } from '@/components/management/triage/QueueCard';
import { relativeTime, titleCase } from '@/libs/management/format';
import type { ManagementOnboardingOutput } from '@/types/management';

/**
 * An onboarding row in the triage left rail — owner avatar + name, a status pill,
 * the submitted property with the owner's ask price, the ONB reference number,
 * and an age chip.
 * @param props - The onboarding, its selected state, and the select handler.
 * @returns The onboarding queue card element.
 */
export function OnboardingQueueCard(props: {
  onboarding: ManagementOnboardingOutput;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations('Management');
  const { onboarding } = props;

  return (
    <QueueCard selected={props.selected} onSelect={props.onSelect}>
      <div className="flex items-start gap-3">
        <AvatarInitials name={onboarding.owner_name} size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 pr-2">
            <span className="truncate text-sm font-medium text-foreground">
              {onboarding.owner_name}
            </span>
            <StatusPill
              tone={onboardingStatusTone(onboarding.status)}
              label={titleCase(onboarding.status)}
            />
          </div>
          <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" />
            {onboarding.property_name} · {t('onb_asks', { price: `$${onboarding.ask_price}` })}
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{onboarding.number}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {relativeTime(onboarding.created_at)}
            </span>
          </div>
        </div>
      </div>
    </QueueCard>
  );
}

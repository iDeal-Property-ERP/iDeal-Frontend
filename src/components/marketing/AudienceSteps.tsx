'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/libs/utils';

const OWNER_STEPS = ['step_1', 'step_2', 'step_3', 'step_4'] as const;
const RENTER_STEPS = ['search', 'book', 'movein'] as const;

const PILL =
  'flex-1 rounded-[8px] px-[18px] py-[9px] text-center text-sm font-medium transition sm:flex-none';
const PILL_ACTIVE = 'bg-card text-foreground shadow-sm';
const PILL_INACTIVE = 'text-muted-foreground hover:text-foreground';

/**
 * A single numbered step card shared by the owner and renter audiences. On phones it becomes
 * a compact badge-left row (Figma 88:241 density redesign); desktop keeps the badge-top card.
 * @param props - The 0-based card index, title, and description.
 * @returns The step card.
 */
function StepCard(props: { desc: string; index: number; title: string }) {
  const { desc, index, title } = props;
  return (
    <div className="flex items-start gap-3.5 rounded-[14px] border border-border bg-card px-4 py-3 sm:flex-col sm:gap-4 sm:rounded-2xl sm:px-6 sm:py-7">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-subtle font-display text-[17px] font-bold text-primary-subtle-foreground sm:size-11 sm:text-lg">
        {index + 1}
      </span>
      <div className="flex min-w-0 flex-col gap-1 sm:gap-4">
        <h3 className="font-sans text-base font-semibold text-foreground sm:text-lg">{title}</h3>
        <p className="text-[13px] text-muted-foreground sm:text-sm">{desc}</p>
      </div>
    </div>
  );
}

/**
 * Hero "For renters / For owners" segmented toggle (Figma 80:252) that swaps the
 * How It Works step cards in place — owners show 4 steps, renters show 3 — with no
 * navigation.
 * @returns The audience toggle and its step-card grid.
 */
export function AudienceSteps() {
  const t = useTranslations('HowItWorks');
  const tl = useTranslations('Landing');
  const [audience, setAudience] = useState<'owners' | 'renters'>('owners');
  const isOwners = audience === 'owners';

  return (
    <>
      <div className="flex w-full items-center gap-1 rounded-[10px] bg-muted p-1 sm:inline-flex sm:w-auto">
        <button
          aria-pressed={!isOwners}
          className={cn(PILL, isOwners ? PILL_INACTIVE : PILL_ACTIVE)}
          onClick={() => setAudience('renters')}
          type="button"
        >
          {t('audience_renters')}
        </button>
        <button
          aria-pressed={isOwners}
          className={cn(PILL, isOwners ? PILL_ACTIVE : PILL_INACTIVE)}
          onClick={() => setAudience('owners')}
          type="button"
        >
          {t('audience_owners')}
        </button>
      </div>

      <section
        className={cn(
          'mt-3 grid gap-2 pb-6 sm:mt-8 sm:grid-cols-2 sm:gap-5 sm:pb-10',
          isOwners ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        )}
      >
        {isOwners
          ? OWNER_STEPS.map((step, i) => (
              <StepCard desc={t(`${step}_desc`)} index={i} key={step} title={t(`${step}_title`)} />
            ))
          : RENTER_STEPS.map((step, i) => (
              <StepCard
                desc={tl(`hiw_${step}_desc`)}
                index={i}
                key={step}
                title={tl(`hiw_${step}_title`)}
              />
            ))}
      </section>
    </>
  );
}

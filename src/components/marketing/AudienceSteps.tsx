'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/libs/utils';

const OWNER_STEPS = ['step_1', 'step_2', 'step_3', 'step_4'] as const;
const RENTER_STEPS = ['search', 'book', 'movein'] as const;

const PILL = 'rounded-[9px] px-[18px] py-[9px] text-sm font-medium transition';
const PILL_ACTIVE = 'bg-card text-foreground shadow-sm';
const PILL_INACTIVE = 'text-muted-foreground hover:text-foreground';

/**
 * A single numbered step card shared by the owner and renter audiences.
 * @param props - The 0-based card index, title, and description.
 * @returns The step card.
 */
function StepCard(props: { desc: string; index: number; title: string }) {
  const { desc, index, title } = props;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-6 py-7">
      <span className="grid size-11 place-items-center rounded-full bg-primary-subtle font-display text-lg font-bold text-primary-subtle-foreground">
        {index + 1}
      </span>
      <h3 className="font-sans text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
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
      <div className="inline-flex items-center gap-1 rounded-xl bg-muted p-1">
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
          'mt-8 grid gap-5 pb-10 sm:grid-cols-2',
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

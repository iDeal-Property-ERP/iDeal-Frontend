import { CalendarCheck, KeyRound, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

const STEPS = [
  { icon: Search, key: 'search' },
  { icon: CalendarCheck, key: 'book' },
  { icon: KeyRound, key: 'movein' },
] as const;

/**
 * Renter-facing "How iDeal works" 3-step section on a muted band (Figma 209:2).
 * @returns The how-it-works section.
 */
export function RenterSteps() {
  const t = useTranslations('Landing');
  return (
    <section className="bg-muted py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-[32px] leading-[38px] font-bold tracking-[-0.02em] text-foreground">
            {t('hiw_title')}
          </h2>
          <p className="text-muted-foreground">{t('hiw_subtitle')}</p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {STEPS.map(({ icon: Icon, key }, i) => (
            <div
              key={key}
              className="flex flex-col gap-3.5 rounded-[20px] border border-border bg-card px-[26px] py-7 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[18px] bg-primary text-base font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="grid size-10 place-items-center rounded-xl bg-accent-brand-subtle text-accent-brand-subtle-foreground">
                  <Icon className="size-5" />
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t(`hiw_${key}_title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`hiw_${key}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

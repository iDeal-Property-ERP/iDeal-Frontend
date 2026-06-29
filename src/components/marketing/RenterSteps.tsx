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
    <section className="bg-muted pt-10 pb-11 sm:py-14">
      <div className="container-page">
        <div className="flex flex-col items-start gap-1.5 sm:items-center sm:gap-2 sm:text-center">
          <h2 className="text-[26px] leading-[32px] font-bold tracking-[-0.02em] text-foreground sm:text-[32px] sm:leading-[38px]">
            {t('hiw_title')}
          </h2>
          <p className="text-[15px] leading-[22px] text-muted-foreground sm:text-base">
            {t('hiw_subtitle')}
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-5 sm:mt-8 sm:grid sm:grid-cols-3 sm:gap-6">
          {STEPS.map(({ icon: Icon, key }, i) => (
            <div
              key={key}
              className="flex items-start gap-3.5 rounded-[16px] border border-border bg-card p-[18px] shadow-sm sm:flex-col sm:items-stretch sm:rounded-[20px] sm:px-[26px] sm:py-7"
            >
              <div className="flex shrink-0 items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[18px] bg-primary text-base font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="hidden size-10 place-items-center rounded-xl bg-accent-brand-subtle text-accent-brand-subtle-foreground sm:grid">
                  <Icon className="size-5" />
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-[3px] sm:gap-3.5">
                <h3 className="text-base font-semibold text-foreground sm:text-lg">
                  {t(`hiw_${key}_title`)}
                </h3>
                <p className="text-sm text-muted-foreground">{t(`hiw_${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

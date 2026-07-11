import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

const PERKS = ['payouts', 'tenants', 'maintenance', 'novoid'] as const;

/**
 * Owners income CTA band — navy card + checklist (Figma 209:31).
 * @returns The owners CTA section.
 */
export function OwnersCta() {
  const t = useTranslations('Landing');
  return (
    <section className="py-10 lg:py-14">
      <div className="flex flex-col items-start gap-3 rounded-[22px] bg-primary p-5 text-primary-foreground md:gap-[18px] md:p-12 lg:flex-row lg:items-center lg:gap-14">
        <div className="flex w-full flex-1 flex-col items-start gap-3 md:gap-5">
          <p className="text-xs font-semibold tracking-[0.6px] text-[#c4f0ff] uppercase">
            {t('owners_eyebrow')}
          </p>
          <h2 className="text-[26px] leading-[32px] font-bold tracking-[-0.02em] text-primary-foreground md:text-[34px] md:leading-[40px]">
            {t('owners_title')}
          </h2>
          <p className="max-w-2xl text-[15px] leading-[22px] text-primary-foreground/85">
            {t('owners_subtitle')}
          </p>
          <div className="flex w-full gap-2.5 sm:w-auto sm:flex-wrap sm:gap-3">
            <Link
              href="/list-your-property"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-[12px] bg-card px-[22px] text-[15px] font-semibold text-primary transition hover:bg-card/90 sm:h-[52px] sm:w-auto sm:min-w-[176px] sm:flex-none sm:rounded-xl"
            >
              {t('owners_cta_primary')}
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-[12px] border border-primary-foreground px-[22px] text-[15px] font-semibold transition hover:bg-primary-foreground/10 sm:h-[52px] sm:w-auto sm:min-w-[166px] sm:flex-none sm:rounded-xl"
            >
              {t('owners_cta_secondary')}
            </Link>
          </div>
        </div>

        <div className="w-full shrink-0 rounded-[16px] border border-border bg-card p-3 md:p-[18px] lg:w-80 lg:rounded-[18px] lg:p-6">
          <ul className="flex flex-col gap-2.5 md:gap-3 lg:gap-3.5">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-2.5 text-[14px] font-medium text-foreground lg:text-[15px]"
              >
                <Check className="size-[18px] shrink-0 text-success" />
                {t(`owners_perk_${perk}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

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
    <section className="py-14">
      <div className="flex flex-col items-center gap-10 rounded-3xl bg-primary p-8 text-primary-foreground md:p-12 lg:flex-row lg:gap-14">
        <div className="flex flex-1 flex-col items-start gap-5">
          <p className="text-xs font-semibold tracking-[0.6px] text-[#c4f0ff] uppercase">
            {t('owners_eyebrow')}
          </p>
          <h2 className="text-[28px] leading-[34px] font-bold tracking-[-0.02em] text-primary-foreground md:text-[34px] md:leading-[40px]">
            {t('owners_title')}
          </h2>
          <p className="max-w-2xl text-primary-foreground/85">{t('owners_subtitle')}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/list-your-property"
              className="inline-flex h-[52px] min-w-[176px] items-center justify-center rounded-xl bg-card px-[22px] text-[15px] font-semibold text-primary transition hover:bg-card/90"
            >
              {t('owners_cta_primary')}
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex h-[52px] min-w-[166px] items-center justify-center rounded-xl border border-primary-foreground px-[22px] text-[15px] font-semibold transition hover:bg-primary-foreground/10"
            >
              {t('owners_cta_secondary')}
            </Link>
          </div>
        </div>

        <div className="w-full shrink-0 rounded-[18px] border border-border bg-card p-6 lg:w-80">
          <ul className="flex flex-col gap-3.5">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-2.5 text-[15px] font-medium text-foreground"
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

import { CircleCheck, FileText, Lock, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

const ITEMS = [
  { icon: ShieldCheck, key: 'verified' },
  { icon: FileText, key: 'contracts' },
  { icon: Lock, key: 'deposit' },
  { icon: CircleCheck, key: 'managed' },
] as const;

/**
 * Four-up trust band under the hero (Figma 208:2). On phones it collapses into a single
 * card of hairline-divided rows to conserve vertical space (Figma 214:2 density redesign).
 * @returns The trust band.
 */
export function TrustBand() {
  const t = useTranslations('Landing');
  return (
    <section className="pb-10 lg:pb-12">
      {/* Mobile: one merged card with divided rows */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:hidden">
        {ITEMS.map(({ icon: Icon, key }) => (
          <div
            className="flex min-h-11 items-center gap-2.5 px-3 py-2 not-first:border-t not-first:border-border"
            key={key}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
              <Icon className="size-[15px]" />
            </span>
            <p className="shrink-0 text-[14px] font-semibold text-foreground">
              {t(`trust_${key}_title`)}
            </p>
            <p className="text-[12px] leading-[15px] text-muted-foreground">
              {t(`trust_${key}_desc`)}
            </p>
          </div>
        ))}
      </div>

      {/* Tablet + desktop: card grid */}
      <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4 lg:gap-5">
        {ITEMS.map(({ icon: Icon, key }) => (
          <div
            className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-card p-4 shadow-sm lg:gap-3 lg:rounded-2xl lg:p-5"
            key={key}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary-subtle text-primary-subtle-foreground lg:size-11">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-foreground lg:text-base">
                {t(`trust_${key}_title`)}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground lg:text-[13px]">
                {t(`trust_${key}_desc`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

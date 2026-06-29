import { CircleCheck, FileText, Lock, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

const ITEMS = [
  { icon: ShieldCheck, key: 'verified' },
  { icon: FileText, key: 'contracts' },
  { icon: Lock, key: 'deposit' },
  { icon: CircleCheck, key: 'managed' },
] as const;

/**
 * Four-up trust band under the hero (Figma 208:2).
 * @returns The trust band.
 */
export function TrustBand() {
  const t = useTranslations('Landing');
  return (
    <section className="grid grid-cols-2 gap-3 pb-10 lg:grid-cols-4 lg:gap-5 lg:pb-12">
      {ITEMS.map(({ icon: Icon, key }) => (
        <div
          key={key}
          className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-card p-4 shadow-sm lg:gap-3 lg:rounded-2xl lg:p-5"
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
    </section>
  );
}

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
    <section className="grid gap-5 pb-12 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map(({ icon: Icon, key }) => (
        <div
          key={key}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-primary-subtle text-primary-subtle-foreground">
            <Icon className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{t(`trust_${key}_title`)}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{t(`trust_${key}_desc`)}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

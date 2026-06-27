'use client';

import { ArrowRight, BadgeCheck, Check, Search, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { Link, useRouter } from '@/libs/I18nNavigation';

const CHIPS = ['chip_verified', 'chip_contracts', 'chip_deposit'] as const;

/**
 * Landing hero (Figma 204:26): headline + search + trust chips on the left, a verified
 * property photo with an overlay badge on the right.
 * @returns The hero section.
 */
export function LandingHero() {
  const t = useTranslations('Landing');
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <section className="grid items-center gap-12 py-12 md:py-16 lg:grid-cols-[600fr_712fr]">
      <div className="flex flex-col gap-6">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-brand-subtle px-3 py-1.5 text-xs font-semibold tracking-[0.6px] text-accent-brand-subtle-foreground uppercase">
          <ShieldCheck className="size-3.5" />
          {t('hero_badge')}
        </span>

        <h1 className="text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-[52px] sm:leading-[56px] sm:tracking-[-0.027em]">
          {t('hero_title')}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">{t('hero_subtitle')}</p>

        <form
          className="flex h-16 w-full items-center gap-2.5 rounded-[14px] border border-border bg-card pr-2 pl-4 shadow-[0_6px_16px_0_rgba(10,13,31,0.1)]"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q.trim() ? `/listings?q=${encodeURIComponent(q.trim())}` : '/listings');
          }}
        >
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('hero_search_placeholder')}
            value={q}
          />
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition hover:bg-primary/90"
            type="submit"
          >
            <Search className="size-4" />
            {t('hero_search_button')}
          </button>
        </form>

        <div className="flex flex-wrap gap-2.5">
          {CHIPS.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground"
            >
              <Check className="size-3.5 text-success" />
              {t(chip)}
            </span>
          ))}
        </div>

        <Link
          href="/list-your-property"
          className="inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold text-accent-brand hover:underline"
        >
          {t('hero_owner_link')}
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="relative h-[360px] overflow-hidden rounded-3xl md:h-[496px]">
        <Image
          alt={t('hero_image_alt')}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 54vw"
          src="/marketing/landing-hero.jpg"
        />
        <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-border bg-card py-3.5 pr-4 pl-3.5 shadow-[0_10px_24px_0_rgba(10,13,31,0.22)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('hero_overlay_title')}</p>
            <p className="text-xs text-muted-foreground">{t('hero_overlay_subtitle')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

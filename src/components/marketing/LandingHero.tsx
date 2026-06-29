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
    <section className="grid items-center gap-[18px] py-12 md:py-16 lg:grid-cols-[600fr_712fr] lg:gap-12">
      <div className="flex flex-col gap-[18px] lg:gap-6">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-brand-subtle px-3 py-1.5 text-xs font-semibold tracking-[0.6px] text-accent-brand-subtle-foreground uppercase">
          <ShieldCheck className="size-3.5" />
          {t('hero_badge')}
        </span>

        <h1 className="text-[34px] leading-[40px] font-bold tracking-[-1px] text-foreground sm:text-[52px] sm:leading-[56px] sm:tracking-[-0.027em]">
          {t('hero_title')}
        </h1>
        <p className="max-w-xl text-base leading-6 text-muted-foreground sm:text-lg">
          {t('hero_subtitle')}
        </p>

        <form
          className="flex flex-col gap-2.5 sm:h-16 sm:flex-row sm:items-center sm:rounded-[14px] sm:border sm:border-border sm:bg-card sm:pr-2 sm:pl-4 sm:shadow-[0_6px_16px_0_rgba(10,13,31,0.1)]"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q.trim() ? `/listings?q=${encodeURIComponent(q.trim())}` : '/listings');
          }}
        >
          <div className="flex h-[54px] items-center gap-2.5 rounded-[12px] border border-border bg-card px-4 shadow-[0_6px_16px_0_rgba(10,13,31,0.1)] sm:h-auto sm:flex-1 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:shadow-none">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('hero_search_placeholder')}
              value={q}
            />
          </div>
          <button
            className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition hover:bg-primary/90 sm:h-12 sm:w-auto sm:shrink-0 sm:rounded-[10px]"
            type="submit"
          >
            <Search className="size-4" />
            {t('hero_search_button')}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {CHIPS.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground sm:px-3 sm:text-[13px]"
            >
              <Check className="size-3.5 text-success" />
              {t(chip)}
            </span>
          ))}
        </div>

        {/* Desktop: owner link sits inside the text column */}
        <Link
          href="/list-your-property"
          className="hidden w-fit items-center gap-1.5 text-[15px] font-semibold text-accent-brand hover:underline lg:inline-flex"
        >
          {t('hero_owner_link')}
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="relative h-[220px] overflow-hidden rounded-[18px] sm:h-[360px] sm:rounded-3xl md:h-[496px]">
        <Image
          alt={t('hero_image_alt')}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 54vw"
          src="/marketing/landing-hero.jpg"
        />
        {/* Mobile: compact verified pill (Figma 214:40) */}
        <div className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-2 rounded-full bg-card py-2 pr-3 pl-2.5 shadow-sm sm:hidden">
          <Check className="size-[15px] shrink-0 text-success" />
          <span className="text-[12px] font-semibold text-foreground">
            {t('hero_overlay_pill')}
          </span>
        </div>
        {/* Desktop: two-line overlay card */}
        <div className="absolute bottom-5 left-5 hidden items-center gap-3 rounded-2xl border border-border bg-card py-3.5 pr-4 pl-3.5 shadow-[0_10px_24px_0_rgba(10,13,31,0.22)] sm:flex">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('hero_overlay_title')}</p>
            <p className="text-xs text-muted-foreground">{t('hero_overlay_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Mobile: owner link sits after the image (Figma 214:43 order) */}
      <Link
        href="/list-your-property"
        className="inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold text-accent-brand hover:underline lg:hidden"
      >
        {t('hero_owner_link')}
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}

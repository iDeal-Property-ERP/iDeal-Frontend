'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { buttonVariants } from '@/components/ui/button';
import { Link, usePathname } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';

const NAV = [
  { href: '/listings', key: 'nav_listings' },
  { href: '/how-it-works', key: 'nav_how' },
  { href: '/list-your-property', key: 'nav_list_property' },
] as const;

/**
 * Public marketing top bar — nav, language, theme toggle and sign-in (matches Figma).
 * @returns The marketing header.
 */
export function MarketingHeader() {
  const t = useTranslations('Marketing');
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            i
          </span>
          iDeal
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-foreground',
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <button
            aria-label={t('theme_toggle')}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            type="button"
          >
            {mounted && theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link href="/login" className={cn(buttonVariants({ size: 'sm' }))}>
            {t('sign_in')}
          </Link>
        </div>
      </div>
    </header>
  );
}

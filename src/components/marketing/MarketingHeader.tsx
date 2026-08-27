'use client';

import { Menu, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  const mounted = useSyncExternalStore(
    () => () => void 0,
    () => true,
    () => false,
  );

  return (
    <header className="hide-on-embed sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
      <div className="container-page flex items-center justify-between gap-4 py-3">
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

        <div className="hidden items-center gap-2 md:flex">
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

        <Sheet>
          <SheetTrigger asChild>
            <button
              aria-label={t('open_menu')}
              className="-mr-1 inline-flex size-10 items-center justify-center rounded-lg text-foreground transition hover:bg-muted md:hidden"
              type="button"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className={cn('w-[84%] gap-0 sm:max-w-sm', pathname === '/' && 'theme-landing')}
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  i
                </span>
                iDeal
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col px-4">
              {NAV.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'py-3 text-base font-medium transition-colors',
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mx-4 mt-2 mb-4 h-px bg-border" />
            <div className="px-4">
              <SheetClose asChild>
                <Link href="/login" className={cn(buttonVariants({ size: 'sm' }), 'h-11 w-full')}>
                  {t('sign_in')}
                </Link>
              </SheetClose>
            </div>
            <div className="mt-4 flex items-center gap-2 px-4">
              <button
                aria-label={t('theme_toggle')}
                className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                type="button"
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
              <LocaleSwitcher />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/libs/auth';
import type { Role } from '@/types/enums';

type HeaderProps = {
  pageTitle: string;
  onMenuToggle: () => void;
};

const roleVariant: Record<Role, 'info' | 'success' | 'warning' | 'default'> = {
  mgmt: 'info',
  owner: 'success',
  tenant: 'warning',
  agent: 'default',
  listings: 'default',
};

export function Header(props: HeaderProps) {
  const { user } = useAuth();
  const t = useTranslations('Dashboard');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={props.onMenuToggle}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label={t('menu_toggle')}
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {props.pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <button
            type="button"
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label={t('theme_toggle')}
          >
            {theme === 'dark' ? (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        )}
        {user !== null && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {user.first_name} {user.last_name}
            </span>
            <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
          </div>
        )}
      </div>
    </header>
  );
}

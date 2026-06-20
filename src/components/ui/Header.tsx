'use client';

import { Menu, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useAuth } from '@/libs/auth';
import { roleVariant } from '@/libs/badges';

type HeaderProps = {
  pageTitle: string;
  onMenuToggle: () => void;
};

/**
 * Dashboard top bar with mobile menu toggle, theme switcher, and user info.
 * @param props - Page title and mobile menu toggle handler.
 * @returns Sticky header element.
 */
export function Header(props: HeaderProps) {
  const { user } = useAuth();
  const t = useTranslations('Dashboard');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={props.onMenuToggle}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label={t('menu_toggle')}
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{props.pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <button
            type="button"
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('theme_toggle')}
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        )}
        <NotificationBell />
        {user !== null && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {user.first_name} {user.last_name}
            </span>
            <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
          </div>
        )}
      </div>
    </header>
  );
}

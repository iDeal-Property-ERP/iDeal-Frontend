'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/libs/auth';
import { roleVariant } from '@/libs/badges';

/**
 * Dashboard top bar with sidebar trigger, theme switcher, and user info.
 * @returns Sticky header element.
 */
export function Header() {
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
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('theme_toggle')}
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
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

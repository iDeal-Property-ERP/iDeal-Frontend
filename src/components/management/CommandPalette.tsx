'use client';

import {
  Briefcase,
  Building2,
  ClipboardCheck,
  ClipboardList,
  CornerDownLeft,
  DollarSign,
  FilePlus,
  FileText,
  HandCoins,
  Inbox,
  LayoutDashboard,
  Map as MapIcon,
  Plus,
  ScrollText,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useRouter } from '@/libs/I18nNavigation';

type PaletteItem = { key: string; label: string; href: string; icon: LucideIcon };

/**
 * The management ⌘K command palette — a keyboard-first, grouped launcher for
 * cross-section navigation and quick actions (Figma 361:2). Opens on ⌘K / Ctrl+K
 * anywhere in the management app, filters as you type via cmdk, and routes on
 * select. Mounted once by the dashboard shell for management users.
 * @returns The command palette dialog.
 */
export function CommandPalette() {
  const t = useTranslations('Management');
  const nav = useTranslations('Dashboard');
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const navigateItems: PaletteItem[] = [
    { key: 'dashboard', label: nav('nav_dashboard'), href: '/management', icon: LayoutDashboard },
    { key: 'pnl', label: nav('nav_pnl'), href: '/management/pnl', icon: TrendingUp },
    { key: 'map', label: nav('nav_portfolio_map'), href: '/management/map', icon: MapIcon },
    { key: 'leads', label: nav('nav_leads'), href: '/management/leads', icon: Inbox },
    {
      key: 'onboardings',
      label: nav('nav_onboardings'),
      href: '/management/onboardings',
      icon: ClipboardCheck,
    },
    {
      key: 'properties',
      label: nav('nav_properties'),
      href: '/management/properties',
      icon: Building2,
    },
    { key: 'leases', label: nav('nav_leases'), href: '/management/leases', icon: FileText },
    {
      key: 'agreements',
      label: nav('nav_agreements'),
      href: '/management/agreements',
      icon: ScrollText,
    },
    {
      key: 'inventory',
      label: nav('nav_inventory'),
      href: '/management/inventory',
      icon: ClipboardList,
    },
    { key: 'payments', label: nav('nav_payments'), href: '/management/payments', icon: DollarSign },
    { key: 'payouts', label: nav('nav_payouts'), href: '/management/payouts', icon: HandCoins },
    {
      key: 'maintenance',
      label: nav('nav_maintenance'),
      href: '/management/maintenance',
      icon: Wrench,
    },
    { key: 'services', label: nav('nav_services'), href: '/management/services', icon: Sparkles },
    { key: 'users', label: nav('nav_users'), href: '/management/users', icon: Users },
    { key: 'agents', label: nav('nav_agents'), href: '/management/agents', icon: Briefcase },
  ];

  const actionItems: PaletteItem[] = [
    {
      key: 'add-property',
      label: t('cmdk_action_add_property'),
      href: '/management/properties/new',
      icon: Plus,
    },
    {
      key: 'new-inventory',
      label: t('cmdk_action_new_inventory'),
      href: '/management/inventory/new',
      icon: FilePlus,
    },
  ];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title={t('cmdk_placeholder')}>
      <CommandInput placeholder={t('cmdk_placeholder')} />
      <CommandList>
        <CommandEmpty>{t('cmdk_empty')}</CommandEmpty>
        <CommandGroup heading={t('cmdk_group_navigate')}>
          {navigateItems.map((item) => (
            <CommandItem
              key={item.key}
              value={`${item.label} ${item.key}`}
              onSelect={() => go(item.href)}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t('cmdk_group_actions')}>
          {actionItems.map((item) => (
            <CommandItem
              key={item.key}
              value={`${item.label} ${item.key}`}
              onSelect={() => go(item.href)}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 font-sans">↑↓</kbd>
          {t('cmdk_hint_navigate')}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 font-sans">
            <CornerDownLeft className="size-3" />
          </kbd>
          {t('cmdk_hint_open')}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 font-sans">esc</kbd>
          {t('cmdk_hint_close')}
        </span>
      </div>
    </CommandDialog>
  );
}

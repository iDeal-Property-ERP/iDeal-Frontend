'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useListingParams } from '@/hooks/useListingParams';

const OPTIONS = ['newest', 'price_asc', 'price_desc'] as const;

/**
 * Sort dropdown (Figma 76:80) — writes `sort` to the URL.
 * @returns The sort dropdown.
 */
export function SortDropdown() {
  const t = useTranslations('Listings');
  const { get, set } = useListingParams();
  const current = (get('sort') || 'newest') as (typeof OPTIONS)[number];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          type="button"
        >
          {t('sort_label')} {t(`sort_${current}`)}
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onSelect={() => set({ sort: opt === 'newest' ? undefined : opt })}
          >
            {t(`sort_${opt}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

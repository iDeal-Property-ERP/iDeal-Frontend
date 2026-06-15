'use client';

import { ChevronLeft } from 'lucide-react';
import { Link } from '@/libs/I18nNavigation';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

/**
 * Page-level heading with optional back navigation and action slot.
 * @param props - Title, description, back link, and actions.
 * @returns Page header container.
 */
export function PageHeader(props: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {props.backHref && (
          <Link
            href={props.backHref}
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            {props.backLabel ?? 'Back'}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-foreground">{props.title}</h1>
        {props.description && (
          <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
        )}
      </div>
      {props.actions && <div className="flex items-center gap-2">{props.actions}</div>}
    </div>
  );
}

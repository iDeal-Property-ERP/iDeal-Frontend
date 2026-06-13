'use client';

import { Link } from '@/libs/I18nNavigation';

export function PageHeader(props: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {props.backHref && (
          <Link
            href={props.backHref}
            className="mb-1 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {props.backLabel ?? 'Back'}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{props.title}</h1>
        {props.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{props.description}</p>
        )}
      </div>
      {props.actions && <div className="flex items-center gap-2">{props.actions}</div>}
    </div>
  );
}

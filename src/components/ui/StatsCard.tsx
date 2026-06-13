'use client';

const VARIANT_CLASSES: Record<string, string> = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

export function StatsCard(props: {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <dt className="truncate text-sm font-medium text-gray-500 dark:text-zinc-400">
        {props.title}
      </dt>
      <dd
        className={`mt-1 text-2xl font-semibold tracking-tight ${props.variant ? (VARIANT_CLASSES[props.variant] ?? 'text-gray-900 dark:text-zinc-100') : 'text-gray-900 dark:text-zinc-100'}`}
      >
        {props.value}
      </dd>
      {props.subtitle && (
        <dd className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{props.subtitle}</dd>
      )}
    </div>
  );
}

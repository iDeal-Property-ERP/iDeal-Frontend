'use client';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

const variantClasses: Record<BadgeVariant, string> = {
  success:
    'bg-green-100 text-green-800 ring-1 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30',
  warning:
    'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/30',
  danger:
    'bg-red-100 text-red-800 ring-1 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30',
  info: 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-500/30',
  default:
    'bg-gray-100 text-gray-700 ring-1 ring-gray-500/20 dark:bg-zinc-700 dark:text-zinc-300 dark:ring-zinc-600/30',
};

export function Badge(props: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[props.variant ?? 'default']}`}
    >
      {props.children}
    </span>
  );
}

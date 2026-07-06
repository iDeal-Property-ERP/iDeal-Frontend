import { cn } from '@/libs/utils';

/**
 * Derives up to two uppercase initials from a full name.
 * @param name - The person's full name.
 * @returns Up to two initials (e.g. "Sardor Aliyev" → "SA").
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * A round initials avatar for people/party cells (tenants, owners, users,
 * agents) where a listing thumbnail would be meaningless. Token-bound to the
 * primary-subtle surface so it themes correctly.
 * @param props - The name (initials are derived) and optional size/className.
 * @returns The avatar element.
 */
export function AvatarInitials(props: { name: string; size?: number; className?: string }) {
  const size = props.size ?? 40;
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary-subtle font-medium text-primary-subtle-foreground',
        props.className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      aria-hidden="true"
    >
      {initialsOf(props.name)}
    </span>
  );
}

import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

/**
 * Maps a payment status string to the appropriate badge variant.
 * @param status - Payment status string.
 * @returns Badge variant for the given status.
 */
export function paymentStatusVariant(status: string): BadgeVariant {
  const map = {
    paid: 'success',
    completed: 'success',
    pending: 'warning',
    overdue: 'danger',
    failed: 'danger',
    cancelled: 'default',
    refunded: 'info',
  } satisfies Record<string, BadgeVariant>;
  // SAFETY: Fallback handles any unmapped status string
  return map[status.toLowerCase() as keyof typeof map] ?? 'default';
}

/**
 * Maps a maintenance/service-request priority to the appropriate badge variant.
 * @param priority - Priority string.
 * @returns Badge variant for the given priority.
 */
export function priorityVariant(priority: string): BadgeVariant {
  const map = {
    urgent: 'danger',
    high: 'danger',
    medium: 'warning',
    normal: 'warning',
    low: 'info',
  } satisfies Record<string, BadgeVariant>;
  // SAFETY: Fallback handles any unmapped priority string
  return map[priority.toLowerCase() as keyof typeof map] ?? 'default';
}

/**
 * Maps a maintenance status to the appropriate badge variant.
 * @param status - Maintenance status string.
 * @returns Badge variant for the given status.
 */
export function maintenanceStatusVariant(status: string): BadgeVariant {
  const map = {
    open: 'warning',
    in_progress: 'info',
    resolved: 'success',
    closed: 'default',
    cancelled: 'default',
  } satisfies Record<string, BadgeVariant>;
  // SAFETY: Fallback handles any unmapped maintenance status string
  return map[status.toLowerCase() as keyof typeof map] ?? 'default';
}

/**
 * Maps a user/entity role to the appropriate badge variant.
 * @param role - Role string.
 * @returns Badge variant for the given role.
 */
export function roleVariant(role: string): BadgeVariant {
  const map = {
    mgmt: 'info',
    owner: 'success',
    tenant: 'warning',
    agent: 'default',
    listings: 'default',
  } satisfies Record<string, BadgeVariant>;
  // SAFETY: Fallback handles any unmapped role string
  return map[role.toLowerCase() as keyof typeof map] ?? 'default';
}

/**
 * Maps a lease/agreement status to the appropriate badge variant.
 * @param status - Lease or agreement status string.
 * @returns Badge variant for the given status.
 */
export function leaseStatusVariant(status: string): BadgeVariant {
  const map = {
    active: 'success',
    expired: 'danger',
    pending: 'warning',
    terminated: 'default',
    draft: 'default',
  } satisfies Record<string, BadgeVariant>;
  // SAFETY: Fallback handles any unmapped lease status string
  return map[status.toLowerCase() as keyof typeof map] ?? 'default';
}

/**
 * Maps a property status to the appropriate badge variant.
 * @param status - Property status string.
 * @returns Badge variant for the given status.
 */
export function propertyStatusVariant(status: string): BadgeVariant {
  const map = {
    rented: 'success',
    occupied: 'success',
    vacant: 'warning',
    available: 'info',
    maintenance: 'danger',
    inactive: 'default',
  } satisfies Record<string, BadgeVariant>;
  // SAFETY: Fallback handles any unmapped property status string
  return map[status.toLowerCase() as keyof typeof map] ?? 'default';
}

import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/Badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

/**
 * Maps a payment status string to the appropriate badge variant.
 * @param status - Payment status string.
 * @returns Badge variant for the given status.
 */
export function paymentStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    paid: 'success',
    completed: 'success',
    pending: 'warning',
    overdue: 'danger',
    failed: 'danger',
    cancelled: 'default',
    refunded: 'info',
  };
  return map[status.toLowerCase()] ?? 'default';
}

/**
 * Maps a maintenance/service-request priority to the appropriate badge variant.
 * @param priority - Priority string.
 * @returns Badge variant for the given priority.
 */
export function priorityVariant(priority: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    urgent: 'danger',
    high: 'danger',
    medium: 'warning',
    normal: 'warning',
    low: 'info',
  };
  return map[priority.toLowerCase()] ?? 'default';
}

/**
 * Maps a maintenance status to the appropriate badge variant.
 * @param status - Maintenance status string.
 * @returns Badge variant for the given status.
 */
export function maintenanceStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    open: 'warning',
    in_progress: 'info',
    resolved: 'success',
    closed: 'default',
    cancelled: 'default',
  };
  return map[status.toLowerCase()] ?? 'default';
}

/**
 * Maps a user/entity role to the appropriate badge variant.
 * @param role - Role string.
 * @returns Badge variant for the given role.
 */
export function roleVariant(role: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    mgmt: 'info',
    owner: 'success',
    tenant: 'warning',
    agent: 'default',
    listings: 'default',
  };
  return map[role.toLowerCase()] ?? 'default';
}

/**
 * Maps a lease/agreement status to the appropriate badge variant.
 * @param status - Lease or agreement status string.
 * @returns Badge variant for the given status.
 */
export function leaseStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    expired: 'danger',
    pending: 'warning',
    terminated: 'default',
    draft: 'default',
  };
  return map[status.toLowerCase()] ?? 'default';
}

/**
 * Maps a property status to the appropriate badge variant.
 * @param status - Property status string.
 * @returns Badge variant for the given status.
 */
export function propertyStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    rented: 'success',
    occupied: 'success',
    vacant: 'warning',
    available: 'info',
    maintenance: 'danger',
    inactive: 'default',
  };
  return map[status.toLowerCase()] ?? 'default';
}

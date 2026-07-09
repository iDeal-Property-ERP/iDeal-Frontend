import { cn } from '@/libs/utils';

export type PillTone =
  | 'rented'
  | 'vacant'
  | 'maintenance'
  | 'pending'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'
  | 'neutral';

const toneClass: Record<PillTone, string> = {
  rented: 'bg-primary-subtle text-primary-subtle-foreground',
  vacant: 'bg-accent-brand-subtle text-accent-brand-subtle-foreground',
  maintenance: 'bg-danger-subtle text-danger-subtle-foreground',
  pending: 'bg-warning-subtle text-warning-subtle-foreground',
  success: 'bg-success-subtle text-success-subtle-foreground',
  warning: 'bg-warning-subtle text-warning-subtle-foreground',
  danger: 'bg-danger-subtle text-danger-subtle-foreground',
  info: 'bg-info-subtle text-info-subtle-foreground',
  accent: 'bg-accent-brand-subtle text-accent-brand-subtle-foreground',
  neutral: 'bg-muted text-muted-foreground',
};

/**
 * A status pill matching the Figma table/status treatment — a full-radius chip
 * with tone-mapped subtle background and foreground. Always pairs color with a
 * text label (never color alone).
 * @param props - The tone and label.
 * @returns The status pill element.
 */
export function StatusPill(props: { tone: PillTone; label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        toneClass[props.tone],
        props.className,
      )}
    >
      {props.label}
    </span>
  );
}

/**
 * Maps a raw property status string to a pill tone.
 * @param status - The backend property status (e.g. "rented", "vacant").
 * @returns The matching pill tone.
 */
export function propertyStatusTone(status: string): PillTone {
  const normalized = status.toLowerCase();
  if (normalized.includes('rent') || normalized === 'active' || normalized === 'occupied') {
    return 'rented';
  }
  if (normalized.includes('maintenance') || normalized.includes('repair')) {
    return 'maintenance';
  }
  if (normalized.includes('pending') || normalized.includes('review')) {
    return 'pending';
  }
  if (normalized.includes('vacant') || normalized.includes('available')) {
    return 'vacant';
  }
  return 'neutral';
}

/**
 * Maps a lease status to a pill tone (active→success, pending signature→info,
 * renewed→neutral, terminated/expired→danger).
 * @param status - The backend lease status.
 * @returns The matching pill tone.
 */
export function leaseStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'active') {
    return 'success';
  }
  if (s.includes('pending') || s.includes('signature')) {
    return 'info';
  }
  if (s === 'renewed') {
    return 'neutral';
  }
  if (s === 'terminated' || s === 'expired') {
    return 'danger';
  }
  return 'neutral';
}

/**
 * Maps an owner-agreement status to a pill tone (active→success,
 * pending→info, expired→danger, terminated→neutral).
 * @param status - The backend agreement status.
 * @returns The matching pill tone.
 */
export function agreementStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'active') {
    return 'success';
  }
  if (s.includes('pending') || s.includes('signature')) {
    return 'info';
  }
  if (s === 'expired') {
    return 'danger';
  }
  if (s === 'terminated') {
    return 'neutral';
  }
  return 'neutral';
}

/**
 * Maps an inventory-act status to a pill tone (draft→warning,
 * awaiting acknowledgment→info, finalized→success).
 * @param status - The backend inventory-act status.
 * @returns The matching pill tone.
 */
export function inventoryStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'draft') {
    return 'warning';
  }
  if (s.includes('await') || s.includes('acknowledg')) {
    return 'info';
  }
  if (s === 'finalized') {
    return 'success';
  }
  return 'neutral';
}

/**
 * Maps an inventory-act type (handover / return / general) to the accent tone.
 * @param _type - The backend act type (tone is uniform accent).
 * @returns The accent pill tone.
 */
export function inventoryTypeTone(_type: string): PillTone {
  return 'accent';
}

/**
 * Maps a user account status to a pill tone (active→success, else neutral).
 * @param isActive - Whether the account is active.
 * @returns The matching pill tone.
 */
export function userStatusTone(isActive: boolean): PillTone {
  return isActive ? 'success' : 'neutral';
}

/**
 * Maps a user role to the accent tone (role pills are uniformly accent-tinted).
 * @param _role - The backend role (tone is uniform accent).
 * @returns The accent pill tone.
 */
export function roleTone(_role: string): PillTone {
  return 'accent';
}

/**
 * Maps an agent status to a pill tone (active→success, dormant→neutral).
 * @param isActive - Whether the agent is active.
 * @returns The matching pill tone.
 */
export function agentStatusTone(isActive: boolean): PillTone {
  return isActive ? 'success' : 'neutral';
}

/**
 * Maps a payment status to a pill tone (paid→success, pending→info,
 * overdue→danger, cancelled→neutral).
 * @param status - The backend payment status.
 * @returns The matching pill tone.
 */
export function paymentStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'paid') {
    return 'success';
  }
  if (s === 'overdue') {
    return 'danger';
  }
  if (s === 'pending') {
    return 'info';
  }
  return 'neutral';
}

/**
 * Maps a payout status to a pill tone (scheduled→info, held→warning,
 * paid→success, cancelled→neutral).
 * @param status - The backend payout status.
 * @returns The matching pill tone.
 */
export function payoutStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'paid') {
    return 'success';
  }
  if (s === 'held') {
    return 'warning';
  }
  if (s === 'scheduled') {
    return 'info';
  }
  return 'neutral';
}

/**
 * Maps a maintenance priority to a pill tone (critical→danger, high→warning,
 * medium→info, low→neutral). Priority is color + label, never color alone.
 * @param priority - The backend priority (low/medium/high/critical).
 * @returns The matching pill tone.
 */
export function priorityTone(priority: string): PillTone {
  const p = priority.toLowerCase();
  if (p === 'critical') {
    return 'danger';
  }
  if (p === 'high') {
    return 'warning';
  }
  if (p === 'medium') {
    return 'info';
  }
  return 'neutral';
}

/**
 * Maps a maintenance service-request status to a pill tone (open→danger,
 * in_progress→info, resolved→success, cancelled→neutral).
 * @param status - The backend service-request status.
 * @returns The matching pill tone.
 */
export function serviceRequestStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'open') {
    return 'danger';
  }
  if (s === 'in_progress') {
    return 'info';
  }
  if (s === 'resolved') {
    return 'success';
  }
  return 'neutral';
}

/**
 * Maps a lead status to a pill tone. Viewing (pending→info, confirmed→success)
 * and booking (requested→info, approved→accent, converted→success,
 * rejected/cancelled→neutral) share one mapper.
 * @param status - The backend viewing/booking status.
 * @returns The matching pill tone.
 */
export function leadStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'converted') {
    return 'success';
  }
  if (s === 'approved') {
    return 'accent';
  }
  if (s === 'pending' || s === 'requested') {
    return 'info';
  }
  if (s === 'rejected') {
    return 'danger';
  }
  return 'neutral';
}

/**
 * Maps an onboarding status to a pill tone (submitted→info,
 * offer_accepted→accent, approved→success, rejected→danger).
 * @param status - The backend onboarding status.
 * @returns The matching pill tone.
 */
export function onboardingStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'approved') {
    return 'success';
  }
  if (s === 'offer_accepted') {
    return 'accent';
  }
  if (s === 'submitted') {
    return 'info';
  }
  if (s === 'rejected') {
    return 'danger';
  }
  return 'neutral';
}

/**
 * Maps a VAS order status to a pill tone (requested→info "New",
 * confirmed→accent, in_progress→warning, completed→success, cancelled→neutral).
 * @param status - The backend VAS order status.
 * @returns The matching pill tone.
 */
export function vasOrderStatusTone(status: string): PillTone {
  const s = status.toLowerCase();
  if (s === 'completed') {
    return 'success';
  }
  if (s === 'in_progress') {
    return 'warning';
  }
  if (s === 'confirmed') {
    return 'accent';
  }
  if (s === 'requested') {
    return 'info';
  }
  return 'neutral';
}

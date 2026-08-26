'use client';

import { EntityCombobox } from '@/components/ui/EntityCombobox';
import type {
  ManagementAgreementOutput,
  ManagementLeaseOutput,
  ManagementPropertyOutput,
  UserOutput,
} from '@/types/management';

type EntitySelectProps = {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  initialLabel?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  placeholder?: string;
  query?: Record<string, string | number | boolean | undefined>;
};

function userLabel(user: UserOutput): string {
  const name = `${user.first_name} ${user.last_name}`.trim();
  return name || user.username || user.email;
}

// Picks a user with role=tenant.
function TenantSelect(props: EntitySelectProps) {
  return (
    <EntityCombobox<UserOutput>
      endpoint="/management/users/"
      query={{ role: 'tenant' }}
      getValue={(u) => u.id}
      getLabel={userLabel}
      placeholder={props.placeholder ?? 'Select tenant…'}
      searchPlaceholder="Search tenants…"
      emptyText="No tenants found."
      {...props}
    />
  );
}

// Picks a user with role=owner.
function OwnerSelect(props: EntitySelectProps) {
  return (
    <EntityCombobox<UserOutput>
      endpoint="/management/users/"
      query={{ role: 'owner' }}
      getValue={(u) => u.id}
      getLabel={userLabel}
      placeholder={props.placeholder ?? 'Select owner…'}
      searchPlaceholder="Search owners…"
      emptyText="No owners found."
      {...props}
    />
  );
}

// Picks a staff user (role=mgmt) — e.g. maintenance assignee.
function StaffSelect(props: EntitySelectProps) {
  return (
    <EntityCombobox<UserOutput>
      endpoint="/management/users/"
      query={{ role: 'mgmt' }}
      getValue={(u) => u.id}
      getLabel={userLabel}
      placeholder={props.placeholder ?? 'Select staff…'}
      searchPlaceholder="Search staff…"
      emptyText="No staff found."
      {...props}
    />
  );
}

// Picks any user — e.g. the payer on a payment.
function UserSelect(props: EntitySelectProps) {
  return (
    <EntityCombobox<UserOutput>
      endpoint="/management/users/"
      getValue={(u) => u.id}
      getLabel={(u) => `${userLabel(u)} (${u.role})`}
      placeholder={props.placeholder ?? 'Select user…'}
      searchPlaceholder="Search users…"
      emptyText="No users found."
      {...props}
    />
  );
}

// Picks a property from the management catalog.
function PropertySelect(props: EntitySelectProps) {
  return (
    <EntityCombobox<ManagementPropertyOutput>
      endpoint="/management/properties/"
      getValue={(p) => p.id}
      getLabel={(p) => p.name}
      placeholder={props.placeholder ?? 'Select property…'}
      searchPlaceholder="Search properties…"
      emptyText="No properties found."
      {...props}
    />
  );
}

// Picks a lease. The endpoint has no server-side search yet, so filtering is client-side over the first page.
function LeaseSelect(props: EntitySelectProps) {
  return (
    <EntityCombobox<ManagementLeaseOutput>
      endpoint="/management/leases/"
      clientFilter
      getValue={(l) => l.id}
      getLabel={(l) => `#${l.id} · ${l.property_name} — ${l.tenant_name}`}
      placeholder={props.placeholder ?? 'Select lease…'}
      searchPlaceholder="Search leases…"
      emptyText="No leases found."
      {...props}
    />
  );
}

// Picks an owner agreement. No server-side search yet, so filtering is client-side over the first page.
function AgreementSelect(props: EntitySelectProps) {
  return (
    <EntityCombobox<ManagementAgreementOutput>
      endpoint="/management/owner-agreements/"
      clientFilter
      getValue={(a) => a.id}
      getLabel={(a) => `${a.agreement_number} · ${a.property_name} — ${a.owner_name}`}
      placeholder={props.placeholder ?? 'Select agreement…'}
      searchPlaceholder="Search agreements…"
      emptyText="No agreements found."
      {...props}
    />
  );
}

export {
  AgreementSelect,
  LeaseSelect,
  OwnerSelect,
  PropertySelect,
  StaffSelect,
  TenantSelect,
  UserSelect,
};
export type { EntitySelectProps };

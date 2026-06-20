import { z } from 'zod';

/**
 * User edit form schema. Mirrors the backend `ManagementUserUpdateInput`
 * (role, active, verified) used by the management user edit page.
 */
export const userEditSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  is_active: z.boolean().optional(),
  is_verified: z.boolean().optional(),
});

export type UserEditFormData = z.infer<typeof userEditSchema>;

export const ROLE_OPTIONS = [
  { value: 'mgmt', label: 'Management' },
  { value: 'owner', label: 'Owner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'agent', label: 'Agent' },
  { value: 'listings', label: 'Listings' },
];

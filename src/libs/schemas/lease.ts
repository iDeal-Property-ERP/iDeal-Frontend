import { z } from 'zod';

/**
 * Lease edit form schema. Mirrors the backend `LeaseUpdateInput`
 * (dates, monthly rent, deposit, status) used by the lease edit page.
 * Foreign keys (property/tenant/agreement) are not editable after creation.
 */
export const leaseEditSchema = z
  .object({
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    monthly_rent: z
      .string()
      .min(1, 'Monthly rent is required')
      .refine((v) => Number(v) > 0, 'Must be a positive number'),
    deposit: z
      .string()
      .min(1, 'Deposit is required')
      .refine((v) => Number(v) > 0, 'Must be a positive number'),
    status: z.string().optional(),
  })
  .refine((d) => new Date(d.end_date) > new Date(d.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

export type LeaseEditFormData = z.infer<typeof leaseEditSchema>;

export const LEASE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'renewed', label: 'Renewed' },
  { value: 'terminated', label: 'Terminated' },
];

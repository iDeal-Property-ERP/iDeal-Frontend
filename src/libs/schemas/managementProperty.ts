import { z } from 'zod';

/**
 * Management property form schemas. A draft may be saved with any subset of
 * fields, while publishing requires the full trust-model dataset. Fields are
 * modeled as the raw control values (strings, plus a numeric owner id) so the
 * react-hook-form input and output types match — the backend coerces on save.
 * Field-level messages mirror the Figma field-states board copy.
 */

export const managementPropertyDraftSchema = z.object({
  engagement_type: z.enum(['managed', 'one_off']).optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  landmark: z
    .string()
    .max(100, 'Landmark cannot exceed 100 characters')
    .optional()
    .refine((val) => !val || val.trim().split(/\s+/u).filter(Boolean).length <= 5, {
      message: 'Landmark cannot exceed 5 words',
    }),
  district_id: z.string().optional(),
  owner_id: z.number().nullable().optional(),
  rooms: z.string().optional(),
  area_sqm: z.string().optional(),
  floor: z.string().optional(),
  total_floors: z.string().optional(),
  tariff: z.string().optional(),
  ask_price: z.string().optional(),
  owner_guaranteed_price: z.string().optional(),
  tenant_charge_price: z.string().optional(),
  ask_currency: z.string().optional(),
  owner_guaranteed_currency: z.string().optional(),
  tenant_charge_currency: z.string().optional(),
  description: z.string().optional(),
  contact_phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || !val.trim()) {
          return true;
        }
        const normalized = val.replaceAll(/[\s\-()]/gu, '');
        return /^(?:\+?998\d{9}|00998\d{9})$/u.test(normalized);
      },
      {
        message: 'Invalid Uzbekistan phone number (+998XXXXXXXXX)',
      },
    ),
  map_lat: z.string().optional(),
  map_lon: z.string().optional(),
  seller_name: z.string().optional(),
  seller_phone: z.string().optional(),
  seller_email: z.string().optional(),
  channel: z.enum(['marketplace', 'off_market']).optional(),
  commission_type: z.enum(['none', 'fixed', 'percentage']).optional(),
  commission_fixed_amount: z.string().optional(),
  commission_percentage: z.string().optional(),
  commission_currency: z.enum(['USD', 'UZS']).optional(),
  translations: z
    .object({
      en: z
        .object({
          name: z.string().nullable().optional(),
          description: z.string().nullable().optional(),
          landmark: z.string().nullable().optional(),
        })
        .optional(),
      uz: z
        .object({
          name: z.string().nullable().optional(),
          description: z.string().nullable().optional(),
          landmark: z.string().nullable().optional(),
        })
        .optional(),
      ru: z
        .object({
          name: z.string().nullable().optional(),
          description: z.string().nullable().optional(),
          landmark: z.string().nullable().optional(),
        })
        .optional(),
    })
    .optional(),
});

const requiredString = (message: string) => z.string().trim().min(1, message);

export const managementPropertyPublishSchema = z.object({
  name: requiredString('Property name is required'),
  address: requiredString('Address is required'),
  district_id: requiredString('District is required'),
  owner_id: z.number({ message: 'Owner is required' }),
  rooms: requiredString('Rooms is required'),
  area_sqm: requiredString('Area is required'),
  floor: requiredString('Floor is required'),
  total_floors: requiredString('Building floors is required'),
  tariff: z.string().optional(),
  ask_price: requiredString('Ask price is required'),
});

/** Activation requirements for a one-off deal. The Marketplace photo/visit gate
 * is intentionally enforced by the backend because it relies on saved assets. */
export const managementOneOffActivateSchema = z
  .object({
    name: requiredString('Property name is required'),
    address: requiredString('Address is required'),
    district_id: requiredString('District is required'),
    rooms: requiredString('Rooms is required'),
    area_sqm: requiredString('Area is required'),
    floor: requiredString('Floor is required'),
    total_floors: requiredString('Building floors is required'),
    ask_price: requiredString('Ask price is required'),
    seller_name: requiredString('Seller name is required'),
    seller_phone: requiredString('Seller phone is required'),
    channel: z.enum(['marketplace', 'off_market']),
    commission_type: z.enum(['none', 'fixed', 'percentage']),
    commission_fixed_amount: z.string().optional(),
    commission_percentage: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.commission_type === 'fixed' && !value.commission_fixed_amount?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['commission_fixed_amount'],
        message: 'Commission amount is required',
      });
    }
    if (value.commission_type === 'percentage' && !value.commission_percentage?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['commission_percentage'],
        message: 'Commission percentage is required',
      });
    }
  });

export type ManagementPropertyFormData = z.infer<typeof managementPropertyDraftSchema>;

export const TARIFF_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'premium', label: 'Premium' },
];

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'UZS', label: 'UZS' },
];

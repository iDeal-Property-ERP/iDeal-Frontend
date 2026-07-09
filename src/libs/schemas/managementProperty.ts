import { z } from 'zod';

/**
 * Management property form schemas. A draft may be saved with any subset of
 * fields, while publishing requires the full trust-model dataset. Fields are
 * modeled as the raw control values (strings, plus a numeric owner id) so the
 * react-hook-form input and output types match — the backend coerces on save.
 * Field-level messages mirror the Figma field-states board copy.
 */

export const managementPropertyDraftSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
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
  map_lat: z.string().optional(),
  map_lon: z.string().optional(),
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
  tariff: z.string().optional(),
  ask_price: requiredString('Ask price is required'),
  owner_guaranteed_price: requiredString('Owner guaranteed price is required'),
  tenant_charge_price: requiredString('Tenant charge is required'),
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

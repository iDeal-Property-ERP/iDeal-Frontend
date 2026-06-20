import { z } from 'zod';

/**
 * Shared property create/edit form schema. Used by both the new-property and
 * edit-property pages so field rules stay in one place.
 */
export const propertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  district_id: z.coerce.number().min(1, 'District is required'),
  owner_id: z.coerce.number().min(1, 'Owner is required'),
  rooms: z.coerce.number().min(0, 'Rooms must be 0 or more'),
  area_sqm: z.coerce.number().min(0, 'Area must be 0 or more'),
  floor: z.coerce.number().min(0, 'Floor must be 0 or more'),
  total_floors: z.coerce.number().min(0, 'Total floors must be 0 or more').optional(),
  status: z.string().optional(),
  tariff: z.string().optional(),
  ask_price: z.string().min(1, 'Ask price is required'),
  ask_currency: z.string().optional(),
  owner_guaranteed_price: z.string().min(1, 'Owner guaranteed price is required'),
  owner_guaranteed_currency: z.string().optional(),
  tenant_charge_price: z.string().min(1, 'Tenant charge price is required'),
  tenant_charge_currency: z.string().optional(),
  description: z.string().optional(),
  score: z.string().optional(),
  map_lat: z.string().optional(),
  map_lon: z.string().optional(),
  vacant_since: z.string().optional(),
  vacant_days: z.coerce.number().min(0, 'Vacant days must be 0 or more').optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const PROPERTY_STATUS_OPTIONS = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'rented', label: 'Rented' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const TARIFF_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'premium', label: 'Premium' },
];

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'UZS', label: 'UZS' },
];

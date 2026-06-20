import { z } from 'zod';

/**
 * Payment edit form schema. Mirrors the backend `PaymentPartialUpdateInput`
 * (amount, currency, dates, method, notes) used by the payment edit page.
 */
export const paymentEditSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().optional(),
  payment_date: z.string().min(1, 'Payment date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  method: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentEditFormData = z.infer<typeof paymentEditSchema>;

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
];

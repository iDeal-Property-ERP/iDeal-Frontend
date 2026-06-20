'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { DateField, TextareaField, TextField } from '@/components/ui/form-fields';
import { Env } from '@/libs/Env';
import { createApiSubmit } from '@/libs/forms';
import { Link } from '@/libs/I18nNavigation';
import type { ViewingOutput } from '@/types/marketplace';

const bookViewingSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  email: z.email(),
  preferred_date: z.string().min(1),
  message: z.string().optional(),
});

/**
 * Book a viewing page for a specific listing, submitting contact details to the API.
 * @returns Booking form or success confirmation.
 */
export default function BookViewingPage() {
  const t = useTranslations('BookViewingPage');
  const { id } = useParams<{ id: string }>();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(bookViewingSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      preferred_date: '',
      message: '',
    },
  });

  const onSubmit = createApiSubmit(form, {
    submit: async (data) => {
      const res = await fetch(
        `${Env.NEXT_PUBLIC_API_URL}/marketplace/listings/${id}/book-viewing/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );
      const json = (await res.json()) as {
        success: boolean;
        message?: string;
        data: ViewingOutput;
      };
      if (!json.success) {
        throw new Error(json.message ?? t('booking_failed'));
      }
      return json.data;
    },
    success: t('booking_success'),
    error: t('booking_failed'),
    onSuccess: () => setIsSuccess(true),
  });

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">{t('booking_success')}</h1>
        <p className="mb-6 text-muted-foreground">{t('booking_success_message')}</p>
        <Button asChild variant="default">
          <Link href={`/listings/${id}`}>{t('back_to_listing')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Button
        asChild
        variant="ghost"
        className="mb-6 px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <Link href={`/listings/${id}`}>&larr; {t('back_to_listing')}</Link>
      </Button>

      <h1 className="mb-6 text-2xl font-bold text-foreground">{t('book_a_viewing')}</h1>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField control={form.control} name="full_name" label={t('full_name')} required />
          <TextField
            control={form.control}
            name="phone"
            label={t('phone')}
            type="tel"
            inputMode="tel"
            required
          />
          <TextField
            control={form.control}
            name="email"
            label={t('email')}
            type="email"
            inputMode="email"
            required
          />
          <DateField
            control={form.control}
            name="preferred_date"
            label={t('preferred_date')}
            required
          />
          <TextareaField
            control={form.control}
            name="message"
            label={`${t('message')} (${t('optional')})`}
            rows={3}
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {form.formState.isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </Form>
    </div>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Env } from '@/libs/Env';
import { Link } from '@/libs/I18nNavigation';
import type { ViewingOutput } from '@/types/marketplace';

const bookViewingSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(1),
  email: z.email(),
  preferred_date: z.string().min(1),
  message: z.string().optional(),
});

type BookViewingFormValues = z.infer<typeof bookViewingSchema>;

/**
 * Book a viewing page for a specific listing, submitting contact details to the API.
 * @returns Booking form or success confirmation.
 */
export default function BookViewingPage() {
  const t = useTranslations('BookViewingPage');
  const { id } = useParams<{ id: string }>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<BookViewingFormValues>({
    resolver: zodResolver(bookViewingSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      preferred_date: '',
      message: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setServerError(null);
    try {
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
      if (json.success) {
        setIsSuccess(true);
      } else {
        throw new Error(json.message ?? t('booking_failed'));
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('booking_failed'));
    }
  });

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">{t('booking_success')}</h1>
        <p className="mb-6 text-muted-foreground">{t('booking_success_message')}</p>
        <Link
          href={`/listings/${id}`}
          className="inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('back_to_listing')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link
        href={`/listings/${id}`}
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {t('back_to_listing')}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-foreground">{t('book_a_viewing')}</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
            {t('full_name')}
          </label>
          <Input id="full_name" type="text" className="mt-1" {...form.register('full_name')} />
          {form.formState.errors.full_name && (
            <p className="mt-1 text-sm text-danger">{t('field_required')}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            {t('phone')}
          </label>
          <Input id="phone" type="tel" className="mt-1" {...form.register('phone')} />
          {form.formState.errors.phone && (
            <p className="mt-1 text-sm text-danger">{t('field_required')}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            {t('email')}
          </label>
          <Input id="email" type="email" className="mt-1" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="mt-1 text-sm text-danger">
              {form.formState.errors.email.type === 'invalid_string'
                ? t('invalid_email')
                : t('field_required')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="preferred_date" className="block text-sm font-medium text-foreground">
            {t('preferred_date')}
          </label>
          <Input
            id="preferred_date"
            type="date"
            className="mt-1"
            {...form.register('preferred_date')}
          />
          {form.formState.errors.preferred_date && (
            <p className="mt-1 text-sm text-danger">{t('field_required')}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-foreground">
            {t('message')} ({t('optional')})
          </label>
          <Textarea id="message" rows={3} className="mt-1" {...form.register('message')} />
        </div>

        {serverError && (
          <Alert variant="danger" className="text-sm">
            {serverError}
          </Alert>
        )}

        <Button
          type="submit"
          intent="primary"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </div>
  );
}

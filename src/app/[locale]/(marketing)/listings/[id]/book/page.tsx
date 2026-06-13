'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {t('booking_success')}
        </h1>
        <p className="mb-6 text-zinc-500 dark:text-zinc-400">{t('booking_success_message')}</p>
        <Link
          href={`/listings/${id}`}
          className="inline-block rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
      >
        &larr; {t('back_to_listing')}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {t('book_a_viewing')}
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t('full_name')}
          </label>
          <input
            id="full_name"
            type="text"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            {...form.register('full_name')}
          />
          {form.formState.errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{t('field_required')}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t('phone')}
          </label>
          <input
            id="phone"
            type="tel"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            {...form.register('phone')}
          />
          {form.formState.errors.phone && (
            <p className="mt-1 text-sm text-red-600">{t('field_required')}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.email.type === 'invalid_string'
                ? t('invalid_email')
                : t('field_required')}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="preferred_date"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t('preferred_date')}
          </label>
          <input
            id="preferred_date"
            type="date"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            {...form.register('preferred_date')}
          />
          {form.formState.errors.preferred_date && (
            <p className="mt-1 text-sm text-red-600">{t('field_required')}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t('message')} ({t('optional')})
          </label>
          <textarea
            id="message"
            rows={3}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            {...form.register('message')}
          />
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {form.formState.isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  );
}

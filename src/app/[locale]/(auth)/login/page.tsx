'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth, roleDashboardMap } from '@/libs/auth';
import { useRouter } from '@/libs/I18nNavigation';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('LoginPage');
  const { login, user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(roleDashboardMap[user.role]);
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = form.handleSubmit(async (data) => {
    setServerError(null);
    try {
      await login(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('unknown_error');
      setServerError(message);
    }
  });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        iDeal
      </h1>
      <p className="mb-6 text-center text-sm text-zinc-500">{t('sign_in_to_continue')}</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t('username')}
          </label>
          <input
            id="username"
            type="text"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            {...form.register('username')}
          />
          {form.formState.errors.username && (
            <p className="mt-1 text-sm text-red-600">{t('field_required')}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="mt-1 text-sm text-red-600">{t('field_required')}</p>
          )}
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
          {form.formState.isSubmitting ? t('signing_in') : t('sign_in')}
        </button>
      </form>

      <p className="mt-4 text-center">
        <span className="text-sm text-zinc-400">{t('forgot_password')}</span>
      </p>
    </div>
  );
}

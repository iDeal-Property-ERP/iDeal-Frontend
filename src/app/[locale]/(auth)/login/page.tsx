'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth, roleDashboardMap } from '@/libs/auth';
import { useRouter } from '@/libs/I18nNavigation';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Login page with username/password form and role-based redirect on success.
 * @returns Login form card.
 */
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
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">iDeal</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">{t('sign_in_to_continue')}</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-foreground">
            {t('username')}
          </label>
          <Input id="username" type="text" className="mt-1" {...form.register('username')} />
          {form.formState.errors.username && (
            <p className="mt-1 text-sm text-danger">{t('field_required')}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            {t('password')}
          </label>
          <Input id="password" type="password" className="mt-1" {...form.register('password')} />
          {form.formState.errors.password && (
            <p className="mt-1 text-sm text-danger">{t('field_required')}</p>
          )}
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
          {form.formState.isSubmitting ? t('signing_in') : t('sign_in')}
        </Button>
      </form>

      <p className="mt-4 text-center">
        <span className="text-sm text-muted-foreground">{t('forgot_password')}</span>
      </p>
    </div>
  );
}

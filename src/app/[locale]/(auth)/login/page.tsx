'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField } from '@/components/ui/form-fields';
import { ApiError_ } from '@/libs/api';
import { useAuth, roleDashboardMap } from '@/libs/auth';
import { useRouter } from '@/libs/I18nNavigation';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/**
 * Login page with username/password form and role-based redirect on success.
 * @returns Login form card.
 */
export default function LoginPage() {
  const t = useTranslations('LoginPage');
  const { login, user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      // Invited users on a temporary password must set their own first.
      router.push(user.must_change_password ? '/set-password' : roleDashboardMap[user.role]);
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = form.handleSubmit(async (data) => {
    setServerError(null);
    try {
      await login(data);
    } catch (error) {
      // Show a localized message instead of the backend's English string.
      const message =
        error instanceof ApiError_ && error.status === 401
          ? t('invalid_credentials')
          : t('unknown_error');
      setServerError(message);
    }
  });

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">iDeal</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">{t('sign_in_to_continue')}</p>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField control={form.control} name="username" label={t('username')} required />
          <TextField
            control={form.control}
            name="password"
            label={t('password')}
            type="password"
            required
          />

          {serverError && (
            <Alert variant="danger" className="text-sm">
              {serverError}
            </Alert>
          )}

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {form.formState.isSubmitting ? t('signing_in') : t('sign_in')}
          </Button>
        </form>
      </Form>
    </div>
  );
}

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
import { apiFetch, ApiError_, refreshSession } from '@/libs/api';
import { roleDashboardMap, useAuth } from '@/libs/auth';
import { useRouter } from '@/libs/I18nNavigation';

const schema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
  confirm_password: z.string().min(1),
});

/**
 * Set-password screen for invited users on a temporary password (and any user
 * changing their password). On success it refreshes the session and routes to
 * the role dashboard.
 * @returns The set-password card.
 */
export default function SetPasswordPage() {
  const t = useTranslations('SetPassword');
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const onSubmit = form.handleSubmit(async (data) => {
    setServerError(null);
    if (data.new_password !== data.confirm_password) {
      form.setError('confirm_password', { type: 'validate', message: t('passwords_mismatch') });
      return;
    }
    try {
      await apiFetch('/auth/set-password/', {
        method: 'POST',
        body: { current_password: data.current_password, new_password: data.new_password },
      });
      // The `must_change_password` flag is also baked into the access-token JWT
      // (read by the Edge middleware). The DB flag is now cleared, but the cookie
      // still carries the stale claim — rotate it via a refresh so the middleware
      // stops redirecting back here, then sync the client user + leave.
      const rotated = await refreshSession();
      await refreshUser();
      const dest = user ? roleDashboardMap[user.role] : '/login';
      if (rotated) {
        router.replace(dest);
      } else {
        // Refresh failed unexpectedly — hard-navigate so the browser re-reads
        // cookies through the middleware rather than silently looping here.
        window.location.assign(dest);
      }
    } catch (error) {
      setServerError(
        error instanceof ApiError_ && error.status === 400
          ? t('current_incorrect')
          : t('unknown_error'),
      );
    }
  });

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">
        {t('title')}
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">{t('subtitle')}</p>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField
            control={form.control}
            name="current_password"
            label={t('current_password')}
            type="password"
            required
          />
          <TextField
            control={form.control}
            name="new_password"
            label={t('new_password')}
            type="password"
            required
          />
          <TextField
            control={form.control}
            name="confirm_password"
            label={t('confirm_password')}
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
            {form.formState.isSubmitting ? t('saving') : t('save')}
          </Button>
        </form>
      </Form>
    </div>
  );
}

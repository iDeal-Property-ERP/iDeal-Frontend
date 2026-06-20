'use client';

import { Loader2Icon } from 'lucide-react';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormLoading } from '@/components/ui/detail';
import { Form } from '@/components/ui/form';
import { EntityField, SelectField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { useEntityForm } from '@/hooks/useEntityForm';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import { ROLE_OPTIONS, userEditSchema } from '@/libs/schemas/user';
import type { UserOutput } from '@/types/management';

/**
 * Edit form for a management user (role, active, verified).
 * @param props - Page props containing the route params.
 * @returns User edit page.
 */
export default function EditUserPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();

  const { form, loading } = useEntityForm({
    path: `/management/users/${params.id}/`,
    schema: userEditSchema,
    errorMessage: 'Failed to load user',
    toFormValues: (u: UserOutput) => ({
      role: u.role,
      is_active: u.is_active,
      is_verified: u.is_verified,
    }),
  });

  const onSubmit = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch(`/management/users/${params.id}/`, { method: 'PATCH', body: values }),
    success: 'User updated',
    error: 'Failed to update user',
    onSuccess: () => router.push(`/management/users/${params.id}`),
  });

  const { isSubmitting } = form.formState;

  if (loading) {
    return (
      <>
        <PageHeader title="Edit User" backHref={`/management/users/${params.id}`} />
        <FormLoading fields={3} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Edit User" backHref={`/management/users/${params.id}`} />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-md space-y-4">
          <SelectField
            control={form.control}
            name="role"
            label="Role"
            options={ROLE_OPTIONS}
            placeholder="Select role"
          />
          <EntityField control={form.control} name="is_active" label="Active">
            {(field) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </div>
            )}
          </EntityField>
          <EntityField control={form.control} name="is_verified" label="Verified">
            {(field) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_verified"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </div>
            )}
          </EntityField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </>
  );
}

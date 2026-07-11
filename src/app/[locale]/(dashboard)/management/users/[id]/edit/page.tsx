import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy route — the standalone user edit page predates the Users workbench.
 * Editing a user is now a dialog (EditUserDialog) opened from the workbench
 * record panel, matching the Figma design. Redirects to keep old links working.
 * @param props - The route params carrying the active locale.
 * @returns Never — always redirects to `/management/users`.
 */
export default async function EditUserRedirect(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await props.params;
  redirect({ href: '/management/users', locale });
}

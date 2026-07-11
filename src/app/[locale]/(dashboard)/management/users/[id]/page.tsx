import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy route — the standalone user detail page predates the Users workbench.
 * User records are now viewed in the workbench record panel (archetype D), so
 * this redirects to the workbench to keep old bookmarks working.
 * @param props - The route params carrying the active locale.
 * @returns Never — always redirects to `/management/users`.
 */
export default async function UserDetailRedirect(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await props.params;
  redirect({ href: '/management/users', locale });
}

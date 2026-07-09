import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy route — VAS orders were folded into the Services workbench (Phase 6).
 * Redirects to keep old bookmarks working.
 * @param props - The route params carrying the active locale.
 * @returns Never — always redirects to `/management/services`.
 */
export default async function VasOrdersRedirect(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  redirect({ href: '/management/services', locale });
}

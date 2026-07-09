import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy route — the VAS catalog is now the Catalog tab of the Services
 * workbench (Phase 6). Redirects to keep old bookmarks working.
 * @param props - The route params carrying the active locale.
 * @returns Never — always redirects to `/management/services?tab=catalog`.
 */
export default async function VasCatalogRedirect(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  redirect({ href: '/management/services?tab=catalog', locale });
}

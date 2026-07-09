import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy route — Service Requests were rebuilt as the Maintenance workbench
 * (Phase 5). Redirects to keep old bookmarks working.
 * @param props - The route params carrying the active locale.
 * @returns Never — always redirects to `/management/maintenance`.
 */
export default async function ServiceRequestsRedirect(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  redirect({ href: '/management/maintenance', locale });
}

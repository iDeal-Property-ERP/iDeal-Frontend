import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy route — Viewing Requests were merged into the unified Leads triage
 * queue (Phase 5). Redirects to keep old bookmarks working.
 * @param props - The route params carrying the active locale.
 * @returns Never — always redirects to `/management/leads`.
 */
export default async function ViewingRequestsRedirect(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  redirect({ href: '/management/leads', locale });
}

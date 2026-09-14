import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy property list. Create/update/delete are management-only.
 * @param props - The route params carrying the active locale.
 * @returns Never; redirects to the management properties workbench.
 */
export default async function PropertiesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  redirect({ href: '/management/properties', locale });
}

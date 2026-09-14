import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy property create form. Creation is management-only.
 * @param props - The route params carrying the active locale.
 * @returns Never; redirects to the management create workflow.
 */
export default async function NewPropertyPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  redirect({ href: '/management/properties/new', locale });
}

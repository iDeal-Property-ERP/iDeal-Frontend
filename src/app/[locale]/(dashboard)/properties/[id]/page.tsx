import { redirect } from '@/libs/I18nNavigation';

/**
 * Legacy property detail/edit. Mutations are management-only.
 * @param props - Route params containing the locale and property id.
 * @returns Never; redirects to the management edit workflow.
 */
export default async function PropertyDetailPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await props.params;
  redirect({ href: `/management/properties/${id}/edit`, locale });
}

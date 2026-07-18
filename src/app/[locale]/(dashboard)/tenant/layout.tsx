import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function TenantLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  await getTranslations({ locale, namespace: 'Dashboard' as const });

  return await props.children;
}

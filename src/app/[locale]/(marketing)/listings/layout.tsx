import { setRequestLocale } from 'next-intl/server';

export default async function ListingsLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return await props.children;
}

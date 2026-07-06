import { setRequestLocale } from 'next-intl/server';
import { ManagementPageContainer } from '@/components/management/ManagementPageContainer';

export default async function ManagementLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <ManagementPageContainer>{props.children}</ManagementPageContainer>;
}

import { setRequestLocale } from 'next-intl/server';
import { AuthLayoutClient } from './AuthLayoutClient';

export default async function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <AuthLayoutClient>{props.children}</AuthLayoutClient>;
}

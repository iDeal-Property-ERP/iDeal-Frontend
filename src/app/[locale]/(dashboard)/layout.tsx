import { setRequestLocale } from 'next-intl/server';
import { DashboardShell } from './DashboardShell';

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <DashboardShell>{props.children}</DashboardShell>;
}

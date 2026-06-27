import { setRequestLocale } from 'next-intl/server';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export default async function MarketingLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <MarketingShell>
      <MarketingHeader />
      <main className="flex-1">{props.children}</main>
      <MarketingFooter />
    </MarketingShell>
  );
}

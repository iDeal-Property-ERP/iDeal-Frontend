import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { ListPropertyWizard } from '@/components/listings/ListPropertyWizard';

export default async function ListYourPropertyPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <ListPropertyWizard />
    </Suspense>
  );
}

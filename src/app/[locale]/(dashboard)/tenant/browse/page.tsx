'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function BrowseHomesPage() {
  const t = useTranslations('Pages');

  return <PageHeader title={t('browse_homes')} description={t('browse_homes_desc')} />;
}

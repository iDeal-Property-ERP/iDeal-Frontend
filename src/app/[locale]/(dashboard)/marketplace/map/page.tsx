'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MapSearchPage() {
  const t = useTranslations('Pages');

  return <PageHeader title={t('map_search')} description={t('map_search_desc')} />;
}

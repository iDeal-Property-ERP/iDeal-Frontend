'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ListingsPage() {
  const t = useTranslations('Pages');

  return <PageHeader title={t('marketplace')} description={t('marketplace_desc')} />;
}

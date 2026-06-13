'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function VacancyCostPage() {
  const t = useTranslations('Pages');

  return <PageHeader title={t('vacancy_cost')} description={t('vacancy_cost_desc')} />;
}

'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * How it works informational page for owners.
 * @returns How it works page element.
 */
export default function HowItWorksPage() {
  const t = useTranslations('Pages');

  return <PageHeader title={t('how_it_works')} description={t('how_it_works_desc')} />;
}

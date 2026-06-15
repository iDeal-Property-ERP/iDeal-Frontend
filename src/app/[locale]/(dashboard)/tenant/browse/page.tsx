'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Browse homes page for tenants to explore available properties.
 * @returns Browse homes page element.
 */
export default function BrowseHomesPage() {
  const t = useTranslations('Pages');

  return <PageHeader title={t('browse_homes')} description={t('browse_homes_desc')} />;
}

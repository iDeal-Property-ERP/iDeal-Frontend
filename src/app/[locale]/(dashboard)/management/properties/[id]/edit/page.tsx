'use client';

import { useTranslations } from 'next-intl';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PropertyForm } from '@/components/management/forms/PropertyForm';
import { WorkbenchTableSkeleton } from '@/components/management/workbench/WorkbenchTableSkeleton';
import { fetchPropertyDetail } from '@/libs/management/propertiesAdapter';
import type { PropertyDetail } from '@/types/property';

type EditPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * The management "Edit property" page — loads the property, then renders the same
 * form in edit mode (prefilled, "Save changes" footer).
 * @param props - Route params carrying the property id.
 * @returns The edit-property page.
 */
export default function EditManagementPropertyPage(props: EditPageProps) {
  const { id } = use(props.params);
  const t = useTranslations('Management');
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchPropertyDetail(id)
      .then((data) => {
        if (active) {
          setProperty(data);
        }
      })
      .catch(() => toast.error(t('form_load_error')))
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, t]);

  if (loading || !property) {
    return <WorkbenchTableSkeleton />;
  }
  return <PropertyForm mode="edit" initial={property} />;
}

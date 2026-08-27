'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PropertyForm } from '@/components/management/forms/PropertyForm';

function NewManagementPropertyForm() {
  const searchParams = useSearchParams();
  return (
    <PropertyForm
      mode="create"
      initialEngagement={searchParams.get('engagement') === 'one_off' ? 'one_off' : 'managed'}
    />
  );
}

/**
 * The management "New property" page — the sectioned create form with autosave
 * drafts, a live publish checklist, and verification scheduling.
 * @returns The create-property page.
 */
export default function NewManagementPropertyPage() {
  return (
    <Suspense fallback={null}>
      <NewManagementPropertyForm />
    </Suspense>
  );
}

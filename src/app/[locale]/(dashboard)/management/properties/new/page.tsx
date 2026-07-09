'use client';

import { PropertyForm } from '@/components/management/forms/PropertyForm';

/**
 * The management "New property" page — the sectioned create form with autosave
 * drafts, a live publish checklist, and verification scheduling.
 * @returns The create-property page.
 */
export default function NewManagementPropertyPage() {
  return <PropertyForm mode="create" />;
}

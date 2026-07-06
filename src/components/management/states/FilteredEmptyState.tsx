'use client';

import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';

/**
 * The "no matches" state shown when active filters or a search exclude every
 * row — distinct from the true empty state, it offers a Clear filters action
 * rather than a create CTA.
 * @param props - Title, description, and the clear-filters handler/label.
 * @returns The filtered-empty state element.
 */
export function FilteredEmptyState(props: {
  title: string;
  description: string;
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      icon={SearchX}
      title={props.title}
      description={props.description}
      tone="muted"
      action={
        <Button variant="outline" size="sm" onClick={props.onClear}>
          {props.clearLabel}
        </Button>
      }
    />
  );
}

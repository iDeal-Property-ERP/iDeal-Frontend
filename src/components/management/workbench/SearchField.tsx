'use client';

import { Search, X } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/libs/utils';

/**
 * The workbench toolbar search field: a bordered input with a leading search
 * icon, a clear button when it has a value, and a `/` keyboard shortcut that
 * focuses it from anywhere on the page.
 * @param props - Value, change handler, placeholder, aria label, class, and an
 *   optional clear label.
 * @returns The search field element.
 */
export function SearchField(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label
      className={cn(
        'flex h-9 items-center gap-2 rounded-[10px] border border-border bg-card px-3',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        props.className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && props.value) {
            event.stopPropagation();
            props.onChange('');
          }
        }}
        placeholder={props.placeholder}
        aria-label={props.ariaLabel}
        data-workbench-search
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {props.value ? (
        <button
          type="button"
          aria-label={props.clearLabel}
          onClick={() => {
            props.onChange('');
            inputRef.current?.focus();
          }}
          className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </label>
  );
}

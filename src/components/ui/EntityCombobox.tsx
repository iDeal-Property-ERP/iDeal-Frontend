'use client';

import { CheckIcon, ChevronsUpDownIcon, Loader2Icon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiFetch } from '@/libs/api';
import { cn } from '@/libs/utils';
import type { PaginatedData } from '@/types/api';

type EntityComboboxProps<T> = {
  /** API list endpoint, e.g. `/management/users/`. */
  endpoint: string;
  /** Extra query params merged into every request (e.g. `{ role: 'tenant' }`). */
  query?: Record<string, string | number | boolean | undefined>;
  /** Maps an item to its stable numeric id (the stored value). */
  getValue: (item: T) => number;
  /** Maps an item to its human-readable label. */
  getLabel: (item: T) => string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  /** Label to show for a preloaded value before options have been fetched (edit forms). */
  initialLabel?: string;
  /** When the endpoint has no server-side `search`, filter the first page client-side. */
  clientFilter?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
};

const DEBOUNCE_MS = 300;

// Searchable, API-backed entity picker built on Command + Popover. Fetches the
// first page of a paginated list endpoint, debounced by search term, and stores
// the selected entity's numeric id. Caches resolved labels so the trigger keeps
// showing the chosen entity even as the option list changes.
function EntityCombobox<T>(props: EntityComboboxProps<T>) {
  const {
    endpoint,
    query,
    getValue,
    getLabel,
    value,
    onChange,
    initialLabel,
    clientFilter = false,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyText = 'No results found.',
    disabled,
    id,
    className,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [items, setItems] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [labelCache, setLabelCache] = React.useState<Map<number, string>>(() => {
    const map = new Map<number, string>();
    if (value !== null && value !== undefined && initialLabel) {
      map.set(value, initialLabel);
    }
    return map;
  });

  // Debounce the search term.
  React.useEffect(() => {
    const handle = setTimeout(() => setDebounced(search), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  // Fetch options when the popover is open (and when the debounced term changes).
  React.useEffect(() => {
    let cancelled = false;
    if (open) {
      const requestQuery = {
        ...query,
        page: 1,
        search: !clientFilter && debounced ? debounced : undefined,
      } satisfies Record<string, string | number | boolean | undefined>;
      apiFetch<PaginatedData<T>>(endpoint, { query: requestQuery })
        .then((res) => {
          if (cancelled) {
            return;
          }
          const list = res.page.object_list;
          setLabelCache((prev) => {
            const entries = list.map((item) => [getValue(item), getLabel(item)] as const);
            return new Map([...prev, ...entries]);
          });
          setItems(list);
        })
        .catch(() => {
          if (!cancelled) {
            setItems([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [open, debounced, endpoint, clientFilter, query, getValue, getLabel]);

  const visibleItems = React.useMemo(() => {
    if (!(clientFilter && debounced)) {
      return items;
    }
    const term = debounced.toLowerCase();
    return items.filter((item) => getLabel(item).toLowerCase().includes(term));
  }, [items, clientFilter, debounced, getLabel]);

  const selectedLabel = React.useMemo(() => {
    if (value === null || value === undefined) {
      return null;
    }
    const cached = labelCache.get(value);
    if (cached) {
      return cached;
    }
    const item = items.find((i) => getValue(i) === value);
    return item ? getLabel(item) : null;
  }, [value, labelCache, items, getValue, getLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-expanded={open}
          aria-invalid={props['aria-invalid']}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedLabel && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {visibleItems.map((item) => {
                    const itemValue = getValue(item);
                    return (
                      <CommandItem
                        key={itemValue}
                        value={String(itemValue)}
                        onSelect={() => {
                          onChange(itemValue === value ? null : itemValue);
                          setOpen(false);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            'mr-2 size-4',
                            itemValue === value ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="truncate">{getLabel(item)}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { EntityCombobox };

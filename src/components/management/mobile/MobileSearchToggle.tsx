'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/**
 * Mobile search affordance for the triage screens (Figma Leads/Onboardings): a bordered
 * search icon button that matches the header's notification bell, opening a bottom sheet
 * with a live search field. Used in the header's top-right slot in place of the bell.
 * @param props - The search value, change handler, placeholder and accessible label.
 * @returns The search icon button and its sheet.
 */
export function MobileSearchToggle(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          aria-label={props.ariaLabel}
          className="relative rounded-[10px] bg-card text-muted-foreground shadow-none hover:text-foreground"
          size="icon-lg"
          type="button"
          variant="outline"
        >
          <Search className="size-[18px]" />
          {props.value ? (
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-primary" />
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0" side="bottom">
        <SheetHeader>
          <SheetTitle>{props.ariaLabel}</SheetTitle>
        </SheetHeader>
        <div className="p-4">
          <label className="flex h-11 items-center gap-2 rounded-[12px] border border-border bg-card px-3.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              aria-label={props.ariaLabel}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              onChange={(event) => props.onChange(event.target.value)}
              placeholder={props.placeholder}
              type="search"
              value={props.value}
            />
          </label>
        </div>
      </SheetContent>
    </Sheet>
  );
}

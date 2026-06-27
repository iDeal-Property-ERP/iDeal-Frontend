'use client';

import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/libs/utils';
import type { FaqItem } from '@/types/marketplace';

/**
 * Accordion of FAQ items served from /marketplace/faqs/ (matches the Figma "How it works" page).
 * @param props - The FAQ items to render.
 * @returns The accordion list.
 */
export function FaqAccordion(props: { items: FaqItem[] }) {
  const { items } = props;
  const [open, setOpen] = useState<number | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpen(isOpen ? null : item.id)}
              type="button"
            >
              <span className="font-semibold text-foreground">{item.question}</span>
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
              </span>
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-out',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

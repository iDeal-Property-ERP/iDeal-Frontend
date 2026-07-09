'use client';

import { CheckCircle2 } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/libs/utils';

type Translator = ReturnType<typeof useTranslations>;

const TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

/**
 * Builds the next `count` days as {iso, label} chips (no calendar for near dates).
 * @param count - How many days ahead to generate.
 * @param t - The translator (for the "Tomorrow" label).
 * @returns The day chip descriptors.
 */
function nextDays(count: number, t: Translator): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const base = new Date();
  for (let i = 1; i <= count; i += 1) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    // Local calendar date (not UTC) so "Tomorrow" is correct east of UTC.
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const label =
      i === 1
        ? t('verify_tomorrow')
        : day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    out.push({ iso, label });
  }
  return out;
}

type ScheduleVerificationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: Translator;
  submitting?: boolean;
  /** Called with the chosen ISO datetime (date + slot). */
  onConfirm: (scheduledForIso: string) => void;
};

/**
 * The "Save & schedule verification" scheduler — day chips + time-slot chips (no
 * calendar for near dates), matching the Figma picker. Confirm publishes the draft
 * with the chosen verification datetime.
 * @param props - Open state, translator, submitting flag, and confirm handler.
 * @returns The scheduling dialog.
 */
export function ScheduleVerificationSheet(props: ScheduleVerificationSheetProps) {
  const { open, onOpenChange, t, submitting, onConfirm } = props;
  const days = nextDays(6, t);
  const [day, setDay] = useState<string>(days[0]?.iso ?? '');
  const [slot, setSlot] = useState<string>('10:00');

  const confirm = () => {
    if (day && slot) {
      onConfirm(`${day}T${slot}:00`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('verify_title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t('verify_day')}</p>
            <div className="flex flex-wrap gap-2">
              {days.map((option) => (
                <button
                  key={option.iso}
                  type="button"
                  onClick={() => setDay(option.iso)}
                  className={cn(
                    'h-9 rounded-full border px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    day === option.iso
                      ? 'border-primary bg-primary-subtle text-primary-subtle-foreground'
                      : 'border-border text-muted-foreground hover:border-ring',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t('verify_time')}</p>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSlot(option)}
                  className={cn(
                    'h-9 rounded-full border px-3.5 text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    slot === option
                      ? 'border-primary bg-primary-subtle text-primary-subtle-foreground'
                      : 'border-border text-muted-foreground hover:border-ring',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={confirm} disabled={submitting} className="gap-2">
            <CheckCircle2 className="size-4" />
            {t('verify_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

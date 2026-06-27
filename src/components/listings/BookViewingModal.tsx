'use client';

import { CalendarCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { bookViewing } from '@/libs/marketplace';
import { cn } from '@/libs/utils';
import type { ViewingTimeSlot } from '@/types/enums';

const TIME_SLOTS: ViewingTimeSlot[] = ['10:00', '13:00', '15:00', '18:00'];

/**
 * Returns the next `n` calendar dates as ISO strings (today inclusive).
 * @param n - How many days to generate.
 * @returns ISO date strings.
 */
function nextDates(n: number): string[] {
  const base = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

/**
 * "Book a viewing" dialog — phone-first, with date + time-slot chips (matches Figma modal).
 * @param props - The listing id and the trigger element.
 * @returns The booking dialog.
 */
export function BookViewingModal(props: { listingId: number; trigger: React.ReactNode }) {
  const { listingId, trigger } = props;
  const t = useTranslations('BookViewing');
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(nextDates(1)[0] ?? '');
  const [slot, setSlot] = useState<ViewingTimeSlot | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dates = nextDates(5);

  async function submit() {
    if (!(fullName && phone && date)) {
      toast.error(t('error_required'));
      return;
    }
    setSubmitting(true);
    try {
      await bookViewing(listingId, {
        full_name: fullName,
        phone,
        preferred_date: date,
        preferred_time: slot,
        message: message || null,
      });
      toast.success(t('success'));
      setOpen(false);
      setFullName('');
      setPhone('');
      setMessage('');
      setSlot(null);
    } catch {
      toast.error(t('error_generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder={t('full_name')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            placeholder={t('phone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
          />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t('preferred_date')}</p>
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition',
                    date === d
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {new Date(d).getDate()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t('preferred_time')}</p>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s === slot ? null : s)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition',
                    slot === s
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder={t('message')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />

          <Button className="w-full" disabled={submitting} onClick={submit}>
            {submitting ? t('submitting') : t('confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { addDays, format, isBefore, isValid, parseISO, startOfDay } from 'date-fns';
import { CalendarIcon, Check, Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useListingParams } from '@/hooks/useListingParams';
import { cn } from '@/libs/utils';

export const DEFAULT_FLEXIBILITY_DAYS = 3;
const FLEX_PRESETS = [0, 3, 7];

export function parseDateParam(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function formatDateRangeLabel(startDate: string, endDate: string, fallback: string) {
  const start = parseDateParam(startDate);
  const end = parseDateParam(endDate);
  if (!start || !end) {
    return fallback;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
}

function formatFullDate(value: Date | undefined, fallback: string) {
  return value ? format(value, 'd MMM yyyy') : fallback;
}

function formatFlexibility(days: number, exactLabel: string, flexLabel: (days: number) => string) {
  return days === 0 ? exactLabel : flexLabel(days);
}

function DateSummaryCard(props: { label: string; value: string; active?: boolean }) {
  return (
    <div
      className={cn(
        'min-h-14 rounded-xl border bg-background px-4 py-2.5',
        props.active ? 'border-ring ring-2 ring-ring/20' : 'border-border',
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{props.label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{props.value}</p>
    </div>
  );
}

function FlexibilityControl(props: {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  const t = useTranslations('Listings');
  const setSafe = (next: number) => props.onChange(Math.max(0, Math.min(30, next)));

  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t('sb_flexibility')}</p>
          <p className={cn('font-semibold text-foreground', props.compact ? 'text-lg' : 'text-xl')}>
            {formatFlexibility(props.value, t('sb_exact_dates'), (days) =>
              t('sb_plus_minus_days', { days }),
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={t('decrease_flexibility')}
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-40"
            disabled={props.value === 0}
            onClick={() => setSafe(props.value - 1)}
            type="button"
          >
            <Minus className="size-4" />
          </button>
          <button
            aria-label={t('increase_flexibility')}
            className="flex size-10 items-center justify-center rounded-full border border-primary bg-primary-subtle text-primary-subtle-foreground transition hover:bg-primary-subtle/80"
            onClick={() => setSafe(props.value + 1)}
            type="button"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      {!props.compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {FLEX_PRESETS.map((days) => (
            <button
              className={cn(
                'inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition',
                props.value === days
                  ? 'border-primary bg-primary-subtle text-primary-subtle-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              key={days}
              onClick={() => props.onChange(days)}
              type="button"
            >
              {props.value === days && <Check className="mr-1.5 size-3.5" />}
              {formatFlexibility(days, t('sb_exact_dates'), (value) =>
                t('sb_plus_minus_days', { days: value }),
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeCalendar(props: {
  date: DateRange | undefined;
  onSelect: (date: DateRange | undefined) => void;
  numberOfMonths: 1 | 2;
}) {
  const today = startOfDay(new Date());
  return (
    <div className="rounded-2xl border border-border bg-muted/45 p-3">
      <Calendar
        className="p-0 [--cell-size:2.55rem]"
        classNames={{
          months: cn(
            'relative flex flex-col gap-5',
            props.numberOfMonths === 2 && 'md:flex-row md:gap-6',
          ),
          month: 'flex w-full flex-col gap-4',
          month_caption: 'flex h-10 w-full items-center justify-center px-10',
          caption_label: 'text-base font-semibold text-foreground',
          weekday: 'flex-1 text-xs font-medium text-muted-foreground',
          week: 'mt-2 flex w-full',
          day: 'group/day relative flex h-10 w-10 items-center justify-center p-0 text-center select-none',
        }}
        defaultMonth={props.date?.from ?? addDays(today, 1)}
        disabled={(d) => isBefore(startOfDay(d), today)}
        mode="range"
        numberOfMonths={props.numberOfMonths}
        onSelect={props.onSelect}
        selected={props.date}
      />
    </div>
  );
}

export function RentDatesEditor(props: {
  date: DateRange | undefined;
  flex: number;
  onDateChange: (date: DateRange | undefined) => void;
  onFlexChange: (value: number) => void;
  numberOfMonths?: 1 | 2;
  compactFlex?: boolean;
}) {
  const t = useTranslations('Listings');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DateSummaryCard
          active={Boolean(props.date?.from && !props.date?.to)}
          label={t('move_in')}
          value={formatFullDate(props.date?.from, t('select_date'))}
        />
        <DateSummaryCard
          active={Boolean(props.date?.from && props.date?.to)}
          label={t('move_out')}
          value={formatFullDate(props.date?.to, t('select_date'))}
        />
      </div>
      <FlexibilityControl
        compact={props.compactFlex}
        onChange={props.onFlexChange}
        value={props.flex}
      />
      <RangeCalendar
        date={props.date}
        numberOfMonths={props.numberOfMonths ?? 2}
        onSelect={props.onDateChange}
      />
    </div>
  );
}

export function MarketplaceDateRangePicker() {
  const t = useTranslations('Listings');
  const { get, set } = useListingParams();
  const [open, setOpen] = React.useState(false);

  const startDateStr = get('start_date');
  const endDateStr = get('end_date');
  const flexStr = get('flexibility_days');

  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    const from = parseDateParam(startDateStr);
    const to = parseDateParam(endDateStr);
    return from && to ? { from, to } : undefined;
  });

  const [flex, setFlex] = React.useState<number>(() => {
    if (flexStr) {
      return Number(flexStr);
    }
    return DEFAULT_FLEXIBILITY_DAYS;
  });

  const resetDraftFromUrl = () => {
    const from = parseDateParam(startDateStr);
    const to = parseDateParam(endDateStr);
    setDate(from && to ? { from, to } : undefined);
    setFlex(flexStr ? Number(flexStr) : DEFAULT_FLEXIBILITY_DAYS);
  };

  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);
  };

  const handleApply = () => {
    if (date?.from && date?.to) {
      set({
        start_date: format(date.from, 'yyyy-MM-dd'),
        end_date: format(date.to, 'yyyy-MM-dd'),
        flexibility_days: flex.toString(),
      });
    } else {
      set({
        start_date: undefined,
        end_date: undefined,
        flexibility_days: undefined,
      });
    }
    setOpen(false);
  };

  const handleClear = () => {
    setDate(undefined);
    setFlex(DEFAULT_FLEXIBILITY_DAYS);
    set({
      start_date: undefined,
      end_date: undefined,
      flexibility_days: undefined,
    });
  };

  const currentStart = parseDateParam(startDateStr);
  const currentEnd = parseDateParam(endDateStr);
  const currentFlex = flexStr ? Number(flexStr) : DEFAULT_FLEXIBILITY_DAYS;
  const hasSelection = Boolean(currentStart && currentEnd);
  const dateLabel =
    currentStart && currentEnd
      ? `${format(currentStart, 'MMM d')} – ${format(currentEnd, 'MMM d')} · ${formatFlexibility(currentFlex, t('sb_exact_dates'), (days) => t('sb_plus_minus_days', { days }))}`
      : t('sb_any_dates');
  const fullLabel =
    currentStart && currentEnd
      ? `${format(currentStart, 'd MMM')} – ${format(currentEnd, 'd MMM yyyy')}`
      : t('sb_any_dates');

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          resetDraftFromUrl();
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex flex-1 items-center gap-2.5 rounded-xl px-4 py-2 text-left transition hover:bg-muted',
            hasSelection && 'bg-muted',
          )}
          type="button"
        >
          <CalendarIcon className="size-[18px] shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-medium text-muted-foreground">{t('sb_dates')}</span>
            <span className="truncate text-sm font-medium text-foreground">{dateLabel}</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[min(760px,calc(100vw-2rem))] rounded-3xl p-5">
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/45 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {t('preferred_rent_dates')}
              </p>
              <p className="mt-1 truncate text-lg font-semibold text-foreground">
                {fullLabel}
                {hasSelection && (
                  <span className="text-primary">
                    {' · '}
                    {formatFlexibility(currentFlex, t('sb_exact_dates'), (days) =>
                      t('sb_plus_minus_days', { days }),
                    )}
                  </span>
                )}
              </p>
            </div>
            <Button
              className="h-12 rounded-full px-8"
              disabled={Boolean(date?.from && !date?.to)}
              onClick={handleApply}
            >
              {t('sb_apply')}
            </Button>
          </div>

          <RentDatesEditor
            date={date}
            flex={flex}
            onDateChange={handleSelect}
            onFlexChange={setFlex}
          />

          <div className="flex justify-end">
            <Button className="rounded-full" onClick={handleClear} variant="outline">
              {t('sb_clear')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

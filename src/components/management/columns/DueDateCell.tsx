import { cn } from '@/libs/utils';

/**
 * Short date label ("Jul 25, 2026").
 * @param iso - The ISO date string.
 * @returns The formatted date, or an empty string when unparseable.
 */
function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Whole days from today until an ISO date (negative when past).
 * @param iso - The ISO date string.
 * @returns The day delta, or null when unparseable.
 */
export function daysUntil(iso: string): number | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * A date cell with an overdue-aware subline: paid rows read muted; unpaid rows
 * past due show a danger "N d overdue" line, upcoming ones a muted "in N d".
 * Pairs the danger colour with a text label, never colour alone.
 * @param props - The due date, paid flag, and the localized subline builders.
 * @returns The due-date cell.
 */
export function DueDateCell(props: {
  dueDate: string;
  isPaid?: boolean;
  overdueLabel: (days: number) => string;
  dueInLabel: (days: number) => string;
  paidLabel?: string;
}) {
  const days = daysUntil(props.dueDate);
  const isOverdue = !props.isPaid && days !== null && days < 0;

  let subline: { text: string; danger: boolean } | null = null;
  if (props.isPaid) {
    subline = props.paidLabel ? { text: props.paidLabel, danger: false } : null;
  } else if (days !== null) {
    subline =
      days < 0
        ? { text: props.overdueLabel(-days), danger: true }
        : { text: props.dueInLabel(days), danger: false };
  }

  return (
    <div className="flex flex-col">
      <span className={cn('text-foreground', isOverdue && 'font-medium')}>
        {shortDate(props.dueDate)}
      </span>
      {subline ? (
        <span className={subline.danger ? 'text-xs text-danger' : 'text-xs text-muted-foreground'}>
          {subline.text}
        </span>
      ) : null}
    </div>
  );
}

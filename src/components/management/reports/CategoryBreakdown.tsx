import { ChartLegend } from '@/components/management/charts/ChartLegend';
import { DonutChart } from '@/components/management/charts/DonutChart';
import { ReportCard } from '@/components/management/reports/ReportCard';
import type { PnlBreakdown, PnlBreakdownRow } from '@/types/management';

/** Per-source theme color, so revenue and expense streams read consistently. */
const SOURCE_COLOR = {
  lease: 'var(--color-primary)',
  vas: 'var(--color-accent-brand)',
  payouts: 'var(--color-primary)',
  maintenance: 'var(--color-warning)',
} satisfies Record<string, string>;

function sourceColor(source: string): string {
  if (source in SOURCE_COLOR) {
    // SAFETY: Source key checked against SOURCE_COLOR lookup
    return SOURCE_COLOR[source as keyof typeof SOURCE_COLOR];
  }
  return 'var(--color-muted-foreground)';
}

/**
 * The revenue-by-source donut card — a token-bound donut plus a legend listing
 * each source with its amount and share, per the Figma breakdown.
 * @param props - The rows, card title, center total, and source label resolver.
 * @returns The revenue breakdown card.
 */
function RevenueCard(props: {
  title: string;
  rows: PnlBreakdownRow[];
  centerLabel: string;
  sourceLabel: (source: string) => string;
}) {
  return (
    <ReportCard title={props.title}>
      <div className="flex items-center gap-6">
        <DonutChart
          size={140}
          strokeWidth={20}
          centerLabel={props.centerLabel}
          segments={props.rows.map((r) => ({
            value: Number(r.amount) || 0,
            color: sourceColor(r.source),
          }))}
        />
        <ChartLegend
          direction="col"
          items={props.rows.map((r) => ({
            label: `${props.sourceLabel(r.source)} — $${r.amount} · ${r.share}%`,
            color: sourceColor(r.source),
          }))}
        />
      </div>
    </ReportCard>
  );
}

/**
 * The expenses-by-source card — one segmented horizontal bar per source with a
 * label, amount, share, and a token-bound fill, per the Figma breakdown.
 * @param props - The rows, card title, and source label resolver.
 * @returns The expense breakdown card.
 */
function ExpensesCard(props: {
  title: string;
  rows: PnlBreakdownRow[];
  sourceLabel: (source: string) => string;
}) {
  return (
    <ReportCard title={props.title}>
      <div className="flex flex-col gap-5">
        {props.rows.map((r) => (
          <div key={r.source} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{props.sourceLabel(r.source)}</span>
              <span className="text-foreground tabular-nums">
                ${r.amount} · {r.share}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(Number(r.share) || 0, 100)}%`,
                  backgroundColor: sourceColor(r.source),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ReportCard>
  );
}

/**
 * The P&L category-breakdown section — revenue composition (donut) beside
 * expense composition (segmented bars), per the Figma design. Data-driven off
 * the backend `breakdown` payload.
 * @param props - The breakdown data, titles, revenue center total, and labels.
 * @returns The two-card breakdown row.
 */
export function CategoryBreakdown(props: {
  breakdown: PnlBreakdown;
  revenueTitle: string;
  expensesTitle: string;
  revenueCenter: string;
  sourceLabel: (source: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <RevenueCard
        title={props.revenueTitle}
        rows={props.breakdown.revenue}
        centerLabel={props.revenueCenter}
        sourceLabel={props.sourceLabel}
      />
      <ExpensesCard
        title={props.expensesTitle}
        rows={props.breakdown.expenses}
        sourceLabel={props.sourceLabel}
      />
    </div>
  );
}

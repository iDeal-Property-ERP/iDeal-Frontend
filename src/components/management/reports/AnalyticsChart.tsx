import { ChartLegend } from '@/components/management/charts/ChartLegend';
import type { PnlBarItem } from '@/types/management';

/**
 * The revenue-growth bar chart for the P&L report — actual months as solid
 * `primary` bars followed by projected months as lighter `primary-subtle` bars,
 * matching the Figma "Revenue growth" chart. First/mid/last month axis labels
 * sit under the bars, with an Actual/Projected legend.
 * @param props - The actual and projected series plus translated labels.
 * @returns The analytics chart element.
 */
export function AnalyticsChart(props: {
  actual: PnlBarItem[];
  projected: PnlBarItem[];
  labels: { actual: string; projected: string; projectedSuffix: string };
}) {
  const bars = [
    ...props.actual.map((a) => ({ ...a, projected: false })),
    ...props.projected.map((p) => ({ ...p, projected: true })),
  ];
  const maxVal = Math.max(...bars.map((b) => Number(b.revenue) || 0), 1);
  const lastActual = props.actual.at(-1)?.month;
  const lastProjected = props.projected.at(-1)?.month;
  const firstMonth = bars[0]?.month;

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: props.labels.actual, color: 'var(--color-primary)' },
          { label: props.labels.projected, color: 'var(--color-primary-subtle)' },
        ]}
      />
      <div className="flex items-end gap-2" style={{ height: 160 }}>
        {bars.map((bar) => {
          const value = Number(bar.revenue) || 0;
          return (
            <div
              key={`${bar.month}-${bar.projected ? 'p' : 'a'}`}
              className="flex flex-1 flex-col items-center justify-end"
              style={{ height: '100%' }}
              title={`${bar.month} · ${bar.revenue}`}
            >
              <div
                className="w-full max-w-[26px] rounded-t-[4px]"
                style={{
                  height: `${Math.max((value / maxVal) * 150, 2)}px`,
                  backgroundColor: bar.projected
                    ? 'var(--color-primary-subtle)'
                    : 'var(--color-primary)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{firstMonth}</span>
        <span>{lastActual}</span>
        <span>{lastProjected ? `${lastProjected} ${props.labels.projectedSuffix}` : null}</span>
      </div>
    </div>
  );
}

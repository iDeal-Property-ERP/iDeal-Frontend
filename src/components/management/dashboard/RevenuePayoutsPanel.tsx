import { ChartLegend } from '@/components/management/charts/ChartLegend';
import type { BarGroup } from '@/components/management/charts/GroupedBarChart';
import { GroupedBarChart } from '@/components/management/charts/GroupedBarChart';

/**
 * The "Revenue vs payouts" dashboard card — a titled panel with a two-series
 * legend and a grouped bar chart.
 * @param props - Chart data, title, and legend labels.
 * @returns The revenue-vs-payouts panel.
 */
export function RevenuePayoutsPanel(props: {
  title: string;
  data: BarGroup[];
  revenueLabel: string;
  payoutsLabel: string;
}) {
  return (
    <section className="flex flex-1 flex-col gap-[18px] rounded-[16px] border border-border bg-card p-[22px] shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[18px] leading-[26px] font-semibold text-foreground">{props.title}</h2>
        <ChartLegend
          items={[
            { label: props.revenueLabel, color: 'var(--color-primary)' },
            { label: props.payoutsLabel, color: 'var(--color-accent-brand)' },
          ]}
        />
      </div>
      <GroupedBarChart data={props.data} />
    </section>
  );
}

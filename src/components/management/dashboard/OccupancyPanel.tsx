import { ChartLegend } from '@/components/management/charts/ChartLegend';
import { DonutChart } from '@/components/management/charts/DonutChart';

/**
 * The "Occupancy" dashboard card — a donut with a center percentage and a
 * legend of rented/vacant/maintenance counts.
 * @param props - Title, rate, segment counts, and legend labels.
 * @returns The occupancy panel.
 */
export function OccupancyPanel(props: {
  title: string;
  rate: number;
  rented: number;
  vacant: number;
  maintenance: number;
  rentedLabel: string;
  vacantLabel: string;
  maintenanceLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-[16px] border border-border bg-card p-[22px] shadow-sm lg:w-[340px]">
      <h2 className="text-[18px] leading-[26px] font-semibold text-foreground">{props.title}</h2>
      <div className="flex w-full justify-center py-2">
        <DonutChart
          centerLabel={`${props.rate}%`}
          segments={[
            { value: props.rented, color: 'var(--color-primary)' },
            { value: props.vacant, color: 'var(--color-danger)' },
            { value: props.maintenance, color: 'var(--color-accent-brand)' },
          ]}
        />
      </div>
      <ChartLegend
        direction="col"
        items={[
          {
            label: props.rentedLabel,
            color: 'var(--color-primary)',
            value: String(props.rented),
          },
          {
            label: props.vacantLabel,
            color: 'var(--color-danger)',
            value: String(props.vacant),
          },
          {
            label: props.maintenanceLabel,
            color: 'var(--color-accent-brand)',
            value: String(props.maintenance),
          },
        ]}
      />
    </section>
  );
}

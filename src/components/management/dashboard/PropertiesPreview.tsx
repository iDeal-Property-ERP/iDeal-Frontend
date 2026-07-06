import { Building2 } from 'lucide-react';
import { propertyStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { formatMoney } from '@/components/management/format';
import { Link } from '@/libs/I18nNavigation';
import type { ManagementPropertyOutput } from '@/types/management';

type Labels = {
  title: string;
  viewAll: string;
  property: string;
  district: string;
  status: string;
  rent: string;
  occupancy: string;
  statusLabel: (status: string) => string;
  occupancyText: (row: ManagementPropertyOutput) => string;
};

/**
 * The dashboard "Properties" preview — a compact table card of the first few
 * properties with a "View all" link to the Properties workbench.
 * @param props - The rows and localized labels/formatters.
 * @returns The properties preview panel.
 */
export function PropertiesPreview(props: { rows: ManagementPropertyOutput[]; labels: Labels }) {
  const { labels } = props;
  return (
    <section className="flex-1 overflow-hidden rounded-[16px] border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-[18px]">
        <h2 className="text-[18px] leading-[26px] font-semibold text-foreground">{labels.title}</h2>
        <Link
          href="/management/properties"
          className="text-sm font-medium text-primary hover:underline"
        >
          {labels.viewAll}
        </Link>
      </div>
      <div className="flex items-center gap-3 bg-muted px-5 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        <span className="min-w-0 flex-1">{labels.property}</span>
        <span className="w-[92px] shrink-0">{labels.district}</span>
        <span className="w-[104px] shrink-0">{labels.status}</span>
        <span className="w-[72px] shrink-0 text-right">{labels.rent}</span>
        <span className="hidden w-[104px] shrink-0 sm:block">{labels.occupancy}</span>
      </div>
      <div>
        {props.rows.map((row, index) => (
          <div
            key={row.id}
            className="flex items-center gap-3 px-5 py-3.5"
            style={
              index < props.rows.length - 1
                ? { borderBottom: '1px solid var(--color-border)' }
                : undefined
            }
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary-subtle text-primary-subtle-foreground">
                <Building2 className="size-4" strokeWidth={1.75} />
              </span>
              <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
            </span>
            <span className="w-[92px] shrink-0 truncate text-sm text-muted-foreground">
              {row.district_name}
            </span>
            <span className="w-[104px] shrink-0">
              <StatusPill
                tone={propertyStatusTone(row.status)}
                label={labels.statusLabel(row.status)}
              />
            </span>
            <span className="w-[72px] shrink-0 text-right text-sm font-medium text-foreground tabular-nums">
              {formatMoney(row.tenant_charge_price || row.ask_price)}
            </span>
            <span className="hidden w-[104px] shrink-0 truncate text-sm text-muted-foreground sm:block">
              {labels.occupancyText(row)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

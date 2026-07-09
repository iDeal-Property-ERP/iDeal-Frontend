'use client';

import { serviceTypeIcon } from '@/components/management/services/ServiceCard';
import type { VasPartnerRow } from '@/types/vas';

/**
 * The Partners tab of the Services workbench — one card per catalog partner
 * with its service-type icons, service count, order volume, and 30-day
 * commission.
 * @param props - The partner rows and translated label builders.
 * @returns The partners grid element.
 */
export function PartnersGrid(props: {
  partners: VasPartnerRow[];
  labels: {
    services: (count: number) => string;
    orders: (count: number) => string;
    commission: string;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {props.partners.map((partner) => (
        <div
          key={partner.partner_name}
          className="flex flex-col gap-3 rounded-[16px] border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold text-foreground">
              {partner.partner_name}
            </span>
            <span className="flex items-center gap-1.5">
              {partner.service_types.map((type) => {
                const Icon = serviceTypeIcon(type);
                return (
                  <span
                    key={type}
                    className="flex size-7 items-center justify-center rounded-[8px] bg-muted text-muted-foreground"
                  >
                    <Icon className="size-3.5" />
                  </span>
                );
              })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{props.labels.services(partner.services_count)}</span>
            <span>{props.labels.orders(partner.orders_total)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">{props.labels.commission}</span>
            <span className="text-sm font-semibold text-foreground">${partner.commission_30d}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

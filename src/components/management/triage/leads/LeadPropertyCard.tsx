'use client';

import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { PropertyThumbnail } from '@/components/management/columns/PropertyThumbnail';
import { StatusPill, propertyStatusTone } from '@/components/management/columns/StatusPill';
import { titleCase } from '@/libs/management/format';
import type { ManagementLeadOutput } from '@/types/management';

/**
 * The "requested property" card in the lead detail panel — thumbnail, name,
 * status pill, a specs line (rooms · m² · price), and an "Open" deep link to the
 * property in the Properties workbench.
 * @param props - The lead whose property is shown.
 * @returns The property card element.
 */
export function LeadPropertyCard(props: { lead: ManagementLeadOutput }) {
  const t = useTranslations('Management');
  const { lead } = props;
  const specs = [
    lead.property_rooms ? t('lead_rooms', { count: lead.property_rooms }) : null,
    lead.property_area_sqm ? `${lead.property_area_sqm} m²` : null,
    lead.listing_price ? `$${lead.listing_price}/mo` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {t('lead_requested_property')}
      </span>
      <div className="flex items-center gap-3 rounded-[12px] border border-border bg-background px-3.5 py-3">
        <PropertyThumbnail src={lead.property_photo_url} alt={lead.property_name} size={56} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {lead.property_name}
            </span>
            {lead.property_status ? (
              <StatusPill
                tone={propertyStatusTone(lead.property_status)}
                label={titleCase(lead.property_status)}
              />
            ) : null}
          </div>
          {lead.property_address ? (
            <span className="truncate text-xs text-muted-foreground">
              {lead.property_address}
              {specs ? ` · ${specs}` : ''}
            </span>
          ) : null}
        </div>
        {lead.property_id ? (
          <Link
            href={`/management/properties?id=${lead.property_id}`}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent-brand"
          >
            {t('lead_open')}
            <ArrowUpRight className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

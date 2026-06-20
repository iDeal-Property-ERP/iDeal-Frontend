'use client';

import { useState, useEffect, use } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DetailCard,
  DetailError,
  DetailGrid,
  DetailList,
  DetailLoading,
  DetailRow,
  DetailStat,
  DetailText,
} from '@/components/ui/detail';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { propertyStatusVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PropertyOutput } from '@/types/property';

/**
 * Renders the detail view for a single property with edit and delete actions.
 * @param props - Page props containing the route params.
 * @returns Property detail page.
 */
export default function PropertyDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [property, setProperty] = useState<PropertyOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<PropertyOutput>(`/properties/${params.id}/`)
      .then(setProperty)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch<{ deleted: boolean }>(`/properties/${params.id}/`, { method: 'DELETE' });
      await router.push('/properties');
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return <DetailLoading />;
  }
  if (!property) {
    return <DetailError message="Property not found" />;
  }

  return (
    <>
      <PageHeader
        title={property.name}
        backHref="/properties"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/properties/${params.id}/edit`);
              }}
            >
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      />
      <DetailGrid>
        <DetailCard title="General">
          <DetailList>
            <DetailRow label="Address" value={property.address} />
            <DetailRow
              label="District"
              value={`${property.district.name}, ${property.district.city}`}
            />
            <DetailRow
              label="Owner"
              value={`${property.owner.first_name} ${property.owner.last_name}`}
            />
            <DetailRow
              label="Status"
              value={
                <Badge variant={propertyStatusVariant(property.status)}>{property.status}</Badge>
              }
            />
            <DetailRow label="Score" value={property.score} />
          </DetailList>
        </DetailCard>
        <DetailCard title="Details">
          <DetailList>
            <DetailRow label="Rooms" value={property.rooms} />
            <DetailRow label="Area" value={`${property.area_sqm} m²`} />
            <DetailRow
              label="Floor"
              value={`${property.floor}${property.total_floors ? ` / ${property.total_floors}` : ''}`}
            />
            <DetailRow label="Tariff" value={property.tariff} />
            <DetailRow label="Vacant Days" value={property.vacant_days} />
          </DetailList>
        </DetailCard>
        <DetailCard title="Pricing" className="md:col-span-2">
          <DetailGrid columns={3}>
            <DetailStat
              label="Ask Price"
              value={`${property.ask_price} ${property.ask_currency}`}
            />
            <DetailStat
              label="Owner Guaranteed"
              value={`${property.owner_guaranteed_price} ${property.owner_guaranteed_currency}`}
            />
            <DetailStat
              label="Tenant Charge"
              value={`${property.tenant_charge_price} ${property.tenant_charge_currency}`}
            />
          </DetailGrid>
        </DetailCard>
        {property.description ? (
          <DetailCard title="Description" className="md:col-span-2">
            <DetailText>{property.description}</DetailText>
          </DetailCard>
        ) : null}
      </DetailGrid>
    </>
  );
}

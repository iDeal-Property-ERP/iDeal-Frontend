'use client';

import { useState, useEffect, use } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!property) {
    return <p className="text-sm text-danger">Property not found</p>;
  }

  return (
    <>
      <PageHeader
        title={property.name}
        backHref="/properties"
        actions={
          <div className="flex gap-2">
            <Button
              intent="outline"
              onClick={() => {
                router.push(`/properties/${params.id}/edit`);
              }}
            >
              Edit
            </Button>
            <Button intent="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-6 rounded-lg border border-border bg-card p-6">
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">General</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Address</dt>
              <dd>{property.address}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">District</dt>
              <dd>
                {property.district.name}, {property.district.city}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Owner</dt>
              <dd>
                {property.owner.first_name} {property.owner.last_name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={propertyStatusVariant(property.status)}>{property.status}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Score</dt>
              <dd>{property.score}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Rooms</dt>
              <dd>{property.rooms}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Area</dt>
              <dd>{property.area_sqm} m²</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Floor</dt>
              <dd>
                {property.floor}
                {property.total_floors ? ` / ${property.total_floors}` : ''}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tariff</dt>
              <dd>{property.tariff}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Vacant Days</dt>
              <dd>{property.vacant_days}</dd>
            </div>
          </dl>
        </div>
        <div className="col-span-2">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Pricing</h3>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border border-border p-3">
              <dt className="text-muted-foreground">Ask Price</dt>
              <dd className="mt-1 font-semibold">
                {property.ask_price} {property.ask_currency}
              </dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-muted-foreground">Owner Guaranteed</dt>
              <dd className="mt-1 font-semibold">
                {property.owner_guaranteed_price} {property.owner_guaranteed_currency}
              </dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-muted-foreground">Tenant Charge</dt>
              <dd className="mt-1 font-semibold">
                {property.tenant_charge_price} {property.tenant_charge_currency}
              </dd>
            </div>
          </dl>
        </div>
        {property.description ? (
          <div className="col-span-2">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Description</h3>
            <p className="text-sm text-foreground">{property.description}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

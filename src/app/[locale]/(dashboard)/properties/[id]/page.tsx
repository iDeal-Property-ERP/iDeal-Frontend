'use client';

import { useState, useEffect, use } from 'react';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PropertyOutput } from '@/types/property';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info'> = {
  vacant: 'info',
  rented: 'success',
  maintenance: 'warning',
};

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
    return <p className="text-sm text-neutral-400">Loading...</p>;
  }
  if (!property) {
    return <p className="text-sm text-red-500">Property not found</p>;
  }

  return (
    <>
      <PageHeader
        title={property.name}
        backHref="/properties"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => {
                router.push(`/properties/${params.id}/edit`);
              }}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-6 rounded-lg border border-neutral-200 bg-white p-6">
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-500">General</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Address</dt>
              <dd>{property.address}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">District</dt>
              <dd>
                {property.district.name}, {property.district.city}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Owner</dt>
              <dd>
                {property.owner.first_name} {property.owner.last_name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <Badge variant={STATUS_VARIANT[property.status] ?? 'default'}>
                  {property.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Score</dt>
              <dd>{property.score}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Rooms</dt>
              <dd>{property.rooms}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Area</dt>
              <dd>{property.area_sqm} m\u00B2</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Floor</dt>
              <dd>
                {property.floor}
                {property.total_floors ? ` / ${property.total_floors}` : ''}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Tariff</dt>
              <dd>{property.tariff}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Vacant Days</dt>
              <dd>{property.vacant_days}</dd>
            </div>
          </dl>
        </div>
        <div className="col-span-2">
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Pricing</h3>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border border-neutral-100 p-3">
              <dt className="text-neutral-500">Ask Price</dt>
              <dd className="mt-1 font-semibold">
                {property.ask_price} {property.ask_currency}
              </dd>
            </div>
            <div className="rounded-lg border border-neutral-100 p-3">
              <dt className="text-neutral-500">Owner Guaranteed</dt>
              <dd className="mt-1 font-semibold">
                {property.owner_guaranteed_price} {property.owner_guaranteed_currency}
              </dd>
            </div>
            <div className="rounded-lg border border-neutral-100 p-3">
              <dt className="text-neutral-500">Tenant Charge</dt>
              <dd className="mt-1 font-semibold">
                {property.tenant_charge_price} {property.tenant_charge_currency}
              </dd>
            </div>
          </dl>
        </div>
        {property.description ? (
          <div className="col-span-2">
            <h3 className="mb-2 text-sm font-medium text-neutral-500">Description</h3>
            <p className="text-sm text-neutral-700">{property.description}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

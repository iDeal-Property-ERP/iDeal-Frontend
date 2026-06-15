'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { apiFetch } from '@/libs/api';
import { propertyStatusVariant } from '@/libs/badges';
import { Link } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { ManagementPropertyOutput } from '@/types/management';

const TARIFF_VARIANT: Record<string, 'default' | 'info' | 'warning'> = {
  standard: 'default',
  comfort: 'info',
  premium: 'warning',
};

const STATUSES = ['', 'vacant', 'rented', 'maintenance'];
const TARIFFS = ['', 'standard', 'comfort', 'premium'];

/**
 * Management properties page — lists all properties with filtering.
 * @returns The management properties page component.
 */
export default function ManagementPropertiesPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementPropertyOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [tariffFilter, setTariffFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page };
    if (search) {
      query.search = search;
    }
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (districtFilter) {
      query.district = districtFilter;
    }
    if (tariffFilter) {
      query.tariff = tariffFilter;
    }

    apiFetch<PaginatedData<ManagementPropertyOutput>>('/management/properties/', { query })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load properties');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, search, statusFilter, districtFilter, tariffFilter]);

  if (error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger-subtle p-4 text-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('properties')} description={t('properties_desc')} />

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (prop: ManagementPropertyOutput) => (
              <Link
                href={`/properties/${prop.id}`}
                className="font-medium text-primary hover:text-primary/80"
              >
                {prop.name}
              </Link>
            ),
          },
          { key: 'address', header: 'Address' },
          { key: 'district_name', header: 'District' },
          { key: 'rooms', header: 'Rooms' },
          {
            key: 'area_sqm',
            header: 'Area',
            render: (prop: ManagementPropertyOutput) => `${prop.area_sqm} m²`,
          },
          {
            key: 'status',
            header: 'Status',
            render: (prop: ManagementPropertyOutput) => (
              <Badge variant={propertyStatusVariant(prop.status)}>{prop.status}</Badge>
            ),
          },
          {
            key: 'tariff',
            header: 'Tariff',
            render: (prop: ManagementPropertyOutput) => (
              <Badge variant={TARIFF_VARIANT[prop.tariff]}>{prop.tariff}</Badge>
            ),
          },
          {
            key: 'ask_price',
            header: 'Price',
            render: (prop: ManagementPropertyOutput) => `${prop.ask_price} ${prop.ask_currency}`,
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No properties found"
        keyExtractor={(item) => item.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Input
              type="text"
              placeholder="Search by name or address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="sm:w-64"
            />
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || 'All statuses'}
                </option>
              ))}
            </Select>
            <Select
              value={tariffFilter}
              onChange={(e) => {
                setTariffFilter(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            >
              {TARIFFS.map((tariff) => (
                <option key={tariff} value={tariff}>
                  {tariff || 'All tariffs'}
                </option>
              ))}
            </Select>
            <Input
              type="text"
              placeholder="District..."
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setPage(1);
              }}
              className="sm:w-40"
            />
          </div>
        }
      />
    </div>
  );
}

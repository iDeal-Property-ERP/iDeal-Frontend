'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const columns: ColumnDef<ManagementPropertyOutput>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={`/properties/${row.original.id}`}
        className="font-medium text-primary hover:text-primary/80"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: 'address', header: 'Address' },
  { accessorKey: 'district_name', header: 'District' },
  { accessorKey: 'rooms', header: 'Rooms' },
  {
    accessorKey: 'area_sqm',
    header: 'Area',
    cell: ({ row }) => `${row.original.area_sqm} m²`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={propertyStatusVariant(row.original.status)}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: 'tariff',
    header: 'Tariff',
    cell: ({ row }) => (
      <Badge variant={TARIFF_VARIANT[row.original.tariff]}>{row.original.tariff}</Badge>
    ),
  },
  {
    accessorKey: 'ask_price',
    header: 'Price',
    cell: ({ row }) => `${row.original.ask_price} ${row.original.ask_currency}`,
  },
];

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
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('properties')} description={t('properties_desc')} />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No properties found"
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
              value={statusFilter || 'all'}
              onValueChange={(v) => {
                setStatusFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-auto min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.filter(Boolean).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={tariffFilter || 'all'}
              onValueChange={(v) => {
                setTariffFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-auto min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tariffs</SelectItem>
                {TARIFFS.filter(Boolean).map((tariff) => (
                  <SelectItem key={tariff} value={tariff}>
                    {tariff}
                  </SelectItem>
                ))}
              </SelectContent>
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

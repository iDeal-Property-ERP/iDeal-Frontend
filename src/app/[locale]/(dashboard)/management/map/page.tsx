'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { MapFilterBar } from '@/components/management/map/MapFilterBar';
import type { MapFilterChip } from '@/components/management/map/MapFilterBar';
import { MapLegend } from '@/components/management/map/MapLegend';
import type { MapLegendItem } from '@/components/management/map/MapLegend';
import { MapPopup } from '@/components/management/map/MapPopup';
import type { MapPopupLabels } from '@/components/management/map/MapPopup';
import { PortfolioMap } from '@/components/management/map/PortfolioMap';
import { MapMobileView } from '@/components/management/mobile/MapMobileView';
import { PropertyRecordPanel } from '@/components/management/record-panel/PropertyRecordPanel';
import { ErrorState } from '@/components/management/states/ErrorState';
import { useIsMobile } from '@/hooks/use-mobile';
import { listMapProperties } from '@/libs/management/mapAdapter';
import { bulkChangeStatus, getDistricts } from '@/libs/management/propertiesAdapter';
import type { DistrictOption } from '@/libs/management/propertiesAdapter';
import type { ManagementPropertyMapRow } from '@/types/management';

const STATUSES = ['rented', 'vacant', 'maintenance', 'pending_review'];
const ROOMS = ['1', '2', '3', '4', '5'];
const PRICE_BANDS: Record<string, { min?: number; max?: number }> = {
  '0-400': { max: 400 },
  '400-700': { min: 400, max: 700 },
  '700-1000': { min: 700, max: 1000 },
  '1000+': { min: 1000 },
};
const STATUS_LEGEND_COLOR: Record<string, string> = {
  rented: 'var(--color-success)',
  vacant: 'var(--color-warning)',
  maintenance: 'var(--color-danger)',
  pending_review: 'var(--color-muted-foreground)',
};

export default function PortfolioMapPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();

  const [properties, setProperties] = useState<ManagementPropertyMapRow[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [recordProperty, setRecordProperty] = useState<ManagementPropertyMapRow | null>(null);

  const statusLabel = (value: string): string => {
    const normalized = value.toLowerCase();
    if (/rent|active|occupied/u.test(normalized)) {
      return t('status_rented');
    }
    if (/maintenance|repair/u.test(normalized)) {
      return t('status_maintenance');
    }
    if (/pending|review/u.test(normalized)) {
      return t('status_pending');
    }
    if (/vacant|available/u.test(normalized)) {
      return t('status_vacant');
    }
    return value.replaceAll('_', ' ');
  };
  const tariffLabel = (value: string): string =>
    value === 'standard' || value === 'comfort' || value === 'premium'
      ? t(`tariff_${value}` as never)
      : value;

  useEffect(() => {
    getDistricts()
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    let active = true;
    const band = price ? PRICE_BANDS[price] : undefined;
    setError(null);
    listMapProperties({
      search: search || undefined,
      status: status ?? undefined,
      districtId: districtId ?? undefined,
      rooms: rooms ?? undefined,
      priceMin: band?.min,
      priceMax: band?.max,
    })
      .then((rows) => {
        if (active) {
          setProperties(rows);
        }
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : t('map_error'));
        }
      });
    return () => {
      active = false;
    };
  }, [search, status, districtId, rooms, price, t]);

  const selected = useMemo(
    () => properties.find((p) => p.id === selectedId) ?? null,
    [properties, selectedId],
  );

  const legend: MapLegendItem[] = STATUSES.map((s) => ({
    status: s,
    label: statusLabel(s),
    count: properties.filter((p) => p.status === s).length,
    color: STATUS_LEGEND_COLOR[s] ?? 'var(--color-muted-foreground)',
  }));

  const chips: MapFilterChip[] = [
    {
      id: 'status',
      label: t('map_filter_status'),
      value: status,
      options: STATUSES.map((s) => ({ value: s, label: statusLabel(s) })),
      onChange: setStatus,
    },
    {
      id: 'district',
      label: t('map_filter_district'),
      value: districtId,
      options: districts.map((d) => ({ value: String(d.id), label: d.name })),
      onChange: setDistrictId,
    },
    {
      id: 'rooms',
      label: t('map_filter_rooms'),
      value: rooms,
      options: ROOMS.map((r) => ({ value: r, label: t('map_rooms_count', { count: Number(r) }) })),
      onChange: setRooms,
    },
    {
      id: 'price',
      label: t('map_filter_price'),
      value: price,
      options: Object.keys(PRICE_BANDS).map((band) => ({ value: band, label: band })),
      onChange: setPrice,
    },
  ];

  const popupLabels: MapPopupLabels = {
    meta: (row) =>
      t('map_popup_meta', {
        district: row.district_name ?? '—',
        rooms: row.rooms ?? 0,
        area: row.area_sqm ?? 0,
        floor: row.floor ?? 0,
      }),
    status: statusLabel,
    price: (row) => t('map_popup_price', { price: row.tenant_charge_price ?? '0' }),
    tenantLine: (row) =>
      row.tenant_name
        ? t('map_popup_tenant', { name: row.tenant_name, date: row.lease_end_date ?? '—' })
        : t('map_popup_vacant', { days: row.vacant_days ?? 0 }),
    openRecord: t('map_open_record'),
    close: t('map_close'),
  };

  const changeStatus = (nextStatus: string) => {
    if (!recordProperty) {
      return;
    }
    const { id } = recordProperty;
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)));
    setRecordProperty((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    bulkChangeStatus([id], nextStatus).catch(() => {
      // Optimistic; a failed write reconciles on the next filter change/refetch.
    });
  };

  const header = (
    <ManagementPageHeader
      title={t('nav_portfolio_map')}
      subtitle={t('map_subtitle', {
        count: properties.length,
        rented: properties.filter((p) => p.status === 'rented').length,
        vacant: properties.filter((p) => p.status === 'vacant').length,
      })}
      showBell={false}
    />
  );

  const recordPanel = (
    <PropertyRecordPanel
      property={recordProperty}
      open={Boolean(recordProperty)}
      onClose={() => setRecordProperty(null)}
      onChangeStatus={changeStatus}
      statusLabel={statusLabel}
      tariffLabel={tariffLabel}
    />
  );

  if (error) {
    return (
      <ErrorState
        title={t('map_error')}
        message={error}
        onRetry={() => setSearch((s) => s)}
        retryLabel={t('retry')}
      />
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <MapFilterBar
          search={{ value: search, onChange: setSearch }}
          chips={chips}
          labels={{
            searchPlaceholder: t('map_search'),
            searchAria: t('map_search'),
            clear: t('map_clear'),
          }}
        />
        <MapMobileView
          properties={properties}
          legend={legend}
          selected={selected}
          onMarkerClick={setSelectedId}
          onOpenRecord={() => {
            if (selected) {
              setRecordProperty(selected);
              setSelectedId(null);
            }
          }}
          onClosePopup={() => setSelectedId(null)}
          popupLabels={popupLabels}
        />
        {recordPanel}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {header}
        <MapFilterBar
          search={{ value: search, onChange: setSearch }}
          chips={chips}
          labels={{
            searchPlaceholder: t('map_search'),
            searchAria: t('map_search'),
            clear: t('map_clear'),
          }}
        />
        <div className="relative">
          <PortfolioMap
            properties={properties}
            onMarkerClick={setSelectedId}
            className="h-[calc(100vh-16rem)] w-full"
          />
          <MapLegend items={legend} className="absolute bottom-4 left-4 z-10" />
          <MapPopup
            property={selected}
            labels={popupLabels}
            onOpenRecord={() => {
              if (selected) {
                setRecordProperty(selected);
                setSelectedId(null);
              }
            }}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>
      {recordPanel}
    </>
  );
}

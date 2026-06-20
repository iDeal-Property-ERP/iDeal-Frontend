'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { Env } from '@/libs/Env';
import type { PortfolioMapOutput } from '@/types/management';

function fCurrency(amount: string): string {
  const n = Number.parseFloat(amount);
  if (Number.isNaN(n)) {
    return `$${amount}`;
  }
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Map search page — renders available listings on a Yandex map.
 * @returns Map search page.
 */
export default function MapSearchPage() {
  const t = useTranslations('Pages');
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initMap = useCallback(async () => {
    try {
      const data = await apiFetch<PortfolioMapOutput>('/marketplace/listings/map/');
      const { ymaps } = window;
      if (!ymaps) {
        setError('Failed to load map data');
        setIsLoading(false);
        return;
      }

      ymaps.ready(() => {
        if (!mapRef.current) {
          return;
        }
        const map = new ymaps.Map(mapRef.current, {
          center: [41.2995, 69.2401],
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl'],
        });
        if (data.features.length === 0) {
          setIsLoading(false);
          return;
        }
        const clusterer = new ymaps.Clusterer({
          preset: 'islands#greenClusterIcons',
          clusterDisableClickZoom: true,
        });
        const placemarks = data.features.map((feature) => {
          const coords = feature.geometry.coordinates;
          const lat = coords[1] ?? 41.2995;
          const lng = coords[0] ?? 69.2401;
          const p = feature.properties;
          return new ymaps.Placemark(
            [lat, lng],
            {
              balloonContentHeader: `<b>${p.name}</b>`,
              balloonContentBody: `<div>${p.address}</div><div style="margin-top:6px;font-weight:700;color:#14b8a6">${fCurrency(p.price)}</div>`,
            },
            { preset: 'islands#greenIcon' },
          );
        });
        clusterer.add(placemarks);
        map.geoObjects.add(clusterer);
        setIsLoading(false);
      });
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load map data');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY === '') {
      setError(
        'Yandex Maps API key is not configured. Set NEXT_PUBLIC_YANDEX_MAPS_API_KEY in .env',
      );
      setIsLoading(false);
      return;
    }
    if (document.querySelector('#yandex-maps-script')) {
      initMap();
      return;
    }
    window.handleMapReady = () => {
      initMap();
    };
    const script = document.createElement('script');
    script.id = 'yandex-maps-script';
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${Env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=en_US&onload=handleMapReady`;
    script.async = true;
    document.head.append(script);
  }, [initMap]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('map_search')} description={t('map_search_desc')} />
      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="flex h-96 items-center justify-center rounded-lg border border-border bg-card">
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      )}
      <div
        ref={mapRef}
        className={`h-[500px] w-full overflow-hidden rounded-lg border border-border bg-muted ${isLoading ? 'hidden' : ''}`}
      />
    </div>
  );
}

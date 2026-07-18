'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Env } from '@/libs/Env';
import { formatPrice } from '@/libs/marketplace';
import { cn } from '@/libs/utils';
import { bboxFromBounds, loadYmaps, TASHKENT, YANDEX_LANG } from '@/libs/yandexMaps';
import type { MapPoint } from '@/types/marketplace';

const DEFAULT_ZOOM = 11;
const SELECTED_ZOOM = 14;

function balloonHtml(point: MapPoint, locale: string, viewLabel: string): string {
  const href = `/${locale}/listings/${point.id}`;
  const price = formatPrice(point.price, point.currency);
  const image = point.image_url
    ? `<img src="${point.image_url}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px" />`
    : '';
  return `
    <div style="max-width:220px">
      ${image}
      <div style="font-weight:600;margin-bottom:2px">${point.name}</div>
      <div style="color:var(--muted-foreground);font-size:12px;margin-bottom:6px">${point.address}</div>
      <div style="font-weight:700;margin-bottom:8px">${price}</div>
      <a href="${href}" style="color:var(--primary);font-size:13px;font-weight:600;text-decoration:none">${viewLabel} →</a>
    </div>`;
}

type YandexMapProps = {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  selectedId?: number | null;
  onMarkerClick?: (id: number) => void;
  onBoundsChange?: (bbox: string) => void;
  className?: string;
};

/**
 * Interactive Yandex map rendering brand price-pin markers with balloon cards. Supports
 * card↔pin selection sync and reports the visible bounds for "search this area". Dark mode is
 * applied via a CSS tile filter (see `.ymap` rules in global.css) since JS API v2.1 has no native
 * dark scheme. Falls back to a friendly panel when no API key is configured.
 * @param props - Map points, optional center/zoom, selection state, and callbacks.
 * @returns The map container or a fallback panel.
 */
export function YandexMap(props: YandexMapProps) {
  const { points, selectedId, className } = props;
  const center = props.center ?? TASHKENT;
  const zoom = props.zoom ?? DEFAULT_ZOOM;
  const locale = useLocale();
  const t = useTranslations('Map');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YmapsMap | null>(null);
  const clustererRef = useRef<YmapsClusterer | null>(null);
  const pointsByIdRef = useRef<Map<number, MapPoint>>(new Map());
  const onMarkerClickRef = useRef(props.onMarkerClick);
  const onBoundsChangeRef = useRef(props.onBoundsChange);

  useEffect(() => {
    onMarkerClickRef.current = props.onMarkerClick;
  }, [props.onMarkerClick]);

  useEffect(() => {
    onBoundsChangeRef.current = props.onBoundsChange;
  }, [props.onBoundsChange]);

  const apiKey = Env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  function renderPoints(ymaps: Ymaps) {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    let clusterer = clustererRef.current;
    if (clusterer) {
      clusterer.removeAll();
    } else {
      // Count bubbles when zoomed out, single brand-blue pins when zoomed in.
      clusterer = new ymaps.Clusterer({ preset: 'islands#blueClusterIcons' });
      clustererRef.current = clusterer;
      map.geoObjects.add(clusterer);
    }
    pointsByIdRef.current = new Map();

    const placemarks = points.map((point) => {
      pointsByIdRef.current.set(point.id, point);
      const placemark = new ymaps.Placemark(
        [point.lat, point.lon],
        {
          balloonContent: balloonHtml(point, locale, t('view_details')),
          hintContent: point.name,
        },
        { preset: 'islands#blueIcon' },
      );
      placemark.events.add('click', () => onMarkerClickRef.current?.(point.id));
      return placemark;
    });
    clusterer.add(placemarks);

    if (points.length > 1) {
      const lats = points.map((p) => p.lat);
      const lons = points.map((p) => p.lon);
      map.setBounds(
        [
          [Math.min(...lats), Math.min(...lons)],
          [Math.max(...lats), Math.max(...lons)],
        ],
        { checkZoomRange: true, zoomMargin: 48 },
      );
    }
  }

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;
    if (apiKey && containerRef.current) {
      const lang = YANDEX_LANG[locale] ?? 'en_US';
      loadYmaps(apiKey, lang)
        .then((ymaps) => {
          if (cancelled || !containerRef.current || mapRef.current) {
            return;
          }
          const map = new ymaps.Map(
            containerRef.current,
            { center, zoom, controls: ['zoomControl', 'geolocationControl'] },
            { suppressMapOpenBlock: true },
          );
          mapRef.current = map;
          map.events.add('boundschange', () => {
            const bbox = bboxFromBounds(map.getBounds());
            if (bbox) {
              onBoundsChangeRef.current?.(bbox);
            }
          });
          renderPoints(ymaps);
        })
        .catch(() => {
          // Network/key failure: the fallback styling stays visible.
        });
    }
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      clustererRef.current = null;
    };
    // Map is created once; point/selection updates are handled by the effects below.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, locale]);

  // Rebuild markers when the points change.
  useEffect(() => {
    if (window.ymaps && mapRef.current) {
      renderPoints(window.ymaps);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // Pan to + open the balloon for the externally selected point (card hover/click sync).
  useEffect(() => {
    const map = mapRef.current;
    if (!(map && selectedId)) {
      return;
    }
    const point = pointsByIdRef.current.get(selectedId);
    if (point) {
      map.setCenter([point.lat, point.lon], Math.max(zoom, SELECTED_ZOOM), { duration: 300 });
      map.balloon.open([point.lat, point.lon], balloonHtml(point, locale, t('view_details')));
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (!apiKey) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center',
          className,
        )}
      >
        <p className="text-sm font-medium text-foreground">{t('unavailable_title')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('unavailable_desc')}</p>
      </div>
    );
  }

  return <div className={cn('ymap overflow-hidden rounded-xl', className)} ref={containerRef} />;
}

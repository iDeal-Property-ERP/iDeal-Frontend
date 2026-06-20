'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Env } from '@/libs/Env';
import { formatPrice } from '@/libs/marketplace';
import { cn } from '@/libs/utils';
import type { MapPoint } from '@/types/marketplace';

const TASHKENT: [number, number] = [41.3111, 69.2797];
const DEFAULT_ZOOM = 11;
const SELECTED_ZOOM = 14;

const YANDEX_LANG: Record<string, string> = {
  en: 'en_US',
  ru: 'ru_RU',
  uz: 'ru_RU', // Yandex Maps has no Uzbek locale; fall back to Russian.
};

let loaderPromise: Promise<Ymaps> | null = null;

async function loadYmaps(apiKey: string, lang: string): Promise<Ymaps> {
  if (typeof window === 'undefined') {
    throw new TypeError('Yandex Maps can only load in the browser');
  }
  if (loaderPromise) {
    return await loaderPromise;
  }
  // oxlint-disable-next-line promise/avoid-new
  loaderPromise = new Promise<Ymaps>((resolve, reject) => {
    const onReady = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => resolve(window.ymaps!));
      } else {
        reject(new Error('Yandex Maps failed to initialize'));
      }
    };
    const onError = () => reject(new Error('Failed to load Yandex Maps script'));

    if (window.ymaps) {
      onReady();
      return;
    }

    const existing = document.querySelector('#yandex-maps-script');
    if (existing) {
      existing.addEventListener('load', onReady);
      existing.addEventListener('error', onError);
      return;
    }

    const script = document.createElement('script');
    script.id = 'yandex-maps-script';
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=${lang}`;
    script.async = true;
    script.addEventListener('load', onReady);
    script.addEventListener('error', onError);
    document.head.append(script);
  });
  return await loaderPromise;
}

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
      <div style="color:#6b7280;font-size:12px;margin-bottom:6px">${point.address}</div>
      <div style="font-weight:700;margin-bottom:8px">${price}</div>
      <a href="${href}" style="color:#4f46e5;font-size:13px;font-weight:500;text-decoration:none">${viewLabel} →</a>
    </div>`;
}

type YandexMapProps = {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  selectedId?: number | null;
  onMarkerClick?: (id: number) => void;
  className?: string;
};

/**
 * Interactive Yandex map rendering clustered property markers with balloon cards.
 * Falls back to a friendly panel when no API key is configured.
 * @param props - Map points, optional center/zoom, selection state, and click handler.
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
  onMarkerClickRef.current = props.onMarkerClick;

  const apiKey = Env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  function renderPoints(ymaps: Ymaps) {
    const clusterer = clustererRef.current;
    const map = mapRef.current;
    if (!(clusterer && map)) {
      return;
    }
    clusterer.removeAll();
    pointsByIdRef.current = new Map();
    const placemarks = points.map((point) => {
      pointsByIdRef.current.set(point.id, point);
      const placemark = new ymaps.Placemark(
        [point.lat, point.lon],
        { balloonContent: balloonHtml(point, locale, t('view_details')), hintContent: point.name },
        { preset: 'islands#violetDotIcon' },
      );
      placemark.events.add('click', () => onMarkerClickRef.current?.(point.id));
      return placemark;
    });
    clusterer.add(placemarks);
    const bounds = clusterer.getBounds();
    if (bounds && points.length > 1) {
      map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
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
          const clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcon',
            groupByCoordinates: false,
            clusterDisableClickZoom: false,
          });
          map.geoObjects.add(clusterer);
          mapRef.current = map;
          clustererRef.current = clusterer;
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
        clustererRef.current = null;
      }
    };
    // Map is created once; point updates are handled by the effect below.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, locale]);

  // Rebuild markers when the points change.
  useEffect(() => {
    if (window.ymaps && mapRef.current && clustererRef.current) {
      renderPoints(window.ymaps);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // Pan to and open a balloon for the externally selected point.
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

  return <div className={cn('overflow-hidden rounded-xl', className)} ref={containerRef} />;
}

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Env } from '@/libs/Env';
import { cn } from '@/libs/utils';
import { getYandexLang, loadYmaps, TASHKENT } from '@/libs/yandexMaps';
import type { ManagementPropertyMapRow } from '@/types/management';

const DEFAULT_ZOOM = 11;

/** Property status → the CSS custom property whose hex feeds the pin colour. */
const STATUS_TOKEN = {
  rented: '--success',
  vacant: '--warning',
  maintenance: '--danger',
  pending_review: '--muted-foreground',
} satisfies Record<string, string>;

export type ResolvedPinColors = {
  byStatus: Record<string, string>;
  cluster: string;
};

/**
 * Resolves a status → hex pin colour from the live CSS tokens, so pins stay
 * theme-correct (light/dark). Resolved at mount; a theme toggle while mounted
 * keeps the mount-time colours (documented limitation — the page remounts the
 * map on locale change, and theme changes are rare mid-session).
 * @returns A status → hex colour map plus the primary (cluster) colour.
 */
function resolvePinColors(): ResolvedPinColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (token: string) => styles.getPropertyValue(token).trim() || '#586377';
  const byStatus: Record<string, string> = {};
  for (const [status, token] of Object.entries(STATUS_TOKEN)) {
    byStatus[status] = read(token);
  }
  return { byStatus, cluster: read('--primary') };
}

/**
 * The portfolio map canvas — a Yandex map with a status-coloured circle pin per
 * geocoded property and a clusterer for dense areas, per the Figma design. Pin
 * colours are token-bound (resolved from CSS custom properties). Marker clicks
 * bubble to the page, which owns the popup and record panel. Falls back to a
 * friendly panel when no API key is configured.
 * @param props - The properties, marker-click handler, and optional class.
 * @returns The map container or a fallback panel.
 */
export function PortfolioMap(props: {
  properties: ManagementPropertyMapRow[];
  onMarkerClick: (id: number) => void;
  className?: string;
}) {
  const { properties } = props;
  const locale = useLocale();
  const t = useTranslations('Map');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YmapsMap | null>(null);
  const clustererRef = useRef<YmapsClusterer | null>(null);
  const onMarkerClickRef = useRef(props.onMarkerClick);

  useEffect(() => {
    onMarkerClickRef.current = props.onMarkerClick;
  }, [props.onMarkerClick]);

  const apiKey = Env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  function renderPins(ymaps: Ymaps) {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const colors = resolvePinColors();
    let clusterer = clustererRef.current;
    if (clusterer) {
      clusterer.removeAll();
    } else {
      clusterer = new ymaps.Clusterer({
        preset: 'islands#blueClusterIcons',
        clusterIconColor: colors.cluster,
      });
      clustererRef.current = clusterer;
      map.geoObjects.add(clusterer);
    }

    const geocoded = properties.filter((p) => p.map_lat !== null && p.map_lon !== null);
    const placemarks = geocoded.map((p) => {
      const placemark = new ymaps.Placemark(
        [Number(p.map_lat), Number(p.map_lon)],
        { hintContent: p.name },
        {
          preset: 'islands#circleIcon',
          iconColor: colors.byStatus[p.status] ?? colors.cluster,
        },
      );
      placemark.events.add('click', () => onMarkerClickRef.current(p.id));
      return placemark;
    });
    clusterer.add(placemarks);

    if (geocoded.length > 1) {
      const lats = geocoded.map((p) => Number(p.map_lat));
      const lons = geocoded.map((p) => Number(p.map_lon));
      map.setBounds(
        [
          [Math.min(...lats), Math.min(...lons)],
          [Math.max(...lats), Math.max(...lons)],
        ],
        { checkZoomRange: true, zoomMargin: 56 },
      );
    }
  }

  // Create the map once per locale.
  useEffect(() => {
    let cancelled = false;
    if (apiKey && containerRef.current) {
      const lang = getYandexLang(locale);
      loadYmaps(apiKey, lang)
        .then((ymaps) => {
          if (cancelled || !containerRef.current || mapRef.current) {
            return;
          }
          mapRef.current = new ymaps.Map(
            containerRef.current,
            { center: TASHKENT, zoom: DEFAULT_ZOOM, controls: ['zoomControl'] },
            { suppressMapOpenBlock: true },
          );
          renderPins(ymaps);
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, locale]);

  // Rebuild pins when the filtered property set changes.
  useEffect(() => {
    if (window.ymaps && mapRef.current) {
      renderPins(window.ymaps);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  if (!apiKey) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-muted/40 p-8 text-center',
          props.className,
        )}
      >
        <p className="text-sm font-medium text-foreground">{t('unavailable_title')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('unavailable_desc')}</p>
      </div>
    );
  }

  return (
    <div
      className={cn('ymap overflow-hidden rounded-[16px]', props.className)}
      ref={containerRef}
    />
  );
}

'use client';

import { Map as MapIcon, Maximize2, Search } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { Control } from 'react-hook-form';
import { useController, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Env } from '@/libs/Env';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import { cn } from '@/libs/utils';
import { getYandexLang, loadYmaps, TASHKENT } from '@/libs/yandexMaps';

type Translator = ReturnType<typeof useTranslations>;

type PropertyMapCardProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
};

type MapPickerCanvasProps = {
  apiKey: string;
  className: string;
  coordinates: [number, number] | null;
  locale: string;
  onPick: (coordinates: [number, number]) => void;
  onSearchComplete?: (found: boolean) => void;
  searchRequest?: { id: number; query: string };
};

const PICKER_ZOOM = 14;

/**
 * Converts two stored form values into a valid Yandex coordinate pair.
 * @param latitude - The latitude form value.
 * @param longitude - The longitude form value.
 * @returns A latitude/longitude pair, or null when either value is invalid.
 */
function toCoordinates(
  latitude: string | undefined,
  longitude: string | undefined,
): [number, number] | null {
  if (!latitude?.trim() || !longitude?.trim()) {
    return null;
  }
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }
  return [lat, lon];
}

/**
 * Displays a click-to-place Yandex map, keeping its pin synchronized with the
 * parent form coordinates.
 * @param props - Map configuration, selected coordinates, and pick callback.
 * @returns The map canvas.
 */
function MapPickerCanvas(props: MapPickerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YmapsMap | null>(null);
  const renderPinRef = useRef<((coordinates: [number, number], recenter: boolean) => void) | null>(
    null,
  );
  const coordinatesRef = useRef<[number, number] | null>(null);
  const onPickRef = useRef(props.onPick);
  const onSearchCompleteRef = useRef(props.onSearchComplete);
  const coordinatesKey = props.coordinates?.join(',') ?? '';

  // The scalar key avoids redrawing the map when unrelated form fields change.
  useEffect(() => {
    coordinatesRef.current = props.coordinates;
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinatesKey]);

  useEffect(() => {
    onPickRef.current = props.onPick;
  }, [props.onPick]);

  useEffect(() => {
    onSearchCompleteRef.current = props.onSearchComplete;
  }, [props.onSearchComplete]);

  useEffect(() => {
    let cancelled = false;
    const lang = getYandexLang(props.locale);
    void loadYmaps(props.apiKey, lang)
      .then((ymaps) => {
        if (cancelled || !containerRef.current || mapRef.current) {
          return;
        }
        const map = new ymaps.Map(
          containerRef.current,
          {
            center: coordinatesRef.current ?? TASHKENT,
            zoom: coordinatesRef.current ? PICKER_ZOOM : 11,
            controls: ['zoomControl'],
          },
          { suppressMapOpenBlock: true },
        );
        mapRef.current = map;
        const renderPin = (coordinates: [number, number], recenter: boolean) => {
          map.geoObjects.removeAll();
          map.geoObjects.add(
            new ymaps.Placemark(coordinates, {}, { preset: 'islands#blueDotIcon' }),
          );
          if (recenter) {
            map.setCenter(coordinates, PICKER_ZOOM, { duration: 200 });
          }
        };
        renderPinRef.current = renderPin;
        if (coordinatesRef.current) {
          renderPin(coordinatesRef.current, false);
        }
        map.events.add('click', (event) => {
          const rawCoordinates = event.get('coords');
          if (
            !Array.isArray(rawCoordinates) ||
            !Number.isFinite(rawCoordinates[0]) ||
            !Number.isFinite(rawCoordinates[1])
          ) {
            return;
          }
          onPickRef.current([Number(rawCoordinates[0]), Number(rawCoordinates[1])]);
        });
      })
      .catch(() => {
        // The card renders a clear unavailable state when the API key is absent.
      });
    return () => {
      cancelled = true;
      renderPinRef.current = null;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [props.apiKey, props.locale]);

  useEffect(() => {
    let cancelled = false;
    if (props.searchRequest) {
      const lang = getYandexLang(props.locale);
      void loadYmaps(props.apiKey, lang)
        .then((ymaps) => ymaps.geocode(props.searchRequest!.query))
        .then((result) => {
          if (cancelled) {
            return;
          }
          const found = result.geoObjects.get(0)?.geometry.getCoordinates();
          if (!Array.isArray(found) || !Number.isFinite(found[0]) || !Number.isFinite(found[1])) {
            onSearchCompleteRef.current?.(false);
            return;
          }
          onPickRef.current([Number(found[0]), Number(found[1])]);
          onSearchCompleteRef.current?.(true);
        })
        .catch(() => {
          if (!cancelled) {
            onSearchCompleteRef.current?.(false);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [props.apiKey, props.locale, props.searchRequest]);

  useEffect(() => {
    if (props.coordinates) {
      renderPinRef.current?.(props.coordinates, true);
    }
    // Recenter only when the actual selected coordinates change.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinatesKey]);

  return (
    <div
      className={cn('ymap overflow-hidden rounded-[12px] bg-muted', props.className)}
      ref={containerRef}
    />
  );
}

/**
 * Renders the property location picker. The map is the sole coordinate control:
 * click to place the pin, or expand it for a roomier view.
 * @param props - Form control and translator.
 * @returns The map card.
 */
export function PropertyMapCard(props: PropertyMapCardProps) {
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRequest, setSearchRequest] = useState<{ id: number; query: string } | undefined>();
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'not_found'>('idle');
  const latitude = useWatch({ control: props.control, name: 'map_lat' });
  const longitude = useWatch({ control: props.control, name: 'map_lon' });
  const latitudeField = useController({ control: props.control, name: 'map_lat' }).field;
  const longitudeField = useController({ control: props.control, name: 'map_lon' }).field;
  const apiKey = Env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  const coordinates = toCoordinates(latitude, longitude);

  const handlePick = (picked: [number, number]) => {
    latitudeField.onChange(picked[0].toFixed(6));
    longitudeField.onChange(picked[1].toFixed(6));
  };

  const handleMapSearch = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      return;
    }
    setSearchStatus('searching');
    setSearchRequest({ id: Date.now(), query });
  };

  const handleSearchComplete = (found: boolean) => {
    setSearchStatus(found ? 'idle' : 'not_found');
  };

  return (
    <div className="rounded-[16px] border border-border bg-card p-5 shadow-sm">
      {apiKey ? (
        <div className="relative">
          <MapPickerCanvas
            apiKey={apiKey}
            className="h-48"
            coordinates={coordinates}
            locale={locale}
            onPick={handlePick}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-3 right-3 shadow-sm"
            onClick={() => setExpanded(true)}
          >
            <Maximize2 />
            <span className="sr-only">{props.t('form_map_expand')}</span>
          </Button>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
          <MapIcon className="size-6" />
        </div>
      )}
      <p className={cn('mt-2 text-sm text-muted-foreground', !apiKey && 'text-danger')}>
        {props.t(apiKey ? 'form_map_hint' : 'form_map_unavailable')}
      </p>
      {apiKey ? (
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="w-[min(960px,calc(100%-2rem))] max-w-none p-4 sm:max-w-none">
            <DialogHeader>
              <DialogTitle>{props.t('form_map_title')}</DialogTitle>
            </DialogHeader>
            <form className="flex gap-2" onSubmit={handleMapSearch}>
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchStatus('idle');
                }}
                placeholder={props.t('form_map_search_placeholder')}
              />
              <Button type="submit" disabled={searchStatus === 'searching'}>
                <Search />
                {props.t('form_map_search')}
              </Button>
            </form>
            {searchStatus === 'not_found' ? (
              <p className="text-sm text-muted-foreground">{props.t('form_map_search_empty')}</p>
            ) : null}
            <MapPickerCanvas
              apiKey={apiKey}
              className="h-[min(70vh,640px)]"
              coordinates={coordinates}
              locale={locale}
              onPick={handlePick}
              onSearchComplete={handleSearchComplete}
              searchRequest={searchRequest}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

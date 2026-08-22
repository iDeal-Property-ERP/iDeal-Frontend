/**
 * Shared Yandex Maps loader — a single script-injection singleton reused by both
 * the marketplace `YandexMap` and the management `PortfolioMap`, so the JS API
 * v2.1 script is only ever loaded once per page. Do not fork this loader.
 */

/** Tashkent centre, the default map view across the product. */
export const TASHKENT: [number, number] = [41.3111, 69.2797];

/** Yandex Maps has no Uzbek locale; `uz` falls back to Russian. */
export const YANDEX_LANG = {
  en: 'en_US',
  ru: 'ru_RU',
  uz: 'ru_RU',
} satisfies Record<string, string>;

/**
 * Resolves Yandex Maps language code for an application locale.
 * @param locale - The application locale string.
 * @returns The corresponding Yandex language code.
 */
export function getYandexLang(locale: string): string {
  if (locale in YANDEX_LANG) {
    // SAFETY: Locale key verified to exist in YANDEX_LANG lookup table
    return YANDEX_LANG[locale as keyof typeof YANDEX_LANG];
  }
  return 'en_US';
}

let loaderPromise: Promise<Ymaps> | null = null;

/**
 * Loads the Yandex Maps JS API v2.1 and resolves once `ymaps.ready`. Memoized:
 * concurrent and subsequent callers share one script tag and one promise.
 * @param apiKey - The Yandex Maps API key.
 * @param lang - The Yandex locale (e.g. `en_US`, `ru_RU`).
 * @returns The ready `ymaps` global.
 */
export async function loadYmaps(apiKey: string, lang: string): Promise<Ymaps> {
  if (!globalThis.window) {
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

/**
 * Converts Yandex map bounds to a `bbox` query string.
 * @param bounds - Yandex bounds `[[minLat, minLon], [maxLat, maxLon]]`.
 * @returns `"minLon,minLat,maxLon,maxLat"`, or null when bounds are incomplete.
 */
export function bboxFromBounds(bounds: number[][]): string | null {
  if (!bounds || bounds.length < 2) {
    return null;
  }
  const [sw, ne] = bounds;
  if (!sw || !ne) {
    return null;
  }
  const [minLat, minLon] = sw;
  const [maxLat, maxLon] = ne;
  if ([minLat, minLon, maxLat, maxLon].some((v) => v === undefined)) {
    return null;
  }
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

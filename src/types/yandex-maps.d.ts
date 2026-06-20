// Ambient typings for the subset of the Yandex Maps JS API (v2.1) used across the app.

type YmapsEvent = {
  get: (key: string) => unknown;
};

type YmapsEventManager = {
  add: (type: string, handler: (event: YmapsEvent) => void) => void;
};

type YmapsBalloon = {
  open: (coords?: number[], content?: string | Record<string, unknown>) => void;
  close: () => void;
};

type YmapsGeoObject = {
  events: YmapsEventManager;
  balloon: YmapsBalloon;
};

type YmapsPlacemark = YmapsGeoObject;

type YmapsClusterer = {
  add: (objects: unknown[]) => void;
  removeAll: () => void;
  events: YmapsEventManager;
  getBounds: () => number[][] | null;
};

type YmapsMap = {
  geoObjects: {
    add: (object: unknown) => void;
    removeAll: () => void;
  };
  balloon: YmapsBalloon;
  setBounds: (bounds: number[][], options?: Record<string, unknown>) => void;
  setCenter: (coords: number[], zoom?: number, options?: Record<string, unknown>) => void;
  destroy: () => void;
};

type Ymaps = {
  ready: (callback: () => void) => void;
  Map: new (
    element: HTMLElement | string,
    state: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YmapsMap;
  Placemark: new (
    coords: number[],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YmapsPlacemark;
  Clusterer: new (options?: Record<string, unknown>) => YmapsClusterer;
};

// oxlint-disable-next-line typescript/consistent-type-definitions
interface Window {
  ymaps?: Ymaps;
  handleMapReady?: () => void;
}

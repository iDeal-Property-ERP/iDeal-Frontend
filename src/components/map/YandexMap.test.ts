import { describe, expect, it } from 'vitest';
import type { MapPoint } from '@/types/marketplace';
import { balloonHtml } from './YandexMap';

function point(overrides: Partial<MapPoint> = {}): MapPoint {
  return {
    id: 42,
    lat: 41.3,
    lon: 69.2,
    name: 'Loft',
    address: 'Navoi 1',
    price: '1000',
    currency: 'USD',
    image_url: null,
    ...overrides,
  };
}

describe(balloonHtml, () => {
  it('escapes a malicious name in balloon markup', () => {
    const html = balloonHtml(point({ name: '<img src=x onerror=alert(1)>' }), 'en', 'View');

    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes a malicious address in balloon markup', () => {
    const html = balloonHtml(point({ address: '</div><script>alert(1)</script>' }), 'en', 'View');

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;/div&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes a malicious image url in balloon markup', () => {
    const html = balloonHtml(point({ image_url: '" onerror="alert(1)' }), 'en', 'View');

    expect(html).not.toContain('" onerror="alert(1)');
    expect(html).toContain('&quot; onerror=&quot;alert(1)');
  });

  it('escapes a malicious href in balloon markup', () => {
    const html = balloonHtml(point(), '"><img src=x onerror=alert(1)>', 'View');

    expect(html).not.toContain('href="/"><img src=x onerror=alert(1)>/listings/42"');
    expect(html).toContain('href="/&quot;&gt;&lt;img src=x onerror=alert(1)&gt;/listings/42"');
  });
});

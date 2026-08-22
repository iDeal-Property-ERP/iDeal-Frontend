import { describe, expect, it } from 'vitest';
import { selectPaymentReturnLocale } from './PaymentReturnLocale';

describe('payment return locale selection', () => {
  it('selects a supported regional language', () => {
    expect(selectPaymentReturnLocale('ru-RU,ru;q=0.9,en;q=0.8')).toBe('ru');
  });

  it('respects quality preferences', () => {
    expect(selectPaymentReturnLocale('en;q=0.5,uz-UZ;q=0.9')).toBe('uz');
  });

  it('falls back to English for unsupported languages', () => {
    expect(selectPaymentReturnLocale('fr-FR,fr;q=0.9')).toBe('en');
    expect(selectPaymentReturnLocale(null)).toBe('en');
  });
});

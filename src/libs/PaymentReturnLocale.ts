const PAYMENT_RETURN_LOCALES = ['en', 'uz', 'ru'] as const;

export type PaymentReturnLocale = (typeof PAYMENT_RETURN_LOCALES)[number];

function isPaymentReturnLocale(language: string): language is PaymentReturnLocale {
  return PAYMENT_RETURN_LOCALES.some((locale) => locale === language);
}

type LanguagePreference = {
  index: number;
  language: string;
  quality: number;
};

/**
 * Selects a supported locale from an HTTP Accept-Language header.
 * @param acceptLanguage - The raw Accept-Language header, if present.
 * @returns The best supported locale, falling back to English.
 */
export function selectPaymentReturnLocale(acceptLanguage: string | null): PaymentReturnLocale {
  if (!acceptLanguage) {
    return 'en';
  }

  const preferences: LanguagePreference[] = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [rawLanguage = '', ...parameters] = part.trim().split(';');
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='));
      const parsedQuality = Number.parseFloat(qualityParameter?.trim().slice(2) ?? '1');

      return {
        index,
        language: rawLanguage.toLowerCase().split('-')[0] ?? '',
        quality: Number.isFinite(parsedQuality) ? parsedQuality : 0,
      };
    })
    .toSorted((left, right) => right.quality - left.quality || left.index - right.index);

  for (const preference of preferences) {
    if (preference.quality > 0 && isPaymentReturnLocale(preference.language)) {
      return preference.language;
    }
  }

  return 'en';
}

import type { LocalePrefixMode } from 'next-intl/routing';

const localePrefix: LocalePrefixMode = 'as-needed';

export const AppConfig = {
  name: 'iDeal',
  i18n: {
    locales: ['en', 'uz', 'ru'],
    defaultLocale: 'en',
    localePrefix,
  },
};

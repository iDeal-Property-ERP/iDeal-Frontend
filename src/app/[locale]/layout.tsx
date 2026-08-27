import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Bricolage_Grotesque } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routing } from '@/libs/I18nRouting';
import { logger } from '@/libs/Logger';
import '@/styles/global.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  logger.info(`Locale set to ${locale}`);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${bricolage.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if (new URLSearchParams(window.location.search).get('embedded') === 'true') { document.documentElement.classList.add('is-embedded'); }`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>
            <TooltipProvider>{props.children}</TooltipProvider>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

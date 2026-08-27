'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';

function ThemeSync() {
  const searchParams = useSearchParams();
  const { setTheme } = useTheme();

  useEffect(() => {
    const themeParam = searchParams.get('theme');
    if (themeParam === 'light' || themeParam === 'dark') {
      setTheme(themeParam);
    }
  }, [searchParams, setTheme]);

  return null;
}

export function ThemeProvider(props: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <Suspense fallback={null}>
        <ThemeSync />
      </Suspense>
      {props.children}
    </NextThemesProvider>
  );
}

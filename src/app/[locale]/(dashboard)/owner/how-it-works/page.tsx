'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { OwnerWhyOutput } from '@/types/owner';

/**
 * How-it-works page for owners, sourced from the backend value proposition.
 * @returns How it works page element.
 */
export default function HowItWorksPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [why, setWhy] = useState<OwnerWhyOutput | null>(null);

  useEffect(() => {
    apiFetch<OwnerWhyOutput>('/owner/why/')
      .then(setWhy)
      .catch(() => {
        void 0;
      });
  }, []);

  return (
    <>
      <PageHeader
        title={t('how_it_works')}
        description={t('how_it_works_desc')}
        backHref="/owner"
      />
      {why ? (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-2 text-xl font-semibold text-foreground">{why.title}</h2>
            <p className="text-sm text-muted-foreground">{why.description}</p>
          </div>
          <ul className="space-y-3">
            {why.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="text-sm text-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => {
              router.push('/owner/onboarding');
            }}
          >
            {t('submit_property')}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
    </>
  );
}

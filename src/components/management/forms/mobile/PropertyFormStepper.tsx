'use client';

import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { Control } from 'react-hook-form';
import { useFormState } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import type { UsePropertyPhotosResult } from '@/hooks/management/usePropertyPhotos';
import { useRouter } from '@/libs/I18nNavigation';
import type { DistrictOption } from '@/libs/management/propertiesAdapter';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import { cn } from '@/libs/utils';
import { OneOffBrokerageCard } from '../OneOffBrokerageCard';
import { PropertyBasicsCard } from '../PropertyBasicsCard';
import { PropertyOwnerCard } from '../PropertyOwnerCard';
import { PropertyPhotosCard } from '../PropertyPhotosCard';
import { PropertyPricingCard } from '../PropertyPricingCard';

type Translator = ReturnType<typeof useTranslations>;

type PropertyFormStepperProps = {
  t: Translator;
  control: Control<ManagementPropertyFormData>;
  districts: DistrictOption[];
  photos: UsePropertyPhotosResult;
  mode: 'create' | 'edit';
  engagement: 'managed' | 'one_off';
  brokerageLocked?: boolean;
  askPriceLocked?: boolean;
  submitting: boolean;
  onPrimary: () => void;
  /** Set by the parent on a failed publish to jump to the first invalid step. */
  errorStep?: number | null;
};

const STEP_COUNT = 3;

/** The form fields owned by each stepper step (for the per-step error hint). */
const STEP_FIELDS: (keyof ManagementPropertyFormData)[][] = [
  ['name', 'address', 'district_id', 'rooms', 'area_sqm', 'floor', 'total_floors', 'owner_id'],
  ['ask_price', 'owner_guaranteed_price', 'tenant_charge_price'],
  [],
];

/**
 * The mobile 3-step property stepper (Basics + Owner → Pricing → Photos), full-screen
 * with progress segments and a sticky Next / submit bar. Photos are camera-first.
 * On a failed publish the parent passes `errorStep` to jump to the first bad step.
 * @param props - Translator, form control, districts, photos hook, mode, submit, errorStep.
 * @returns The mobile stepper.
 */
export function PropertyFormStepper(props: PropertyFormStepperProps) {
  const {
    t,
    control,
    districts,
    photos,
    mode,
    engagement,
    brokerageLocked,
    askPriceLocked,
    submitting,
    onPrimary,
    errorStep,
  } = props;
  const oneOff = engagement === 'one_off';
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { errors } = useFormState({ control });

  // Jump to the first invalid step when the parent flags a failed publish.
  const lastErrorStep = useRef<number | null>(null);
  useEffect(() => {
    if (errorStep !== null && errorStep !== undefined && errorStep !== lastErrorStep.current) {
      lastErrorStep.current = errorStep;
      setStep(errorStep);
    }
  }, [errorStep]);

  const stepLabels = [t('form_basics'), t('form_pricing'), t('form_photos')];
  const isLast = step === STEP_COUNT - 1;
  const primaryLabel = mode === 'edit' ? t('form_save_changes') : t('form_save_publish');
  const nextLabel = isLast
    ? primaryLabel
    : t('form_step_next', { label: stepLabels[step + 1] ?? '' });
  const stepHasError = (STEP_FIELDS[step] ?? []).some((field) => Boolean(errors[field]));

  const back = () => {
    if (step === 0) {
      router.push('/management/properties');
    } else {
      setStep((current) => current - 1);
    }
  };

  const next = () => {
    if (step < STEP_COUNT - 1) {
      setStep((current) => current + 1);
    } else {
      onPrimary();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          aria-label={t('back')}
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <p className="font-display text-lg font-bold text-foreground">{t('form_new_title')}</p>
          <p className="text-xs text-muted-foreground">
            {t('form_step', {
              current: step + 1,
              total: STEP_COUNT,
              label: stepLabels[step] ?? '',
            })}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <span
            key={`seg-${index}`}
            className={cn('h-1 flex-1 rounded-full', index <= step ? 'bg-primary' : 'bg-border')}
          />
        ))}
      </div>

      {stepHasError ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="size-4" />
          {t('form_step_has_errors')}
        </p>
      ) : null}

      <div className="mt-5 flex flex-1 flex-col gap-5">
        {step === 0 ? (
          <>
            <PropertyBasicsCard control={control} t={t} districts={districts} />
            {!oneOff ? (
              <PropertyOwnerCard control={control} t={t} />
            ) : (
              <OneOffBrokerageCard control={control} t={t} disabled={brokerageLocked} />
            )}
          </>
        ) : null}
        {step === 1 ? (
          <PropertyPricingCard
            control={control}
            t={t}
            engagement={engagement}
            askPriceLocked={askPriceLocked}
          />
        ) : null}
        {step === 2 ? <PropertyPhotosCard t={t} photos={photos} capture /> : null}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 py-3 backdrop-blur">
        <Button onClick={next} disabled={submitting} className="h-12 w-full gap-2 text-base">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

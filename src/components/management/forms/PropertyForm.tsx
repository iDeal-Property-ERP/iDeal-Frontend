'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { usePropertyDraft } from '@/hooks/management/usePropertyDraft';
import { usePropertyPhotos } from '@/hooks/management/usePropertyPhotos';
import { usePublishChecklist } from '@/hooks/management/usePublishChecklist';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from '@/libs/I18nNavigation';
import { getDistricts, publishProperty, updateProperty } from '@/libs/management/propertiesAdapter';
import type { DistrictOption, PropertyDraftPayload } from '@/libs/management/propertiesAdapter';
import {
  managementPropertyDraftSchema,
  managementPropertyPublishSchema,
} from '@/libs/schemas/managementProperty';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import type { PropertyDetail } from '@/types/property';
import { DraftSavedChip } from './DraftSavedChip';
import { PropertyFormStepper } from './mobile/PropertyFormStepper';
import { PropertyBasicsCard } from './PropertyBasicsCard';
import { PropertyFormFooter } from './PropertyFormFooter';
import { PropertyFormShell } from './PropertyFormShell';
import { PropertyMapCard } from './PropertyMapCard';
import { PropertyOwnerCard } from './PropertyOwnerCard';
import { PropertyPhotosCard } from './PropertyPhotosCard';
import { PropertyPricingCard } from './PropertyPricingCard';
import { PublishChecklist } from './PublishChecklist';
import { ScheduleVerificationSheet } from './ScheduleVerificationSheet';

type Translator = ReturnType<typeof useTranslations>;

type PropertyFormProps = {
  mode: 'create' | 'edit';
  initial?: PropertyDetail;
};

/**
 * Stringifies a nullable number for a form field (undefined when absent).
 * @param value - The numeric value or null.
 * @returns The string form, or undefined.
 */
function numToStr(value: number | null | undefined): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}

/**
 * Maps a loaded property into initial form values (all string-shaped).
 * @param property - The loaded property detail.
 * @returns The react-hook-form default values.
 */
function toFormValues(property: PropertyDetail): ManagementPropertyFormData {
  return {
    name: property.name,
    address: property.address,
    district_id: numToStr(property.district?.id ?? null),
    owner_id: property.owner?.id ?? null,
    rooms: numToStr(property.rooms),
    area_sqm: numToStr(property.area_sqm),
    floor: numToStr(property.floor),
    total_floors: numToStr(property.total_floors),
    tariff: property.tariff,
    ask_price: property.ask_price ?? undefined,
    owner_guaranteed_price: property.owner_guaranteed_price ?? undefined,
    tenant_charge_price: property.tenant_charge_price ?? undefined,
    description: property.description ?? undefined,
    map_lat: property.map_lat ?? undefined,
    map_lon: property.map_lon ?? undefined,
  };
}

/**
 * Strips empty/null values into a clean backend payload (the backend coerces
 * numeric strings).
 * @param values - The raw form values.
 * @returns The compact payload.
 */
function toPayload(values: ManagementPropertyFormData): PropertyDraftPayload {
  const payload: PropertyDraftPayload = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '' && value !== null) {
      payload[key] = value;
    }
  }
  return payload;
}

/**
 * Maps a form field path to its publish-checklist code (district_id → district,
 * owner_id → owner, else itself).
 * @param path - The form field path.
 * @returns The checklist code.
 */
function codeForPath(path: string): string {
  if (path === 'district_id') {
    return 'district';
  }
  if (path === 'owner_id') {
    return 'owner';
  }
  return path;
}

const PRICING_CODES = new Set(['ask_price', 'owner_guaranteed_price', 'tenant_charge_price']);

/**
 * Maps a missing field/checklist code to the mobile stepper step that owns it
 * (0 Basics+Owner · 1 Pricing · 2 Photos).
 * @param code - The missing field code.
 * @returns The stepper step index.
 */
function stepForCode(code: string): number {
  if (PRICING_CODES.has(code)) {
    return 1;
  }
  if (code === 'photos') {
    return 2;
  }
  return 0;
}

/**
 * Chooses the footer note based on validation state and mode.
 * @param t - The translator.
 * @param attentionCount - Number of fields flagged.
 * @param mode - The form mode.
 * @returns The localized note string.
 */
function footerNote(t: Translator, attentionCount: number, mode: 'create' | 'edit'): string {
  if (attentionCount > 0) {
    return t('form_needs_attention', { count: attentionCount });
  }
  return mode === 'edit' ? t('form_edit_note') : t('form_publish_note');
}

/**
 * The management property Create/Edit form. Desktop renders the two-column shell
 * (Basics/Pricing/Photos + checklist/owner/map rail); mobile renders the 3-step
 * camera-first stepper. Create autosaves a draft and publishes with verification;
 * edit patches immediately.
 * @param props - The mode and (for edit) the loaded property.
 * @returns The property form.
 */
export function PropertyForm(props: PropertyFormProps) {
  const { mode, initial } = props;
  const t = useTranslations('Management');
  const router = useRouter();
  const isMobile = useIsMobile();

  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [serverMissing, setServerMissing] = useState<Set<string>>(new Set());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorStep, setErrorStep] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(managementPropertyDraftSchema),
    defaultValues: initial ? toFormValues(initial) : { tariff: 'standard' },
  });

  const draft = usePropertyDraft(mode === 'edit' ? initial?.id : undefined);
  const propertyId = draft.draftId ?? initial?.id ?? null;

  const photos = usePropertyPhotos(propertyId, initial?.photos ?? [], {
    uploadError: t('form_photo_error'),
    needsDraft: t('form_photo_needs_draft'),
  });

  const values = form.watch();
  const checklist = usePublishChecklist({
    values,
    photoCount: photos.photos.length,
    verificationScheduled: mode === 'edit' ? Boolean(initial?.verification) : false,
    serverMissing,
  });

  // District options for the Basics select.
  useEffect(() => {
    let active = true;
    const load = async () => {
      const next = await getDistricts();
      if (active) {
        setDistricts(next);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  // Autosave (create only): debounce a draft PATCH whenever the form changes.
  const serialized = JSON.stringify(values);
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (mode !== 'create' || !form.formState.isDirty) {
      return;
    }
    dirtyRef.current = true;
    draft.schedule(toPayload(values));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, mode]);

  const saveDraftAndLeave = async () => {
    if (mode === 'create' && dirtyRef.current) {
      await draft.flush(toPayload(form.getValues()));
    }
    router.push('/management/properties');
  };

  const showPublishErrors = (): boolean => {
    const parsed = managementPropertyPublishSchema.safeParse(form.getValues());
    if (parsed.success) {
      return false;
    }
    const missing = new Set<string>();
    for (const issue of parsed.error.issues) {
      const path = String(issue.path[0]);
      form.setError(path as keyof ManagementPropertyFormData, {
        type: 'publish',
        message: issue.message,
      });
      missing.add(codeForPath(path));
    }
    setServerMissing(missing);
    setErrorStep(missing.size ? Math.min(...[...missing].map(stepForCode)) : 0);
    const first = String(parsed.error.issues[0]?.path[0] ?? 'name');
    form.setFocus(first as keyof ManagementPropertyFormData);
    return true;
  };

  const runPublish = async (scheduledForIso?: string) => {
    if (showPublishErrors()) {
      setScheduleOpen(false);
      return;
    }
    setPublishing(true);
    try {
      const id = await draft.flush(toPayload(form.getValues()));
      if (id === null) {
        toast.error(t('form_publish_failed'));
        return;
      }
      const result = await publishProperty(id, scheduledForIso);
      if (result.ok) {
        toast.success(t('form_published'));
        router.push('/management/properties');
      } else {
        setServerMissing(new Set(result.missing));
        setErrorStep(result.missing.length ? Math.min(...result.missing.map(stepForCode)) : 0);
        toast.error(t('form_publish_incomplete'));
      }
    } catch {
      toast.error(t('form_publish_failed'));
    } finally {
      setPublishing(false);
      setScheduleOpen(false);
    }
  };

  const saveEdit = async () => {
    if (!initial) {
      return;
    }
    setPublishing(true);
    try {
      await updateProperty(initial.id, toPayload(form.getValues()));
      toast.success(t('form_saved'));
      router.push('/management/properties');
    } catch {
      toast.error(t('form_publish_failed'));
    } finally {
      setPublishing(false);
    }
  };

  const onPrimary = () => {
    if (mode === 'edit') {
      void saveEdit();
    } else {
      setScheduleOpen(true);
    }
  };

  const attentionCount = useMemo(
    () => Object.keys(form.formState.errors).length,
    [form.formState.errors],
  );

  const ownerLabel = initial?.owner
    ? `${initial.owner.first_name} ${initial.owner.last_name}`.trim()
    : undefined;
  const title = mode === 'edit' ? t('form_edit_title') : t('form_new_title');
  const secondCrumb = mode === 'edit' ? (initial?.name ?? title) : t('form_new_title');

  const body = isMobile ? (
    <PropertyFormStepper
      t={t}
      control={form.control}
      districts={districts}
      photos={photos}
      mode={mode}
      submitting={publishing}
      onPrimary={onPrimary}
      errorStep={errorStep}
    />
  ) : (
    <PropertyFormShell
      backHref="/management/properties"
      breadcrumb={
        <span>
          {t('properties')} / {secondCrumb}
        </span>
      }
      title={title}
      headerAside={
        mode === 'create' ? (
          <DraftSavedChip
            state={draft.state}
            labels={{ saving: t('draft_saving'), saved: t('draft_saved'), error: t('draft_error') }}
          />
        ) : null
      }
      rail={
        <>
          {mode === 'create' ? <PublishChecklist rows={checklist.rows} t={t} /> : null}
          <PropertyOwnerCard control={form.control} t={t} initialLabel={ownerLabel} />
          <PropertyMapCard control={form.control} t={t} />
        </>
      }
      footer={
        <PropertyFormFooter
          t={t}
          mode={mode}
          note={footerNote(t, attentionCount, mode)}
          submitting={publishing}
          onCancel={() => router.push('/management/properties')}
          onSaveDraft={() => void saveDraftAndLeave()}
          onPrimary={onPrimary}
        />
      }
    >
      <PropertyBasicsCard control={form.control} t={t} districts={districts} />
      <PropertyPricingCard control={form.control} t={t} />
      <PropertyPhotosCard t={t} photos={photos} />
    </PropertyFormShell>
  );

  return (
    <Form {...form}>
      {body}
      <ScheduleVerificationSheet
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        t={t}
        submitting={publishing}
        onConfirm={(iso) => void runPublish(iso)}
      />
    </Form>
  );
}

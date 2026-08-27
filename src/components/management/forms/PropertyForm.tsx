'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CircleDollarSign, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { toast } from 'sonner';
import { DangerConfirmDialog } from '@/components/management/dialogs/DangerConfirmDialog';
import { Form } from '@/components/ui/form';
import { usePropertyPhotos } from '@/hooks/management/usePropertyPhotos';
import type { UsePropertyPhotosResult } from '@/hooks/management/usePropertyPhotos';
import { usePublishChecklist } from '@/hooks/management/usePublishChecklist';
import type { ChecklistRow } from '@/hooks/management/usePublishChecklist';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from '@/libs/I18nNavigation';
import {
  getDistricts,
  submitProperty,
  updateOneOffProperty,
  updateProperty,
} from '@/libs/management/propertiesAdapter';
import type {
  DistrictOption,
  OneOffPropertyDraftPayload,
  PropertyDraftPayload,
  PropertySubmissionPayload,
} from '@/libs/management/propertiesAdapter';
import {
  managementOneOffActivateSchema,
  managementPropertyDraftSchema,
  managementPropertyPublishSchema,
} from '@/libs/schemas/managementProperty';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import type { PropertyDetail, PropertyPhoto, PropertyTranslationMap } from '@/types/property';
import { PropertyFormStepper } from './mobile/PropertyFormStepper';
import { OneOffBrokerageCard } from './OneOffBrokerageCard';
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
  initialEngagement?: 'managed' | 'one_off';
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
/**
 * Extracts one-off deal fields from a property into form values.
 * @param deal - The one-off deal object or null.
 * @returns The form values for deal fields.
 */
function toDealValues(deal: PropertyDetail['one_off_deal']): Partial<ManagementPropertyFormData> {
  if (!deal) {
    return {};
  }
  return {
    seller_name: deal.seller_name ?? undefined,
    seller_phone: deal.seller_phone ?? undefined,
    seller_email: deal.seller_email ?? undefined,
    channel: deal.channel ?? undefined,
    commission_type: deal.commission_type ?? undefined,
    commission_fixed_amount: deal.commission_fixed_amount ?? undefined,
    commission_percentage: deal.commission_percentage ?? undefined,
    commission_currency: deal.commission_currency ?? undefined,
  };
}

/**
 * Extracts a single locale entry from form translations.
 * @param translations - Form translation object.
 * @param lang - Target language.
 * @param fallbackName - Fallback name.
 * @param fallbackDesc - Fallback description.
 * @returns The translation item.
 */
function getTranslationItem(
  translations: ManagementPropertyFormData['translations'],
  lang: 'en' | 'uz' | 'ru',
  fallbackName?: string | null,
  fallbackDesc?: string | null,
) {
  const entry = translations?.[lang];
  return {
    name: entry?.name ?? fallbackName ?? null,
    description: entry?.description ?? fallbackDesc ?? null,
  };
}

/**
 * Maps loaded translations into initial form translation map.
 * @param property - Loaded property.
 * @returns The initial translation values.
 */
function toFormTranslations(property: PropertyDetail): ManagementPropertyFormData['translations'] {
  return {
    en: {
      name: property.translations?.en?.name ?? property.name,
      description: property.translations?.en?.description ?? property.description ?? '',
    },
    uz: {
      name: property.translations?.uz?.name ?? '',
      description: property.translations?.uz?.description ?? '',
    },
    ru: {
      name: property.translations?.ru?.name ?? '',
      description: property.translations?.ru?.description ?? '',
    },
  };
}

/**
 * Extracts normalized multilingual translation map from form values.
 * @param values - Form values.
 * @returns The translation map payload.
 */
function toTranslationPayload(values: ManagementPropertyFormData): PropertyTranslationMap {
  return {
    en: getTranslationItem(values.translations, 'en', values.name, values.description),
    uz: getTranslationItem(values.translations, 'uz'),
    ru: getTranslationItem(values.translations, 'ru'),
  };
}

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
    engagement_type: property.engagement_type,
    translations: toFormTranslations(property),
    ...toDealValues(property.one_off_deal),
  };
}

const EXCLUDED_DRAFT_KEYS = new Set([
  'engagement_type',
  'seller_name',
  'seller_phone',
  'seller_email',
  'channel',
  'commission_type',
  'commission_fixed_amount',
  'commission_percentage',
  'commission_currency',
  'translations',
]);

/**
 * Strips empty/null values into a clean backend payload (the backend coerces
 * numeric strings).
 * @param values - The raw form values.
 * @returns The compact payload.
 */
function toPayload(values: ManagementPropertyFormData): PropertyDraftPayload {
  const payload: PropertyDraftPayload = {};
  for (const [key, value] of Object.entries(values)) {
    if (!EXCLUDED_DRAFT_KEYS.has(key) && value !== undefined && value !== '' && value !== null) {
      payload[key] = value;
    }
  }
  if (values.translations || values.name || values.description) {
    payload.translations = toTranslationPayload(values);
  }
  return payload;
}

function toOneOffPayload(values: ManagementPropertyFormData): OneOffPropertyDraftPayload {
  return {
    ...toPayload(values),
    brokerage: {
      seller_name: values.seller_name,
      seller_phone: values.seller_phone,
      seller_email: values.seller_email,
      channel: values.channel,
      commission_type: values.commission_type,
      commission_fixed_amount: values.commission_fixed_amount,
      commission_percentage: values.commission_percentage,
      commission_currency: values.commission_currency,
    },
  };
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

function toBrokeragePayload(values: ManagementPropertyFormData) {
  return {
    seller_name: values.seller_name ?? '',
    seller_phone: values.seller_phone ?? '',
    seller_email: values.seller_email ?? undefined,
    // SAFETY: channel/commission_type/currency are validated enum strings from the form
    channel: values.channel ?? 'marketplace',
    // SAFETY: Form validation ensures commission_type matches allowed types
    commission_type: values.commission_type ?? 'none',
    commission_fixed_amount: values.commission_fixed_amount ?? undefined,
    commission_percentage: values.commission_percentage ?? undefined,
    // SAFETY: Form validation ensures currency is USD or UZS
    commission_currency: values.commission_currency ?? 'USD',
  };
}

function toSubmissionPayload(
  values: ManagementPropertyFormData,
  oneOff: boolean,
  photos: PropertyPhoto[],
  scheduledForIso?: string,
): PropertySubmissionPayload {
  const payload: PropertySubmissionPayload = {
    engagement_type: oneOff ? 'one_off' : 'managed',
    name: values.name ?? undefined,
    address: values.address ?? undefined,
    district_id: Number(values.district_id),
    property_type: 'apartment',
    rooms: Number(values.rooms),
    area_sqm: Number(values.area_sqm),
    floor: Number(values.floor),
    total_floors: values.total_floors ? Number(values.total_floors) : undefined,
    furnishing: 'unfurnished',
    owner_id: values.owner_id ?? undefined,
    description: values.description ?? undefined,
    tariff: values.tariff ?? 'standard',
    map_lat: values.map_lat ? Number(values.map_lat) : undefined,
    map_lon: values.map_lon ? Number(values.map_lon) : undefined,
    ask_price: values.ask_price ?? '0.00',
    ask_currency: values.ask_currency ?? 'USD',
    owner_guaranteed_price: values.owner_guaranteed_price ?? undefined,
    owner_guaranteed_currency: values.owner_guaranteed_currency ?? undefined,
    tenant_charge_price: values.tenant_charge_price ?? undefined,
    captions: photos.map((p) => p.caption ?? ''),
    schedule_verification_at: scheduledForIso,
    translations: toTranslationPayload(values),
  };
  if (oneOff) {
    payload.brokerage = toBrokeragePayload(values);
  }
  return payload;
}

function isClosedOneOff(initial?: PropertyDetail): boolean {
  return (
    initial?.engagement_type === 'one_off' &&
    (initial.one_off_deal?.status === 'closed_won' ||
      initial.one_off_deal?.status === 'closed_lost' ||
      initial.one_off_deal?.status === 'archived')
  );
}

function isBrokerageLocked(initial?: PropertyDetail): boolean {
  return isClosedOneOff(initial);
}

function getFormTitle(mode: 'create' | 'edit', t: Translator): string {
  return mode === 'edit' ? t('form_edit_title') : t('form_new_title');
}

function getSecondCrumb(
  mode: 'create' | 'edit',
  initial: PropertyDetail | undefined,
  t: Translator,
): string {
  return mode === 'edit' ? (initial?.name ?? getFormTitle(mode, t)) : getFormTitle(mode, t);
}

function getOwnerLabel(initial?: PropertyDetail): string | undefined {
  return initial?.owner
    ? `${initial.owner.first_name} ${initial.owner.last_name}`.trim()
    : undefined;
}

function getVerificationScheduled(mode: 'create' | 'edit', initial?: PropertyDetail): boolean {
  return mode === 'edit' ? Boolean(initial?.verification) : false;
}

function getImmutableEngagement(initial?: PropertyDetail): 'managed' | 'one_off' | null {
  if (initial?.engagement_type === 'one_off') {
    return 'one_off';
  }
  if (initial?.engagement_type === 'managed') {
    return 'managed';
  }
  return null;
}

function resolveEngagement(
  immutable: 'managed' | 'one_off' | null,
  watched: string | undefined,
  initial: 'managed' | 'one_off',
): 'managed' | 'one_off' {
  if (immutable) {
    return immutable;
  }
  if (watched === 'one_off' || watched === 'managed') {
    return watched;
  }
  return initial;
}

type FormEngagementToggleProps = {
  oneOff: boolean;
  immutableEngagement: string | null;
  t: Translator;
  form: ReturnType<typeof useForm<ManagementPropertyFormData>>;
};

function FormEngagementToggle(props: FormEngagementToggleProps) {
  const { oneOff, immutableEngagement, t, form } = props;

  if (immutableEngagement) {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-primary-subtle px-3 text-xs font-medium text-primary-subtle-foreground">
        <Lock className="size-3.5" />
        {immutableEngagement === 'one_off'
          ? t('property_create_one_off')
          : t('property_create_managed')}
      </span>
    );
  }

  return (
    <div className="inline-flex h-9 rounded-[10px] bg-muted p-[3px] text-xs font-medium">
      <button
        type="button"
        onClick={() => form.setValue('engagement_type', 'managed', { shouldDirty: false })}
        className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 transition ${!oneOff ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
      >
        <Building2 className="size-3.5" /> {t('property_create_managed')}
      </button>
      <button
        type="button"
        onClick={() => form.setValue('engagement_type', 'one_off', { shouldDirty: false })}
        className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 transition ${oneOff ? 'bg-primary-subtle text-primary-subtle-foreground shadow-sm' : 'text-muted-foreground'}`}
      >
        <CircleDollarSign className="size-3.5" /> {t('property_create_one_off')}
      </button>
    </div>
  );
}

type DesktopFormBodyProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
  mode: 'create' | 'edit';
  oneOff: boolean;
  closedOneOff: boolean;
  brokerageTermsLocked: boolean;
  districts: DistrictOption[];
  photos: UsePropertyPhotosResult;
  checklistRows: ChecklistRow[];
  ownerLabel?: string;
  attentionCount: number;
  submitting: boolean;
  primaryAction: () => void;
  cancelAction: () => void;
  secondCrumb: string;
  title: string;
  engagementControl: ReactNode;
};

function DesktopFormBody(props: DesktopFormBodyProps) {
  const {
    control,
    t,
    mode,
    oneOff,
    closedOneOff,
    brokerageTermsLocked,
    districts,
    photos,
    checklistRows,
    ownerLabel,
    attentionCount,
    submitting,
    primaryAction,
    cancelAction,
    secondCrumb,
    title,
    engagementControl,
  } = props;

  let note: string;
  if (oneOff) {
    note = t('brokerage_new_subtitle');
  } else if (mode === 'edit') {
    note = t('form_edit_note');
  } else {
    note = t('form_publish_note');
  }

  return (
    <PropertyFormShell
      backHref="/management/properties"
      onBack={cancelAction}
      breadcrumb={
        <span>
          {t('properties')} / {secondCrumb}
        </span>
      }
      title={title}
      headerAside={<div className="flex items-center gap-3">{engagementControl}</div>}
      rail={
        <>
          {mode === 'create' && !oneOff ? <PublishChecklist rows={checklistRows} t={t} /> : null}
          {!oneOff ? <PropertyOwnerCard control={control} t={t} initialLabel={ownerLabel} /> : null}
          <PropertyMapCard control={control} t={t} />
        </>
      }
      footer={
        <PropertyFormFooter
          t={t}
          mode={mode}
          note={note}
          attentionCount={attentionCount}
          submitting={submitting}
          onCancel={cancelAction}
          onPrimary={primaryAction}
        />
      }
    >
      <PropertyBasicsCard control={control} t={t} districts={districts} />
      <PropertyPricingCard
        control={control}
        t={t}
        engagement={oneOff ? 'one_off' : 'managed'}
        askPriceLocked={closedOneOff}
      />
      {oneOff ? (
        <OneOffBrokerageCard control={control} t={t} disabled={brokerageTermsLocked} />
      ) : null}
      <PropertyPhotosCard t={t} photos={photos} />
    </PropertyFormShell>
  );
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
  'use no memo';
  const { mode, initial, initialEngagement = 'managed' } = props;
  const t = useTranslations('Management');
  const router = useRouter();
  const isMobile = useIsMobile();

  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [serverMissing, setServerMissing] = useState<Set<string>>(new Set());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const immutableEngagement = getImmutableEngagement(initial);

  const form = useForm({
    mode: 'onTouched',
    resolver: zodResolver(managementPropertyDraftSchema),
    defaultValues: initial
      ? toFormValues(initial)
      : {
          tariff: 'standard',
          engagement_type: initialEngagement,
          channel: 'marketplace',
          commission_type: 'none',
          commission_currency: 'USD',
        },
  });

  const engagement = resolveEngagement(
    immutableEngagement,
    form.watch('engagement_type'),
    initialEngagement,
  );
  const oneOff = engagement === 'one_off';
  const propertyId = mode === 'edit' && initial ? initial.id : null;

  const photos = usePropertyPhotos(propertyId, initial?.photos ?? [], {
    uploadError: t('form_photo_error'),
    needsDraft: t('form_photo_needs_draft'),
  });

  const values = form.watch();
  const checklist = usePublishChecklist({
    values,
    photoCount: photos.photos.length,
    verificationScheduled: getVerificationScheduled(mode, initial),
    engagementType: engagement,
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

  const hasUnsaved = form.formState.isDirty || photos.localFiles.length > 0;
  const pendingHref = useRef('/management/properties');

  // Guard browser/full-page navigation while there are unsaved edits.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    if (hasUnsaved) {
      window.addEventListener('beforeunload', handler);
    }
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [hasUnsaved]);

  // Route an in-app navigation through the discard dialog when edits are pending.
  const navigateGuarded = (href: string) => {
    if (hasUnsaved) {
      pendingHref.current = href;
      setDiscardOpen(true);
    } else {
      router.push(href);
    }
  };

  const showPublishErrors = (): boolean => {
    const parsed = (
      oneOff ? managementOneOffActivateSchema : managementPropertyPublishSchema
    ).safeParse(form.getValues());
    if (parsed.success) {
      return false;
    }
    const missing = new Set<string>();
    for (const issue of parsed.error.issues) {
      const path = String(issue.path[0]);
      // SAFETY: Validation error path maps to a property form field key
      form.setError(path as keyof ManagementPropertyFormData, {
        type: 'publish',
        message: issue.message,
      });
      missing.add(codeForPath(path));
    }
    setServerMissing(missing);
    setErrorStep(missing.size ? Math.min(...[...missing].map(stepForCode)) : 0);
    const first = String(parsed.error.issues[0]?.path[0] ?? 'name');
    // SAFETY: First validation issue path corresponds to a form field name
    form.setFocus(first as keyof ManagementPropertyFormData);
    return true;
  };

  const runSubmit = async (scheduledForIso?: string) => {
    if (showPublishErrors()) {
      setScheduleOpen(false);
      return;
    }
    if ((!oneOff || form.getValues('channel') === 'marketplace') && photos.photos.length < 5) {
      toast.error(t('form_photo_error'));
      setScheduleOpen(false);
      return;
    }
    setPublishing(true);
    try {
      const payload = toSubmissionPayload(form.getValues(), oneOff, photos.photos, scheduledForIso);
      await submitProperty(payload, photos.localFiles);
      toast.success(t('form_published'));
      router.push('/management/properties');
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
    if (showPublishErrors()) {
      return;
    }
    setPublishing(true);
    try {
      if (initial.engagement_type === 'one_off') {
        const payload = isClosedOneOff(initial)
          ? toPayload(form.getValues())
          : toOneOffPayload(form.getValues());
        await updateOneOffProperty(initial.id, payload);
      } else {
        await updateProperty(initial.id, toPayload(form.getValues()));
      }
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
    } else if (oneOff && form.getValues('channel') === 'off_market') {
      void runSubmit();
    } else {
      setScheduleOpen(true);
    }
  };

  const { errors } = form.formState;
  const attentionCount = Object.keys(errors).length;

  const body = isMobile ? (
    <PropertyFormStepper
      t={t}
      control={form.control}
      districts={districts}
      photos={photos}
      mode={mode}
      engagement={engagement}
      brokerageLocked={isBrokerageLocked(initial)}
      askPriceLocked={isClosedOneOff(initial)}
      submitting={publishing}
      onPrimary={onPrimary}
      errorStep={errorStep}
      engagementControl={
        <FormEngagementToggle
          oneOff={oneOff}
          immutableEngagement={immutableEngagement}
          t={t}
          form={form}
        />
      }
    />
  ) : (
    <DesktopFormBody
      control={form.control}
      t={t}
      mode={mode}
      oneOff={oneOff}
      closedOneOff={isClosedOneOff(initial)}
      brokerageTermsLocked={isBrokerageLocked(initial)}
      districts={districts}
      photos={photos}
      checklistRows={checklist.rows}
      ownerLabel={getOwnerLabel(initial)}
      attentionCount={attentionCount}
      submitting={publishing}
      primaryAction={onPrimary}
      cancelAction={() => navigateGuarded('/management/properties')}
      secondCrumb={getSecondCrumb(mode, initial, t)}
      title={getFormTitle(mode, t)}
      engagementControl={
        <FormEngagementToggle
          oneOff={oneOff}
          immutableEngagement={immutableEngagement}
          t={t}
          form={form}
        />
      }
    />
  );

  return (
    <Form {...form}>
      {body}
      <ScheduleVerificationSheet
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        t={t}
        submitting={publishing}
        onConfirm={(iso) => void runSubmit(iso)}
      />
      <DangerConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={t('discard_title')}
        description={t('discard_body')}
        confirmLabel={t('discard_confirm')}
        cancelLabel={t('discard_keep')}
        onConfirm={() => {
          setDiscardOpen(false);
          router.push(pendingHref.current);
        }}
      />
    </Form>
  );
}

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
import { useOneOffPropertyDraft } from '@/hooks/management/useOneOffPropertyDraft';
import { usePropertyDraft } from '@/hooks/management/usePropertyDraft';
import type { DraftState } from '@/hooks/management/usePropertyDraft';
import { usePropertyPhotos } from '@/hooks/management/usePropertyPhotos';
import type { UsePropertyPhotosResult } from '@/hooks/management/usePropertyPhotos';
import { usePublishChecklist } from '@/hooks/management/usePublishChecklist';
import type { ChecklistRow } from '@/hooks/management/usePublishChecklist';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from '@/libs/I18nNavigation';
import { activateOneOffDeal } from '@/libs/management/oneOffDealsAdapter';
import {
  fetchPropertyDetail,
  getDistricts,
  publishProperty,
  scheduleVerification,
  updateOneOffProperty,
  updateProperty,
} from '@/libs/management/propertiesAdapter';
import type {
  DistrictOption,
  OneOffPropertyDraftPayload,
  PropertyDraftPayload,
} from '@/libs/management/propertiesAdapter';
import {
  managementPropertyDraftSchema,
  managementOneOffActivateSchema,
  managementPropertyPublishSchema,
} from '@/libs/schemas/managementProperty';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import type { PropertyDetail } from '@/types/property';
import { DraftSavedChip } from './DraftSavedChip';
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
    ...toDealValues(property.one_off_deal),
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
  const excluded = new Set([
    'engagement_type',
    'seller_name',
    'seller_phone',
    'seller_email',
    'channel',
    'commission_type',
    'commission_fixed_amount',
    'commission_percentage',
    'commission_currency',
  ]);
  for (const [key, value] of Object.entries(values)) {
    if (!excluded.has(key) && value !== undefined && value !== '' && value !== null) {
      payload[key] = value;
    }
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

type DraftChipLabels = { saving: string; saved: string; error: string; unsaved: string };

/**
 * The header status chip: the autosave state in create, an unsaved-edits alert in
 * edit (only while dirty), nothing otherwise.
 * @param mode - The form mode.
 * @param draftState - The autosave lifecycle state.
 * @param hasUnsaved - Whether edit mode has pending changes.
 * @param labels - Localized chip labels.
 * @returns The chip node, or null.
 */
/**
 * Returns the header status chip for the form mode.
 * @param mode - The form mode.
 * @param draftState - The autosave lifecycle state.
 * @param hasUnsaved - Whether edit mode has pending changes.
 * @param labels - Localized chip labels.
 * @returns The chip node, or null.
 */
function headerChipFor(
  mode: 'create' | 'edit',
  draftState: DraftState,
  hasUnsaved: boolean,
  labels: DraftChipLabels,
): ReactNode {
  if (mode === 'create') {
    return <DraftSavedChip state={draftState} labels={labels} />;
  }
  if (hasUnsaved) {
    return <DraftSavedChip state="unsaved" labels={labels} />;
  }
  return null;
}

function getManagedDraftId(mode: 'create' | 'edit', initial?: PropertyDetail): number | undefined {
  return mode === 'edit' && initial?.engagement_type !== 'one_off' ? initial?.id : undefined;
}

function getOneOffDraftId(mode: 'create' | 'edit', initial?: PropertyDetail): number | undefined {
  return mode === 'edit' && initial?.engagement_type === 'one_off' ? initial?.id : undefined;
}

function isClosedOneOff(initial?: PropertyDetail): boolean {
  return (
    initial?.engagement_type === 'one_off' &&
    (initial.one_off_deal?.status === 'closed_won' ||
      initial.one_off_deal?.status === 'closed_lost')
  );
}

function isBrokerageLocked(initial?: PropertyDetail): boolean {
  return initial?.engagement_type === 'one_off' && initial.one_off_deal?.status !== 'draft';
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

function getImmutableEngagement(initial?: PropertyDetail): string | null {
  return initial?.engagement_type ?? null;
}

function triggerAutosave(
  mode: 'create' | 'edit',
  isDirty: boolean,
  oneOff: boolean,
  values: ManagementPropertyFormData,
  scheduleManaged: (values: PropertyDraftPayload) => void,
  scheduleOneOff: (values: OneOffPropertyDraftPayload) => void,
): boolean {
  if (mode !== 'create' || !isDirty) {
    return false;
  }
  if (oneOff) {
    scheduleOneOff(toOneOffPayload(values));
  } else {
    scheduleManaged(toPayload(values));
  }
  return true;
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
  saveDraftAction: () => void;
  secondCrumb: string;
  title: string;
  engagementControl: ReactNode;
  headerChip: ReactNode;
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
    saveDraftAction,
    secondCrumb,
    title,
    engagementControl,
    headerChip,
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
      headerAside={
        <div className="flex items-center gap-3">
          {engagementControl}
          {headerChip}
        </div>
      }
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
          onSaveDraft={saveDraftAction}
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
// eslint-disable-next-line react-compiler
export function PropertyForm(props: PropertyFormProps) {
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

  const engagement: 'managed' | 'one_off' = (immutableEngagement ??
    form.watch('engagement_type') ??
    initialEngagement) as 'managed' | 'one_off';
  const oneOff = engagement === 'one_off';
  const managedDraft = usePropertyDraft(getManagedDraftId(mode, initial));
  const oneOffDraft = useOneOffPropertyDraft(getOneOffDraftId(mode, initial));
  const activeDraft = oneOff ? oneOffDraft : managedDraft;
  const propertyId = activeDraft.draftId ?? initial?.id ?? null;

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

  // Autosave (create only): debounce a draft PATCH whenever the form changes.
  const serialized = JSON.stringify(values);
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (
      triggerAutosave(
        mode,
        form.formState.isDirty,
        oneOff,
        values,
        managedDraft.schedule,
        oneOffDraft.schedule,
      )
    ) {
      dirtyRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, mode, oneOff]);

  // Edit mode with pending edits: navigating away must confirm first.
  const hasUnsaved = mode === 'edit' && form.formState.isDirty;
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

  const saveDraftAndLeave = async () => {
    if (mode === 'create' && dirtyRef.current) {
      await (oneOff
        ? oneOffDraft.flush(toOneOffPayload(form.getValues()))
        : managedDraft.flush(toPayload(form.getValues())));
    }
    router.push('/management/properties');
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
      const id = await managedDraft.flush(toPayload(form.getValues()));
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

  const runOneOffActivation = async (scheduledForIso?: string) => {
    if (showPublishErrors()) {
      setScheduleOpen(false);
      return;
    }
    setPublishing(true);
    try {
      const id = await oneOffDraft.flush(toOneOffPayload(form.getValues()));
      if (id === null) {
        toast.error(t('form_publish_failed'));
        return;
      }
      // One-off properties skip verification scheduling — only managed
      // properties use verification visits.
      if (!oneOff && form.getValues('channel') === 'marketplace' && scheduledForIso) {
        await scheduleVerification(id, scheduledForIso);
      }
      const refreshed = await fetchPropertyDetail(id);
      if (!refreshed.one_off_deal) {
        throw new Error('One-off deal missing');
      }
      await activateOneOffDeal(refreshed.one_off_deal.id);
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
    setPublishing(true);
    try {
      if (initial.engagement_type === 'one_off') {
        await updateOneOffProperty(
          initial.id,
          isClosedOneOff(initial) ? toPayload(form.getValues()) : toOneOffPayload(form.getValues()),
        );
      } else {
        if (showPublishErrors()) {
          return;
        }
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
    } else if (oneOff) {
      void runOneOffActivation();
    } else {
      setScheduleOpen(true);
    }
  };

  // Read errors directly in render so the RHF formState proxy subscribes and the
  // count re-renders when validation sets/clears field errors (a useMemo keyed on
  // the errors object misses in-place proxy updates).
  const { errors } = form.formState;
  const attentionCount = Object.keys(errors).length;

  const draftLabels = {
    saving: t('draft_saving'),
    saved: t('draft_saved'),
    error: t('draft_error'),
    unsaved: t('draft_unsaved'),
  };

  const headerChip = headerChipFor(mode, activeDraft.state, hasUnsaved, draftLabels);

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
      saveDraftAction={() => void saveDraftAndLeave()}
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
      headerChip={headerChip}
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
        onConfirm={(iso) => void (oneOff ? runOneOffActivation() : runPublish(iso))}
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

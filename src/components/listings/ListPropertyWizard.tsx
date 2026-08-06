'use client';

import { Building2, Check, Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Fragment, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/libs/auth';
import { Link } from '@/libs/I18nNavigation';
import { fetchAmenities, fetchDistricts, formatPrice } from '@/libs/marketplace';
import {
  createOwnerListing,
  deleteOwnerListingPhoto,
  reorderOwnerListingPhotos,
  submitOwnerListing,
  updateOwnerListing,
  uploadOwnerListingPhotos,
} from '@/libs/ownerListings';
import { submitPublicListing } from '@/libs/publicListings';
import { cn } from '@/libs/utils';
import type { Currency, Furnishing, PropertyType } from '@/types/enums';
import type { AmenityOption, DistrictOption, OwnerListing } from '@/types/marketplace';

const STEPS = ['details', 'photos', 'pricing', 'contact', 'review'] as const;
const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'studio', 'room'];
const FURNISHINGS: Furnishing[] = ['furnished', 'semi_furnished', 'unfurnished'];
const PRICE_INCLUDES = ['utilities', 'water', 'internet', 'gas', 'cleaning', 'parking'] as const;
const MIN_STAYS = [1, 3, 6, 12] as const;

// Wizard-local filled control styling — matches the Figma "List your property" inputs
// (a deliberate niche restyle, scoped here rather than changing the global shadcn Input).
const FILLED =
  'w-full rounded-[10px] border border-border bg-input px-4 py-[13px] text-[15px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';
const FIELD_LABEL = 'text-[13px] font-medium text-foreground';
const CARD = 'rounded-[18px] border border-border bg-card';

type DetailsForm = {
  property_type: PropertyType;
  name: string;
  district_id: string;
  rooms: string;
  floor: string;
  total_floors: string;
  area_sqm: string;
  furnishing: Furnishing;
  description: string;
  amenities: string[];
};

type ContactForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type PricingForm = {
  monthly_price: string;
  deposit_amount: string;
  currency: string;
  minimum_stay: number;
  price_includes: string[];
};

type TFn = (key: string, values?: Record<string, string | number>) => string;

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className={cn(CARD, 'p-8')}>{children}</div>
    </div>
  );
}

function WizField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className={cn('block', FIELD_LABEL)}>{label}</span>
      {children}
    </label>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <span className={cn('block', FIELD_LABEL)}>{label}</span>
      {children}
    </div>
  );
}

function FilledSelect(props: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string | React.ReactNode }[];
  placeholder?: string;
}) {
  const { value, onChange, options, placeholder } = props;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn(FILLED, 'data-[size=default]:h-[50px]')}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        'rounded-full border px-[14px] py-2 text-[13px] font-medium transition',
        active
          ? 'border-primary bg-primary-subtle text-primary-subtle-foreground'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function circleClasses(done: boolean, active: boolean) {
  if (done) {
    return 'bg-primary-subtle text-primary-subtle-foreground';
  }
  if (active) {
    return 'bg-primary text-primary-foreground';
  }
  return 'border border-border bg-muted text-muted-foreground';
}

function Stepper({ step, t }: { step: number; t: TFn }) {
  return (
    <ol className="hidden items-center gap-3 lg:flex">
      {STEPS.map((s, i) => {
        const done = i < step || step === 5;
        const active = i === step && step !== 5;
        return (
          <Fragment key={s}>
            <li className="flex shrink-0 items-center gap-2.5">
              <span
                className={cn(
                  'grid size-8 place-items-center rounded-full text-[14px] font-semibold',
                  circleClasses(done, active),
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-[14px] font-medium',
                  active || done ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {t(`step_${s}`)}
              </span>
            </li>
            {i < STEPS.length - 1 && (
              <li
                aria-hidden
                className={cn('h-0.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-border')}
              />
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}

function MobileProgress({ step, t }: { step: number; t: TFn }) {
  if (step === 5) {
    return null;
  }
  const total = STEPS.length;
  const current = step + 1;
  const pct = Math.round((current / total) * 100);
  const label = t(`step_${STEPS[step]}`);
  const next = step < total - 1 ? t(`step_${STEPS[step + 1]}`) : null;
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-foreground">
          {t('step_of', { current, total, label })}
        </p>
        <span className="text-[13px] font-medium text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {next && (
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {t('next_label', { label: next })}
        </p>
      )}
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-[20px] font-semibold text-foreground">{title}</h2>
      <p className="text-[14px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function DetailsStep(props: {
  details: DetailsForm;
  setDetails: React.Dispatch<React.SetStateAction<DetailsForm>>;
  districts: DistrictOption[];
  amenityOptions: AmenityOption[];
  toggleAmenity: (slug: string) => void;
  t: TFn;
}) {
  const { details, setDetails, districts, amenityOptions, toggleAmenity, t } = props;
  return (
    <div className="space-y-3 lg:space-y-6">
      <StepHeading subtitle={t('details_subtitle')} title={t('details_title')} />
      <WizField label={t('property_type')}>
        <FilledSelect
          onChange={(v) => setDetails((d) => ({ ...d, property_type: v as PropertyType }))}
          value={details.property_type}
          options={PROPERTY_TYPES.map((pt) => ({ value: pt, label: t(`type_${pt}`) }))}
        />
      </WizField>
      <WizField label={t('listing_title')}>
        <input
          className={FILLED}
          onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
          value={details.name}
        />
      </WizField>
      <WizField label={t('location')}>
        <FilledSelect
          onChange={(v) => setDetails((d) => ({ ...d, district_id: v }))}
          value={details.district_id}
          placeholder={t('select_district')}
          options={districts.map((d) => ({ value: String(d.id), label: `${d.name}, ${d.city}` }))}
        />
      </WizField>
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <WizField label={t('rooms')}>
          <FilledSelect
            onChange={(v) => setDetails((d) => ({ ...d, rooms: v }))}
            value={details.rooms}
            options={['1', '2', '3', '4', '5', '6'].map((n) => ({ value: n, label: n }))}
          />
        </WizField>
        <WizField label={t('floor')}>
          <input
            className={FILLED}
            inputMode="numeric"
            onChange={(e) => setDetails((d) => ({ ...d, floor: e.target.value }))}
            value={details.floor}
          />
        </WizField>
        <WizField label={t('total_floors')}>
          <input
            className={FILLED}
            inputMode="numeric"
            onChange={(e) => setDetails((d) => ({ ...d, total_floors: e.target.value }))}
            value={details.total_floors}
          />
        </WizField>
        <WizField label={t('area')}>
          <input
            className={FILLED}
            inputMode="numeric"
            onChange={(e) => setDetails((d) => ({ ...d, area_sqm: e.target.value }))}
            value={details.area_sqm}
          />
        </WizField>
      </div>
      <FieldBlock label={t('furnishing')}>
        <div className="flex gap-1 rounded-[10px] bg-muted p-1">
          {FURNISHINGS.map((f) => (
            <button
              className={cn(
                'flex-1 rounded-[8px] px-3 py-[9px] text-[14px] font-medium transition',
                details.furnishing === f
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
              key={f}
              onClick={() => setDetails((d) => ({ ...d, furnishing: f }))}
              type="button"
            >
              {t(`furnishing_${f}`)}
            </button>
          ))}
        </div>
      </FieldBlock>
      <WizField label={t('description')}>
        <textarea
          className={cn(FILLED, 'min-h-[96px] resize-y leading-[22px]')}
          onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
          rows={3}
          value={details.description}
        />
      </WizField>
      <FieldBlock label={t('amenities')}>
        <div className="flex flex-wrap gap-2.5">
          {amenityOptions.map((a) => (
            <Chip
              active={details.amenities.includes(a.slug)}
              key={a.slug}
              onClick={() => toggleAmenity(a.slug)}
            >
              {a.name}
            </Chip>
          ))}
        </div>
      </FieldBlock>
    </div>
  );
}

function PhotosStep(props: {
  draft: OwnerListing | null;
  onUpload: (files: FileList | null) => void;
  removePhoto: (id: number) => void;
  setCaption: (id: number, caption: string) => void;
  busy: boolean;
  t: TFn;
}) {
  const { draft, onUpload, removePhoto, setCaption, busy, t } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => inputRef.current?.click();
  if (!draft) {
    return <p className="text-muted-foreground">{t('save_details_first')}</p>;
  }
  return (
    <div className="space-y-3 lg:space-y-6">
      <StepHeading subtitle={t('photos_subtitle')} title={t('photos_title')} />
      <input
        accept="image/*"
        aria-label={t('add_photos')}
        className="hidden"
        multiple
        onChange={(e) => onUpload(e.target.files)}
        ref={inputRef}
        type="file"
      />
      <button
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-[14px] bg-muted px-6 py-9 text-center transition',
          busy && 'opacity-50',
        )}
        onClick={openPicker}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onUpload(e.dataTransfer.files);
        }}
        type="button"
      >
        <span className="text-[15px] font-semibold text-foreground">{t('add_photos')}</span>
        <span className="max-w-md text-[13px] text-muted-foreground">{t('photos_drop_hint')}</span>
        <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-1 bg-card')}>
          {t('browse_files')}
        </span>
      </button>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {draft.photos.map((p, i) => (
          <div className="space-y-1.5" key={p.id}>
            <div className="group relative aspect-square overflow-hidden rounded-[12px] bg-muted">
              <Image alt="" className="object-cover" fill sizes="160px" src={p.image_url} />
              {(p.is_primary || i === 0) && (
                <span className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                  {t('cover')}
                </span>
              )}
              <button
                className="absolute top-2 right-2 hidden rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white group-hover:block"
                onClick={() => removePhoto(p.id)}
                type="button"
              >
                {t('remove')}
              </button>
            </div>
            <input
              aria-label={t('photo_caption')}
              className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px] text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none"
              defaultValue={p.caption ?? ''}
              onBlur={(e) => setCaption(p.id, e.target.value.trim())}
              placeholder={t('photo_caption_ph')}
              type="text"
            />
          </div>
        ))}
        <button
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-border text-[13px] text-muted-foreground transition hover:text-foreground"
          onClick={openPicker}
          type="button"
        >
          <Plus className="size-4" />
          {t('add_photo')}
        </button>
      </div>
    </div>
  );
}

function PricingStep(props: {
  pricing: PricingForm;
  setPricing: React.Dispatch<React.SetStateAction<PricingForm>>;
  togglePriceInclude: (slug: string) => void;
  t: TFn;
}) {
  const { pricing, setPricing, togglePriceInclude, t } = props;
  return (
    <div className="space-y-3 lg:space-y-6">
      <StepHeading subtitle={t('pricing_subtitle')} title={t('pricing_title')} />
      <WizField label={t('monthly_rent')}>
        <input
          className={cn(FILLED, 'py-5 text-[18px] font-semibold')}
          inputMode="numeric"
          onChange={(e) => setPricing((p) => ({ ...p, monthly_price: e.target.value }))}
          value={pricing.monthly_price}
        />
      </WizField>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <WizField label={t('currency')}>
          <FilledSelect
            onChange={(v) => setPricing((p) => ({ ...p, currency: v }))}
            value={pricing.currency}
            options={[
              { value: 'USD', label: 'USD' },
              { value: 'UZS', label: 'UZS' },
            ]}
          />
        </WizField>
        <WizField label={t('deposit')}>
          <input
            className={FILLED}
            inputMode="numeric"
            onChange={(e) => setPricing((p) => ({ ...p, deposit_amount: e.target.value }))}
            value={pricing.deposit_amount}
          />
        </WizField>
        <div className="col-span-2 lg:col-span-1">
          <WizField label={t('minimum_stay')}>
            <FilledSelect
              onChange={(v) => setPricing((p) => ({ ...p, minimum_stay: Number(v) }))}
              value={String(pricing.minimum_stay)}
              options={MIN_STAYS.map((m) => ({ value: String(m), label: t(`stay_${m}`) }))}
            />
          </WizField>
        </div>
      </div>
      <FieldBlock label={t('price_includes')}>
        <div className="flex flex-wrap gap-2.5">
          {PRICE_INCLUDES.map((slug) => (
            <Chip
              active={pricing.price_includes.includes(slug)}
              key={slug}
              onClick={() => togglePriceInclude(slug)}
            >
              {t(`incl_${slug}`)}
            </Chip>
          ))}
        </div>
      </FieldBlock>
    </div>
  );
}

function ReviewRow(props: {
  label: string;
  children: React.ReactNode;
  onEdit: () => void;
  editLabel: string;
}) {
  const { label, children, onEdit, editLabel } = props;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div className="space-y-0.5">
        <p className="text-[11px] font-medium tracking-[0.4px] text-muted-foreground uppercase">
          {label}
        </p>
        {children}
      </div>
      <button className="text-[13px] font-medium text-primary" onClick={onEdit} type="button">
        {editLabel}
      </button>
    </div>
  );
}

function ContactStep(props: {
  contact: ContactForm;
  setContact: React.Dispatch<React.SetStateAction<ContactForm>>;
  isAuthenticated: boolean;
  t: TFn;
}) {
  const { contact, setContact, isAuthenticated, t } = props;
  return (
    <div className="space-y-6">
      <StepHeading
        subtitle={t('contact_details_subtitle') || 'How should renters contact you?'}
        title={t('contact_details_title')}
      />
      <div className={cn(CARD, 'p-5 space-y-4')}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <WizField label={t('first_name')}>
            <input
              className={FILLED}
              disabled={isAuthenticated}
              onChange={(e) => setContact((c) => ({ ...c, first_name: e.target.value }))}
              value={contact.first_name}
            />
          </WizField>
          <WizField label={t('last_name')}>
            <input
              className={FILLED}
              disabled={isAuthenticated}
              onChange={(e) => setContact((c) => ({ ...c, last_name: e.target.value }))}
              value={contact.last_name}
            />
          </WizField>
          <WizField label={t('email')}>
            <input
              className={FILLED}
              disabled={isAuthenticated}
              onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              value={contact.email}
            />
          </WizField>
          <WizField label={t('phone')}>
            <input
              className={FILLED}
              disabled={isAuthenticated}
              onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
              value={contact.phone}
            />
          </WizField>
        </div>
        {isAuthenticated && (
          <p className="mt-2 text-[13px] text-muted-foreground">
            * These details are pulled from your account and cannot be changed here.
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewStep(props: {
  draft: OwnerListing | null;
  acceptOffer: boolean;
  setAcceptOffer: (v: boolean) => void;
  goTo: (step: number) => void;
  t: TFn;
}) {
  const { draft, acceptOffer, setAcceptOffer, goTo, t } = props;

  if (!draft) {
    return <p className="text-muted-foreground">{t('save_details_first')}</p>;
  }
  const currency = draft.currency || 'USD';
  const specs = t('review_specs', {
    type: t(`type_${draft.property_type}`),
    rooms: draft.rooms,
    floor: `${draft.floor}${draft.total_floors ? `/${draft.total_floors}` : ''}`,
    area: draft.area_sqm,
    furnishing: t(`furnishing_${draft.furnishing}`),
  });
  const stayLabel = draft.minimum_stay ? t(`stay_${draft.minimum_stay}`) : '—';
  return (
    <div className="space-y-3 lg:space-y-6">
      <StepHeading subtitle={t('review_subtitle')} title={t('review_title')} />
      <div className={cn(CARD, 'px-5 py-1')}>
        <ReviewRow editLabel={t('edit')} label={t('review_property')} onEdit={() => goTo(0)}>
          <p className="font-medium text-foreground">{draft.name}</p>
          <p className="text-[13px] text-muted-foreground">{specs}</p>
        </ReviewRow>
        <ReviewRow editLabel={t('edit')} label={t('review_location')} onEdit={() => goTo(0)}>
          <p className="font-medium text-foreground">{draft.district_name ?? '—'}</p>
        </ReviewRow>
        <ReviewRow editLabel={t('edit')} label={t('review_photos')} onEdit={() => goTo(1)}>
          <p className="font-medium text-foreground">
            {t('photos_count', { count: draft.photos.length })}
          </p>
        </ReviewRow>
        <ReviewRow editLabel={t('edit')} label={t('review_pricing')} onEdit={() => goTo(2)}>
          <p className="font-medium text-foreground">
            {draft.monthly_price ? formatPrice(draft.monthly_price, currency) : '—'}{' '}
            {t('per_month_label')}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {t('deposit_stay_line', {
              deposit: draft.deposit_amount ? formatPrice(draft.deposit_amount, currency) : '—',
              stay: stayLabel,
            })}
          </p>
        </ReviewRow>
      </div>

      <div className="space-y-1 rounded-[14px] bg-primary-subtle p-4">
        <p className="text-[14px] font-semibold text-primary-subtle-foreground">
          {t('ready_title')}
        </p>
        <p className="text-[13px] text-muted-foreground">{t('ready_desc')}</p>
      </div>

      <label className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
        <Checkbox
          checked={acceptOffer}
          className="mt-0.5"
          onCheckedChange={(checked) => setAcceptOffer(checked as boolean)}
        />
        {t('accept_offer')}
      </label>
    </div>
  );
}

function PreviewCard(props: {
  details: DetailsForm;
  pricing: PricingForm;
  districts: DistrictOption[];
  draft: OwnerListing | null;
  t: TFn;
}) {
  const { details, pricing, districts, draft, t } = props;
  const districtName = districts.find((d) => String(d.id) === details.district_id)?.name;
  const cover = draft?.photos[0]?.image_url;
  return (
    <div className={cn(CARD, 'overflow-hidden')}>
      <div className="relative h-[168px] bg-muted">
        {cover ? (
          <Image alt="" className="object-cover" fill sizes="348px" src={cover} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="space-y-1.5 px-4 pt-4 pb-[18px]">
        <span className="inline-flex rounded-full bg-primary-subtle px-2.5 py-1 text-[11px] font-medium tracking-[0.2px] text-primary-subtle-foreground">
          {t('live_preview')}
        </span>
        <p className="text-[16px] font-semibold text-foreground">
          {details.name || t('your_listing')}
        </p>
        <p className="text-[13px] text-muted-foreground">{districtName ?? '—'}</p>
        {pricing.monthly_price && (
          <p className="font-display text-[22px] font-bold tracking-[-0.4px] text-primary">
            {formatPrice(pricing.monthly_price, pricing.currency as Currency)} {t('per_month')}
          </p>
        )}
      </div>
    </div>
  );
}

function ChecklistCard({
  draft,
  t,
  mobile,
}: {
  draft: OwnerListing | null;
  t: TFn;
  mobile?: boolean;
}) {
  const items = [
    { key: 'ownership', done: draft?.completeness.has_ownership ?? false },
    { key: 'photos', done: draft?.completeness.has_5_photos ?? false },
    { key: 'price', done: draft?.completeness.has_price ?? false },
  ];
  return (
    <div
      className={cn(
        mobile ? 'rounded-[14px] bg-primary-subtle p-3' : cn('rounded-[16px] p-[18px]', CARD),
      )}
    >
      <p className={cn('text-[15px] font-semibold text-foreground', mobile ? 'mb-2' : 'mb-3')}>
        {t('checklist_title')}
      </p>
      <ul className={mobile ? 'space-y-2' : 'space-y-3'}>
        {items.map((item) => (
          <li className="flex items-center gap-2.5 text-[14px]" key={item.key}>
            <span
              className={cn(
                'grid size-5 place-items-center rounded-[6px]',
                item.done ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted',
              )}
            >
              {item.done && <Check className="size-3" />}
            </span>
            <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
              {t(`need_${item.key}`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TipCard({ tipKey, t }: { tipKey: string; t: TFn }) {
  return (
    <div className="hidden space-y-1.5 rounded-[14px] bg-primary-subtle p-4 lg:block">
      <p className="text-[13px] font-semibold text-primary-subtle-foreground">{t('tip_label')}</p>
      <p className="text-[13px] text-muted-foreground">{t(tipKey)}</p>
    </div>
  );
}

function StepContent(props: {
  step: number;
  details: DetailsForm;
  setDetails: React.Dispatch<React.SetStateAction<DetailsForm>>;
  districts: DistrictOption[];
  amenityOptions: AmenityOption[];
  toggleAmenity: (slug: string) => void;
  pricing: PricingForm;
  setPricing: React.Dispatch<React.SetStateAction<PricingForm>>;
  togglePriceInclude: (slug: string) => void;
  draft: OwnerListing | null;
  onUpload: (files: FileList | null) => void;
  removePhoto: (id: number) => void;
  setCaption: (id: number, caption: string) => void;
  busy: boolean;
  acceptOffer: boolean;
  setAcceptOffer: (v: boolean) => void;
  goTo: (step: number) => void;
  contact: ContactForm;
  setContact: React.Dispatch<React.SetStateAction<ContactForm>>;
  isAuthenticated: boolean;
  t: TFn;
}) {
  const p = props;
  if (p.step === 0) {
    return (
      <DetailsStep
        amenityOptions={p.amenityOptions}
        details={p.details}
        districts={p.districts}
        setDetails={p.setDetails}
        t={p.t}
        toggleAmenity={p.toggleAmenity}
      />
    );
  }
  if (p.step === 1) {
    return (
      <PhotosStep
        busy={p.busy}
        draft={p.draft}
        onUpload={(files) => {
          p.onUpload(files);
        }}
        removePhoto={p.removePhoto}
        setCaption={p.setCaption}
        t={p.t}
      />
    );
  }
  if (p.step === 2) {
    return (
      <PricingStep
        pricing={p.pricing}
        setPricing={p.setPricing}
        t={p.t}
        togglePriceInclude={p.togglePriceInclude}
      />
    );
  }
  if (p.step === 3) {
    return (
      <ContactStep
        contact={p.contact}
        setContact={p.setContact}
        isAuthenticated={p.isAuthenticated}
        t={p.t}
      />
    );
  }
  return (
    <ReviewStep
      acceptOffer={p.acceptOffer}
      draft={p.draft}
      goTo={p.goTo}
      setAcceptOffer={p.setAcceptOffer}
      t={p.t}
    />
  );
}

export function ListPropertyWizard() {
  // Cast to a loose signature: this component builds keys dynamically (`type_${pt}`, etc.).
  const t = useTranslations('ListProperty') as unknown as TFn;
  const { user, isLoading, isAuthenticated: _isAuth } = useAuth();
  const isAuthenticated = _isAuth && user?.role === 'owner';

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OwnerListing | null>(null);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<AmenityOption[]>([]);
  const [busy, setBusy] = useState(false);

  const [details, setDetails] = useState<DetailsForm>({
    property_type: 'apartment',
    name: '',
    district_id: '',
    rooms: '1',
    floor: '',
    total_floors: '',
    area_sqm: '',
    furnishing: 'furnished',
    description: '',
    amenities: [],
  });
  const [pricing, setPricing] = useState<PricingForm>({
    monthly_price: '',
    deposit_amount: '',
    currency: 'USD',
    minimum_stay: 6,
    price_includes: [],
  });
  const [acceptOffer, setAcceptOffer] = useState(false);
  const [contact, setContact] = useState<ContactForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [guestPhotos, setGuestPhotos] = useState<File[]>([]);
  const [guestCaptions, setGuestCaptions] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchDistricts().then(setDistricts);
    fetchAmenities().then(setAmenityOptions);
  }, []);

  useEffect(() => {
    if (user && !contact.email) {
      setContact((prev) => {
        if (prev.email) {
          return prev;
        }
        return {
          first_name: user.first_name ?? '',
          last_name: user.last_name ?? '',
          email: user.email ?? '',
          phone: user.phone ?? '',
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (isLoading) {
    return <CenteredCard>{t('loading')}</CenteredCard>;
  }

  const toggleAmenity = (slug: string) =>
    setDetails((d) => ({
      ...d,
      amenities: d.amenities.includes(slug)
        ? d.amenities.filter((s) => s !== slug)
        : [...d.amenities, slug],
    }));

  function syncGuestDraft(
    currentDetails: DetailsForm,
    currentPricing: PricingForm,
    photos: File[],
    captions: Record<number, string>,
  ) {
    const photoObjects = photos.map((file, i) => ({
      id: i,
      image_url: URL.createObjectURL(file),
      caption: captions[i] ?? null,
      is_primary: i === 0,
      sort_order: i,
    }));
    setDraft({
      id: 0,
      status: 'draft',
      property_id: 0,
      property_type: currentDetails.property_type,
      name: currentDetails.name,
      address: '',
      district_id: Number(currentDetails.district_id) || 0,
      district_name:
        districts.find((d) => String(d.id) === currentDetails.district_id)?.name ?? null,
      rooms: Number(currentDetails.rooms) || 0,
      floor: Number(currentDetails.floor) || 0,
      total_floors: Number(currentDetails.total_floors) || null,
      area_sqm: Number(currentDetails.area_sqm) || 0,
      furnishing: currentDetails.furnishing,
      tariff: 'standard',
      description: currentDetails.description,
      amenities: amenityOptions.filter((a) => currentDetails.amenities.includes(a.slug)),
      monthly_price: currentPricing.monthly_price,
      deposit_amount: currentPricing.deposit_amount,
      currency: currentPricing.currency as Currency,
      minimum_stay: currentPricing.minimum_stay,
      price_includes: currentPricing.price_includes,
      photos: photoObjects,
      completeness: {
        has_5_photos: photos.length >= 5,
        has_price: !!currentPricing.monthly_price && !!currentPricing.deposit_amount,
        has_ownership: false,
      },
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const togglePriceInclude = (slug: string) =>
    setPricing((p) => ({
      ...p,
      price_includes: p.price_includes.includes(slug)
        ? p.price_includes.filter((s) => s !== slug)
        : [...p.price_includes, slug],
    }));

  async function saveDetails(advance: boolean) {
    if (!(details.name && details.district_id && details.area_sqm)) {
      toast.error(t('error_required'));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        property_type: details.property_type,
        name: details.name,
        district_id: Number(details.district_id),
        rooms: Number(details.rooms),
        floor: Number(details.floor) || 0,
        total_floors: Number(details.total_floors) || null,
        area_sqm: Number(details.area_sqm),
        furnishing: details.furnishing,
        description: details.description || null,
        amenities: details.amenities,
      };
      if (!isAuthenticated) {
        syncGuestDraft(payload as unknown as DetailsForm, pricing, guestPhotos, guestCaptions);
        toast.success(t('saved'));
        setBusy(false);
        if (advance) {
          setStep(1);
        }
        return;
      }
      const result = draft
        ? await updateOwnerListing(draft.id, payload)
        : await createOwnerListing(payload);
      setDraft(result);
      toast.success(t('saved'));
      if (advance) {
        setStep(1);
      }
    } catch {
      toast.error(t('error_generic'));
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(files: FileList | null) {
    if (!(draft && files && files.length > 0)) {
      return;
    }
    setBusy(true);
    try {
      if (!isAuthenticated) {
        const newPhotos = [...guestPhotos, ...files];
        setGuestPhotos(newPhotos);
        syncGuestDraft(details, pricing, newPhotos, guestCaptions);
        setBusy(false);
        return;
      }
      await uploadOwnerListingPhotos(draft.id, [...files]);
      if (!isAuthenticated) {
        toast.success(t('saved'));
        setBusy(false);
        return;
      }
      const refreshed = await updateOwnerListing(draft.id, {});
      setDraft(refreshed);
    } catch {
      toast.error(t('error_upload'));
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(photoId: number) {
    if (!draft) {
      return;
    }
    if (!isAuthenticated) {
      const newPhotos = guestPhotos.filter((_, i) => i !== photoId);
      setGuestPhotos(newPhotos);
      syncGuestDraft(details, pricing, newPhotos, guestCaptions);
      return;
    }
    await deleteOwnerListingPhoto(draft.id, photoId);
    if (!isAuthenticated) {
      toast.success(t('saved'));
      setBusy(false);
      return;
    }
    const refreshed = await updateOwnerListing(draft.id, {});
    setDraft(refreshed);
  }

  async function setCaption(photoId: number, caption: string) {
    if (!draft) {
      return;
    }
    const photo = draft.photos.find((p) => p.id === photoId);
    if (!photo || (photo.caption ?? '') === caption) {
      return;
    }
    if (!isAuthenticated) {
      const newCaptions = { ...guestCaptions, [photoId]: caption };
      setGuestCaptions(newCaptions);
      syncGuestDraft(details, pricing, guestPhotos, newCaptions);
      return;
    }
    const refreshed = await reorderOwnerListingPhotos(draft.id, [
      { id: photoId, sort_order: photo.sort_order, is_primary: photo.is_primary, caption },
    ]);
    setDraft(refreshed);
  }

  async function savePricing(advance: boolean) {
    if (!draft) {
      return;
    }
    if (!(pricing.monthly_price && pricing.deposit_amount)) {
      toast.error(t('error_required'));
      return;
    }
    setBusy(true);
    try {
      if (!isAuthenticated) {
        const p = {
          monthly_price: pricing.monthly_price,
          deposit_amount: pricing.deposit_amount,
          currency: pricing.currency,
          minimum_stay: pricing.minimum_stay,
          price_includes: pricing.price_includes,
        };
        syncGuestDraft(details, p, guestPhotos, guestCaptions);
        toast.success(t('saved'));
        setBusy(false);
        if (advance) {
          setStep(3);
        }
        return;
      }
      const result = await updateOwnerListing(draft.id, {
        monthly_price: pricing.monthly_price,
        deposit_amount: pricing.deposit_amount,
        currency: pricing.currency as Currency,
        minimum_stay: pricing.minimum_stay,
        price_includes: pricing.price_includes,
      });
      setDraft(result);
      toast.success(t('saved'));
      if (advance) {
        setStep(3);
      }
    } catch {
      toast.error(t('error_generic'));
    } finally {
      setBusy(false);
    }
  }

  function saveContact(advance: boolean) {
    if (!isAuthenticated && (!contact.first_name || !contact.email || !contact.phone)) {
      toast.error(t('error_required'));
      return;
    }
    if (advance) {
      setStep(4);
    }
  }

  async function saveAndStay() {
    if (!draft) {
      return;
    }
    setBusy(true);
    try {
      if (!isAuthenticated) {
        toast.success(t('saved'));
        setBusy(false);
        return;
      }
      const refreshed = await updateOwnerListing(draft.id, {});
      setDraft(refreshed);
      toast.success(t('saved'));
    } catch {
      toast.error(t('error_generic'));
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!draft && isAuthenticated) {
      return;
    }
    if (!acceptOffer) {
      toast.error(t('accept_offer_required'));
      return;
    }
    setBusy(true);
    try {
      if (!isAuthenticated) {
        if (!contact.first_name || !contact.email || !contact.phone) {
          toast.error(t('error_required'));
          setBusy(false);
          return;
        }
        await submitPublicListing(
          {
            contact: {
              first_name: contact.first_name,
              last_name: contact.last_name || null,
              email: contact.email,
              phone: contact.phone,
            },
            property_type: details.property_type,
            name: details.name,
            district_id: Number(details.district_id),
            rooms: Number(details.rooms),
            floor: Number(details.floor) || 0,
            total_floors: Number(details.total_floors) || null,
            area_sqm: Number(details.area_sqm),
            furnishing: details.furnishing,
            description: details.description || null,
            amenities: details.amenities,
            monthly_price: pricing.monthly_price,
            deposit_amount: pricing.deposit_amount,
            currency: pricing.currency,
            minimum_stay: pricing.minimum_stay,
            price_includes: pricing.price_includes,
          },
          guestPhotos,
        );
      } else {
        if (!draft) {
          return;
        }
        await submitOwnerListing(draft.id, true);
      }
      toast.success(t('published'));
      setStep(5);
    } catch {
      toast.error(t('error_incomplete'));
    } finally {
      setBusy(false);
    }
  }

  // Per-step footer config: which secondary action to show and what the primary does.
  const actions = [
    {
      saveDraft: async () => {
        await saveDetails(false);
      },
      primary: async () => {
        await saveDetails(true);
      },
      primaryLabel: t('continue'),
    },
    { saveDraft: null, primary: () => setStep(2), primaryLabel: t('continue') },
    {
      saveDraft: async () => {
        await savePricing(false);
      },
      primary: async () => {
        await savePricing(true);
      },
      primaryLabel: t('continue'),
    },
    { saveDraft: saveAndStay, primary: () => saveContact(true), primaryLabel: t('continue') },
    { saveDraft: saveAndStay, primary: publish, primaryLabel: t('publish_listing') },
  ][step];

  const backBtn = (
    <Button
      disabled={step === 0 || busy}
      onClick={() => setStep((s) => Math.max(0, s - 1))}
      variant="ghost"
    >
      {t('back')}
    </Button>
  );
  const saveDraftBtn = actions?.saveDraft ? (
    <Button
      className="min-w-[120px]"
      disabled={busy}
      onClick={() => {
        void actions.saveDraft();
      }}
      variant="outline"
    >
      {t('save_draft')}
    </Button>
  ) : null;
  const primaryBtn = (
    <Button className="min-w-[120px]" disabled={busy} onClick={actions?.primary}>
      {busy && <Loader2 className="size-4 animate-spin" />}
      {actions?.primaryLabel}
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-5 lg:px-8 lg:py-12">
      <header className="space-y-1 lg:space-y-2">
        <p className="text-[12px] font-medium tracking-[1.5px] text-primary uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="font-display text-[20px] font-bold tracking-[-0.02em] text-foreground lg:text-[36px]">
          {t('title')}
        </h1>
        <p className="max-w-[640px] text-[13px] text-muted-foreground lg:text-[16px]">
          {t('subtitle')}
        </p>
      </header>

      <div className="mt-4 lg:mt-8">
        <Stepper step={step} t={t} />
        <MobileProgress step={step} t={t} />
      </div>

      {step === 5 ? (
        <CenteredCard>
          <Check className="mx-auto mb-3 size-10 rounded-full bg-success/10 p-2 text-success" />
          <h2 className="text-xl font-semibold text-foreground">{t('done_title')}</h2>
          <p className="mt-1 text-muted-foreground">{t('done_desc')}</p>
          <Link className={cn(buttonVariants(), 'mt-5')} href="/listings">
            {t('browse')}
          </Link>
        </CenteredCard>
      ) : (
        <div className="mt-4 lg:mt-6 lg:flex lg:items-start lg:gap-8">
          <div className="min-w-0 flex-1 space-y-3 lg:space-y-5">
            <div className={cn(CARD, 'px-4 py-3.5 lg:px-8 lg:pt-7 lg:pb-6')}>
              <StepContent
                acceptOffer={acceptOffer}
                amenityOptions={amenityOptions}
                busy={busy}
                contact={contact}
                details={details}
                districts={districts}
                draft={draft}
                goTo={setStep}
                isAuthenticated={isAuthenticated}
                onUpload={(files) => {
                  void onUpload(files);
                }}
                pricing={pricing}
                removePhoto={removePhoto}
                setAcceptOffer={setAcceptOffer}
                setCaption={setCaption}
                setContact={setContact}
                setDetails={setDetails}
                setPricing={setPricing}
                step={step}
                t={t}
                toggleAmenity={toggleAmenity}
                togglePriceInclude={togglePriceInclude}
              />

              {/* Desktop footer (inside card) */}
              <div className="mt-7 hidden items-center justify-between border-t border-border pt-5 lg:flex">
                {backBtn}
                <div className="flex gap-3">
                  {saveDraftBtn}
                  {primaryBtn}
                </div>
              </div>
            </div>

            {/* Mobile-only checklist + footer */}
            <div className="lg:hidden">
              <ChecklistCard draft={draft} mobile t={t} />
            </div>
            <div className="flex flex-col gap-2 lg:hidden">
              <Button className="h-11 w-full" disabled={busy} onClick={actions?.primary}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {actions?.primaryLabel}
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  className="h-11"
                  disabled={step === 0 || busy}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  variant="ghost"
                >
                  {t('back')}
                </Button>
                {actions?.saveDraft ? (
                  <Button
                    className="h-11"
                    disabled={busy}
                    onClick={() => {
                      void actions.saveDraft();
                    }}
                    variant="outline"
                  >
                    {t('save_draft')}
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            </div>
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden w-[348px] shrink-0 flex-col gap-5 lg:flex">
            <PreviewCard
              details={details}
              districts={districts}
              draft={draft}
              pricing={pricing}
              t={t}
            />
            <ChecklistCard draft={draft} t={t} />
            <TipCard t={t} tipKey={`tip_${STEPS[step]}`} />
          </aside>
        </div>
      )}
    </div>
  );
}

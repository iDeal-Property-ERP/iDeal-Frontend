'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/libs/utils';
import type {
  ManagementAmenity,
  ManagementAmenityInput,
  ManagementDistrict,
  ManagementDistrictInput,
  ManagementFaq,
  ManagementFaqInput,
  ManagementPublicOffer,
  ManagementPublicOfferInput,
} from '@/types/management';

const LOCALES = [
  { code: 'en', label: 'English (EN)' },
  { code: 'uz', label: "O'zbekcha (UZ)" },
  { code: 'ru', label: 'Русский (RU)' },
] as const;

type LangCode = (typeof LOCALES)[number]['code'];

type LocalizedFieldMap = {
  en: string;
  uz: string;
  ru: string;
};

function LanguageTabs(props: { activeLang: LangCode; onSelect: (lang: LangCode) => void }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-border pb-2">
      {LOCALES.map((loc) => (
        <button
          key={loc.code}
          type="button"
          onClick={() => props.onSelect(loc.code)}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
            props.activeLang === loc.code
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}

function initDistrictNames(d?: ManagementDistrict | null): LocalizedFieldMap {
  const trans = d?.translations;
  return {
    en: trans?.en?.name ?? d?.name ?? '',
    uz: trans?.uz?.name ?? '',
    ru: trans?.ru?.name ?? '',
  };
}

function initDistrictCities(d?: ManagementDistrict | null): LocalizedFieldMap {
  const trans = d?.translations;
  return {
    en: trans?.en?.city ?? d?.city ?? 'Tashkent',
    uz: trans?.uz?.city ?? 'Toshkent',
    ru: trans?.ru?.city ?? 'Ташкент',
  };
}

/**
 * District dialog for creating and editing districts with EN/UZ/RU names and cities.
 * @param props - Dialog state and submit handler.
 * @returns Dialog component.
 */
export function DistrictDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  district?: ManagementDistrict | null;
  loading?: boolean;
  onSubmit: (data: ManagementDistrictInput) => Promise<void>;
}) {
  const [activeLang, setActiveLang] = useState<LangCode>('en');
  const [names, setNames] = useState<LocalizedFieldMap>(() => initDistrictNames(props.district));
  const [cities, setCities] = useState<LocalizedFieldMap>(() => initDistrictCities(props.district));

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const enName = names.en;
    const enCity = cities.en;
    await props.onSubmit({
      translations: {
        en: { name: enName, city: enCity },
        uz: {
          name: names.uz.trim() ? names.uz : enName,
          city: cities.uz.trim() ? cities.uz : enCity,
        },
        ru: {
          name: names.ru.trim() ? names.ru : enName,
          city: cities.ru.trim() ? cities.ru : enCity,
        },
      },
    });
    props.onOpenChange(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{props.district ? 'Edit District' : 'Add District'}</DialogTitle>
          <DialogDescription>
            Manage localized district names and cities across EN, UZ, and RU.
          </DialogDescription>
        </DialogHeader>

        <LanguageTabs activeLang={activeLang} onSelect={setActiveLang} />

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>District Name ({activeLang.toUpperCase()}) *</Label>
            <Input
              value={names[activeLang]}
              onChange={(e) => setNames((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              required={activeLang === 'en'}
              placeholder="e.g. Yunusabad"
            />
          </div>
          <div className="space-y-1.5">
            <Label>City ({activeLang.toUpperCase()}) *</Label>
            <Input
              value={cities[activeLang]}
              onChange={(e) => setCities((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              required={activeLang === 'en'}
              placeholder="e.g. Tashkent"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.loading}>
              {props.district ? 'Save Changes' : 'Create District'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function initAmenityNames(a?: ManagementAmenity | null): LocalizedFieldMap {
  const trans = a?.translations;
  return {
    en: trans?.en?.name ?? a?.name ?? '',
    uz: trans?.uz?.name ?? '',
    ru: trans?.ru?.name ?? '',
  };
}

/**
 * Amenity dialog for creating and editing amenities.
 * @param props - Dialog state and submit handler.
 * @returns Dialog component.
 */
export function AmenityDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity?: ManagementAmenity | null;
  loading?: boolean;
  onSubmit: (data: ManagementAmenityInput) => Promise<void>;
}) {
  const [activeLang, setActiveLang] = useState<LangCode>('en');
  const [slug, setSlug] = useState(props.amenity?.slug ?? '');
  const [icon, setIcon] = useState(props.amenity?.icon ?? '');
  const [sortOrder, setSortOrder] = useState<number>(props.amenity?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(props.amenity?.is_active ?? true);
  const [names, setNames] = useState<LocalizedFieldMap>(() => initAmenityNames(props.amenity));

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const enName = names.en;
    await props.onSubmit({
      slug: slug.trim() ? slug : undefined,
      icon: icon.trim() ? icon : null,
      sort_order: sortOrder,
      is_active: isActive,
      translations: {
        en: { name: enName },
        uz: { name: names.uz.trim() ? names.uz : enName },
        ru: { name: names.ru.trim() ? names.ru : enName },
      },
    });
    props.onOpenChange(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{props.amenity ? 'Edit Amenity' : 'Add Amenity'}</DialogTitle>
          <DialogDescription>
            Configure localized amenity names, icon, and sort order.
          </DialogDescription>
        </DialogHeader>

        <LanguageTabs activeLang={activeLang} onSelect={setActiveLang} />

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Amenity Name ({activeLang.toUpperCase()}) *</Label>
            <Input
              value={names[activeLang]}
              onChange={(e) => setNames((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              required={activeLang === 'en'}
              placeholder="e.g. High-Speed Wi-Fi"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Slug / Key</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="wifi" />
            </div>
            <div className="space-y-1.5">
              <Label>Icon Name</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="wifi" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="amenity-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            />
            <div className="space-y-0.5">
              <Label htmlFor="amenity-active" className="cursor-pointer text-xs font-medium">
                Active Status (Show in filters & listing specs)
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.loading}>
              {props.amenity ? 'Save Changes' : 'Create Amenity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function initFaqQuestions(f?: ManagementFaq | null): LocalizedFieldMap {
  const trans = f?.translations;
  return {
    en: trans?.en?.question ?? f?.question ?? '',
    uz: trans?.uz?.question ?? '',
    ru: trans?.ru?.question ?? '',
  };
}

function initFaqAnswers(f?: ManagementFaq | null): LocalizedFieldMap {
  const trans = f?.translations;
  return {
    en: trans?.en?.answer ?? f?.answer ?? '',
    uz: trans?.uz?.answer ?? '',
    ru: trans?.ru?.answer ?? '',
  };
}

/**
 * FAQ dialog for creating and editing FAQs.
 * @param props - Dialog state and submit handler.
 * @returns Dialog component.
 */
export function FaqDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq?: ManagementFaq | null;
  loading?: boolean;
  onSubmit: (data: ManagementFaqInput) => Promise<void>;
}) {
  const [activeLang, setActiveLang] = useState<LangCode>('en');
  const [sortOrder, setSortOrder] = useState<number>(props.faq?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(props.faq?.is_active ?? true);
  const [questions, setQuestions] = useState<LocalizedFieldMap>(() => initFaqQuestions(props.faq));
  const [answers, setAnswers] = useState<LocalizedFieldMap>(() => initFaqAnswers(props.faq));

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const enQ = questions.en;
    const enA = answers.en;
    await props.onSubmit({
      sort_order: sortOrder,
      is_active: isActive,
      translations: {
        en: { question: enQ, answer: enA },
        uz: {
          question: questions.uz.trim() ? questions.uz : enQ,
          answer: answers.uz.trim() ? answers.uz : enA,
        },
        ru: {
          question: questions.ru.trim() ? questions.ru : enQ,
          answer: answers.ru.trim() ? answers.ru : enA,
        },
      },
    });
    props.onOpenChange(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.faq ? 'Edit FAQ Item' : 'Add FAQ Item'}</DialogTitle>
          <DialogDescription>
            Provide localized questions and answers in English, Uzbek, and Russian.
          </DialogDescription>
        </DialogHeader>

        <LanguageTabs activeLang={activeLang} onSelect={setActiveLang} />

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Question ({activeLang.toUpperCase()}) *</Label>
            <Input
              value={questions[activeLang]}
              onChange={(e) => setQuestions((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              required={activeLang === 'en'}
              placeholder="e.g. How does property guarantee work?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Answer ({activeLang.toUpperCase()}) *</Label>
            <Textarea
              value={answers[activeLang]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              required={activeLang === 'en'}
              rows={3}
              placeholder="Detailed answer..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="faq-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            />
            <div className="space-y-0.5">
              <Label htmlFor="faq-active" className="cursor-pointer text-xs font-medium">
                Active Status (Show in public FAQ / Help Center)
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.loading}>
              {props.faq ? 'Save Changes' : 'Create FAQ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function initOfferBodies(o?: ManagementPublicOffer | null): LocalizedFieldMap {
  const trans = o?.translations;
  return {
    en: trans?.en?.body ?? o?.body ?? '',
    uz: trans?.uz?.body ?? '',
    ru: trans?.ru?.body ?? '',
  };
}

/**
 * Public offer dialog for creating and editing legal agreements.
 * @param props - Dialog state and submit handler.
 * @returns Dialog component.
 */
export function PublicOfferDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: ManagementPublicOffer | null;
  loading?: boolean;
  onSubmit: (data: ManagementPublicOfferInput) => Promise<void>;
}) {
  const [activeLang, setActiveLang] = useState<LangCode>('en');
  const [version, setVersion] = useState(props.offer?.version ?? 'v1.0');
  const [isActive, setIsActive] = useState(props.offer?.is_active ?? true);
  const [bodies, setBodies] = useState<LocalizedFieldMap>(() => initOfferBodies(props.offer));

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const enBody = bodies.en;
    await props.onSubmit({
      version,
      is_active: isActive,
      translations: {
        en: { body: enBody },
        uz: { body: bodies.uz.trim() ? bodies.uz : enBody },
        ru: { body: bodies.ru.trim() ? bodies.ru : enBody },
      },
    });
    props.onOpenChange(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{props.offer ? 'Edit Public Offer' : 'Add Public Offer'}</DialogTitle>
          <DialogDescription>
            Maintain legally binding terms and conditions in EN, UZ, and RU.
          </DialogDescription>
        </DialogHeader>

        <LanguageTabs activeLang={activeLang} onSelect={setActiveLang} />

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Version Identifier *</Label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
              placeholder="e.g. v2026.1"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Offer Terms ({activeLang.toUpperCase()}) *</Label>
            <Textarea
              value={bodies[activeLang]}
              onChange={(e) => setBodies((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              required={activeLang === 'en'}
              rows={8}
              placeholder="Terms content..."
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="offer-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            />
            <div className="space-y-0.5">
              <Label htmlFor="offer-active" className="cursor-pointer text-xs font-medium">
                Active Status (Active version applied to new owner onboardings)
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.loading}>
              {props.offer ? 'Save Changes' : 'Create Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

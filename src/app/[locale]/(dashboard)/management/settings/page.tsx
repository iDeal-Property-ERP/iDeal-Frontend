'use client';

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Globe2,
  HelpCircle,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { DangerConfirmDialog } from '@/components/management/dialogs/DangerConfirmDialog';
import {
  AmenityDialog,
  DistrictDialog,
  FaqDialog,
  PublicOfferDialog,
} from '@/components/management/dialogs/LocalizationDialogs';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createManagementAmenity,
  createManagementDistrict,
  createManagementFaq,
  createManagementPublicOffer,
  deleteManagementAmenity,
  deleteManagementDistrict,
  deleteManagementFaq,
  deleteManagementPublicOffer,
  getLocalizationStatusReport,
  getManagementAmenities,
  getManagementDistricts,
  getManagementFaqs,
  getManagementPublicOffers,
  updateManagementAmenity,
  updateManagementDistrict,
  updateManagementFaq,
  updateManagementPublicOffer,
} from '@/libs/management/localizationAdapter';
import { cn } from '@/libs/utils';
import type {
  LocalizationStatusReport,
  ManagementAmenity,
  ManagementDistrict,
  ManagementFaq,
  ManagementPublicOffer,
} from '@/types/management';

type ActiveTab = 'status' | 'districts' | 'amenities' | 'faqs' | 'offers';

/**
 * The Management Settings and Multilingual Content Localization Workspace.
 * Staff can author and inspect EN/UZ/RU translations across districts, amenities,
 * FAQs, and public offers, as well as monitor platform-wide localization completeness.
 * @returns The Settings & Localization page.
 */
export default function ManagementSettingsPage() {
  const t = useTranslations('Management');
  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const [loading, setLoading] = useState(false);

  // Data states
  const [statusReport, setStatusReport] = useState<LocalizationStatusReport | null>(null);
  const [districts, setDistricts] = useState<ManagementDistrict[]>([]);
  const [amenities, setAmenities] = useState<ManagementAmenity[]>([]);
  const [faqs, setFaqs] = useState<ManagementFaq[]>([]);
  const [offers, setOffers] = useState<ManagementPublicOffer[]>([]);

  // Dialog states
  const [districtDialogOpen, setDistrictDialogOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<ManagementDistrict | null>(null);

  const [amenityDialogOpen, setAmenityDialogOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<ManagementAmenity | null>(null);

  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<ManagementFaq | null>(null);

  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ManagementPublicOffer | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => {
      await Promise.resolve();
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'status') {
        const data = await getLocalizationStatusReport();
        setStatusReport(data);
      } else if (activeTab === 'districts') {
        const data = await getManagementDistricts();
        setDistricts(data);
      } else if (activeTab === 'amenities') {
        const data = await getManagementAmenities();
        setAmenities(data);
      } else if (activeTab === 'faqs') {
        const data = await getManagementFaqs();
        setFaqs(data);
      } else if (activeTab === 'offers') {
        const data = await getManagementPublicOffers();
        setOffers(data);
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="flex flex-col gap-6">
      <ManagementPageHeader
        title={t('settings')}
        subtitle="Manage multilingual localization content (EN/UZ/RU) and monitor platform completeness."
        showBell={false}
      />

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === 'status' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('status')}
            className="gap-2 text-xs font-medium"
          >
            <Globe2 className="size-4" />
            Completeness Status
          </Button>
          <Button
            variant={activeTab === 'districts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('districts')}
            className="gap-2 text-xs font-medium"
          >
            <MapPin className="size-4" />
            Districts
          </Button>
          <Button
            variant={activeTab === 'amenities' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('amenities')}
            className="gap-2 text-xs font-medium"
          >
            <Sparkles className="size-4" />
            Amenities
          </Button>
          <Button
            variant={activeTab === 'faqs' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('faqs')}
            className="gap-2 text-xs font-medium"
          >
            <HelpCircle className="size-4" />
            FAQs
          </Button>
          <Button
            variant={activeTab === 'offers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('offers')}
            className="gap-2 text-xs font-medium"
          >
            <FileText className="size-4" />
            Public Offers
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadData()}
          disabled={loading}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* TAB: Completeness Status */}
      {activeTab === 'status' && statusReport && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(statusReport).map(([resourceKey, info]) => (
              <Card key={resourceKey} className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold capitalize">
                    {resourceKey.replaceAll('_', ' ')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {info.complete_count} of {info.total_count} fully translated
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status:</span>
                    {info.incomplete_count === 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-success">
                        <CheckCircle2 className="size-3.5" /> 100% Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-warning">
                        <AlertCircle className="size-3.5" /> {info.incomplete_count} Incomplete
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground">EN Missing</span>
                      <p className="font-semibold">{info.missing_by_language.en}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">UZ Missing</span>
                      <p className="font-semibold">{info.missing_by_language.uz}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">RU Missing</span>
                      <p className="font-semibold">{info.missing_by_language.ru}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Incomplete items audit lists */}
          <div className="space-y-4 rounded-[16px] border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              Incomplete Items Requiring Action
            </h3>
            <div className="space-y-3">
              {Object.entries(statusReport).every(
                ([, info]) => info.incomplete_items.length === 0,
              ) ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-4 text-success" />
                  All resources across the system have complete English, Uzbek, and Russian
                  translations.
                </div>
              ) : (
                Object.entries(statusReport).map(([resourceKey, info]) => {
                  if (info.incomplete_items.length === 0) {
                    return null;
                  }
                  return (
                    <div key={resourceKey} className="space-y-1.5">
                      <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {resourceKey.replaceAll('_', ' ')} ({info.incomplete_items.length})
                      </h4>
                      <div className="divide-y divide-border rounded-lg border border-border bg-muted/30">
                        {info.incomplete_items.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 text-xs"
                          >
                            <span className="font-medium text-foreground">
                              #{item.id} — {item.identifier}
                            </span>
                            <div className="flex gap-2 text-[11px]">
                              {Object.entries(item.missing_by_language).map(([lang, fields]) => (
                                <span
                                  key={lang}
                                  className="rounded bg-danger/10 px-1.5 py-0.5 font-medium text-danger"
                                >
                                  {lang.toUpperCase()}: {fields.join(', ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Districts */}
      {activeTab === 'districts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {districts.length} districts configured for Tashkent and region.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSelectedDistrict(null);
                setDistrictDialogOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="size-4" />
              Add District
            </Button>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">English (EN)</th>
                  <th className="p-3">O&apos;zbekcha (UZ)</th>
                  <th className="p-3">Русский (RU)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {districts.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/20">
                    <td className="p-3 font-mono text-muted-foreground">#{d.id}</td>
                    <td className="p-3">
                      <p className="font-medium text-foreground">
                        {d.translations.en?.name ?? d.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.translations.en?.city ?? d.city}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-foreground">
                        {d.translations.uz?.name ?? '—'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.translations.uz?.city ?? '—'}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-foreground">
                        {d.translations.ru?.name ?? '—'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.translations.ru?.city ?? '—'}
                      </p>
                    </td>
                    <td className="space-x-2 p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setSelectedDistrict(d);
                          setDistrictDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-danger hover:bg-danger-subtle hover:text-danger"
                        onClick={() => {
                          setDeleteConfirm({
                            open: true,
                            title: `Delete district "${d.name}"?`,
                            description: 'This will soft-delete the district.',
                            onConfirm: async () => {
                              await deleteManagementDistrict(d.id);
                              await loadData();
                            },
                          });
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Amenities */}
      {activeTab === 'amenities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {amenities.length} amenities available for properties and search filters.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSelectedAmenity(null);
                setAmenityDialogOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="size-4" />
              Add Amenity
            </Button>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Slug</th>
                  <th className="p-3">English (EN)</th>
                  <th className="p-3">O&apos;zbekcha (UZ)</th>
                  <th className="p-3">Русский (RU)</th>
                  <th className="p-3">Icon</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {amenities.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/20">
                    <td className="p-3 font-mono text-muted-foreground">{a.slug}</td>
                    <td className="p-3 font-medium text-foreground">
                      {a.translations.en?.name ?? a.name}
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      {a.translations.uz?.name ?? '—'}
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      {a.translations.ru?.name ?? '—'}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">
                      {a.icon ?? '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-medium',
                          a.is_active
                            ? 'bg-success/15 text-success'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="space-x-2 p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setSelectedAmenity(a);
                          setAmenityDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-danger hover:bg-danger-subtle hover:text-danger"
                        onClick={() => {
                          setDeleteConfirm({
                            open: true,
                            title: `Delete amenity "${a.name}"?`,
                            description: 'This will remove the amenity from listings.',
                            onConfirm: async () => {
                              await deleteManagementAmenity(a.id);
                              await loadData();
                            },
                          });
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: FAQs */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {faqs.length} FAQ questions published to marketplace and help center.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSelectedFaq(null);
                setFaqDialogOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="size-4" />
              Add FAQ Item
            </Button>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <div
                key={f.id}
                className="space-y-2 rounded-[14px] border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">#{f.id}</span>
                      <h4 className="text-sm font-semibold text-foreground">
                        {f.translations.en?.question ?? f.question}
                      </h4>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.2 text-[10px] font-medium',
                          f.is_active
                            ? 'bg-success/15 text-success'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {f.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {f.translations.en?.answer ?? f.answer}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setSelectedFaq(f);
                        setFaqDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-danger hover:bg-danger-subtle hover:text-danger"
                      onClick={() => {
                        setDeleteConfirm({
                          open: true,
                          title: `Delete FAQ #${f.id}?`,
                          description: 'This will remove the question from the FAQ section.',
                          onConfirm: async () => {
                            await deleteManagementFaq(f.id);
                            await loadData();
                          },
                        });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">UZ:</span>{' '}
                    {f.translations.uz?.question ?? '—'}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">RU:</span>{' '}
                    {f.translations.ru?.question ?? '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Public Offers */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {offers.length} legal offer versions for tenant and owner contracts.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSelectedOffer(null);
                setOfferDialogOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="size-4" />
              Add Public Offer
            </Button>
          </div>

          <div className="space-y-3">
            {offers.map((o) => (
              <div
                key={o.id}
                className="space-y-2 rounded-[14px] border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Version {o.version}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-medium',
                        o.is_active
                          ? 'bg-success/15 text-success'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {o.is_active ? 'Active Offer' : 'Archived'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setSelectedOffer(o);
                        setOfferDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-danger hover:bg-danger-subtle hover:text-danger"
                      onClick={() => {
                        setDeleteConfirm({
                          open: true,
                          title: `Delete Offer ${o.version}?`,
                          description: 'This will soft-delete this public offer version.',
                          onConfirm: async () => {
                            await deleteManagementPublicOffer(o.id);
                            await loadData();
                          },
                        });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="line-clamp-3 rounded-lg bg-muted/40 p-3 font-mono text-[11px] text-muted-foreground">
                  {o.translations.en?.body ?? o.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* District Dialog */}
      <DistrictDialog
        open={districtDialogOpen}
        onOpenChange={setDistrictDialogOpen}
        district={selectedDistrict}
        onSubmit={async (input) => {
          await (selectedDistrict
            ? updateManagementDistrict(selectedDistrict.id, input)
            : createManagementDistrict(input));
          await loadData();
        }}
      />

      {/* Amenity Dialog */}
      <AmenityDialog
        open={amenityDialogOpen}
        onOpenChange={setAmenityDialogOpen}
        amenity={selectedAmenity}
        onSubmit={async (input) => {
          await (selectedAmenity
            ? updateManagementAmenity(selectedAmenity.id, input)
            : createManagementAmenity(input));
          await loadData();
        }}
      />

      {/* FAQ Dialog */}
      <FaqDialog
        open={faqDialogOpen}
        onOpenChange={setFaqDialogOpen}
        faq={selectedFaq}
        onSubmit={async (input) => {
          await (selectedFaq
            ? updateManagementFaq(selectedFaq.id, input)
            : createManagementFaq(input));
          await loadData();
        }}
      />

      {/* Public Offer Dialog */}
      <PublicOfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        offer={selectedOffer}
        onSubmit={async (input) => {
          await (selectedOffer
            ? updateManagementPublicOffer(selectedOffer.id, input)
            : createManagementPublicOffer(input));
          await loadData();
        }}
      />

      {/* Danger Confirm Dialog */}
      <DangerConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title={deleteConfirm.title}
        description={deleteConfirm.description}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          void (async () => {
            await deleteConfirm.onConfirm();
            setDeleteConfirm((prev) => ({ ...prev, open: false }));
          })();
        }}
      />
    </div>
  );
}

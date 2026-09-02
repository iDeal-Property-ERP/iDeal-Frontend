'use client';

import { CalendarDays, Clock, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { BookViewingModal } from '@/components/listings/BookViewingModal';
import { InquiryModal } from '@/components/listings/InquiryModal';
import type { Currency } from '@/types/enums';

const BOOK_BTN =
  'flex h-[52px] w-full items-center justify-center rounded-[12px] bg-primary font-medium text-[15px] text-primary-foreground transition hover:opacity-90';

/**
 * Format a price string as a whole number with its currency (Figma shows no cents).
 * @param price - The raw monthly price string, or null.
 * @param currency - The listing currency.
 * @returns The formatted price (e.g. "$520"), or an em dash when absent.
 */
function formatWhole(price: string | null, currency: Currency): string {
  if (!price) {
    return '—';
  }
  const num = Math.round(Number(price));
  if (Number.isNaN(num)) {
    return '—';
  }
  const formatted = num.toLocaleString('en-US');
  return currency === 'USD' ? `$${formatted}` : `${formatted} UZS`;
}

/**
 * One reassurance row (icon + title + subtitle) in the bottom muted card.
 * @param props - The icon and the two text lines.
 * @returns The row.
 */
function ReassuranceRow(props: { icon: React.ReactNode; title: string; sub: string }) {
  const { icon, title, sub } = props;
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="flex flex-col text-[14px] leading-5">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-muted-foreground">{sub}</span>
      </span>
    </div>
  );
}

/**
 * Listing booking panel (desktop side card + mobile sticky bar).
 * Desktop: sticky price card (price + Call/Message in header, preferred date, Book CTA)
 * + a muted reassurance card. Mobile: sticky bottom bar with Book CTA hovering above price + Call/Message.
 * @param props - The listing id and the monthly price + currency.
 * @returns The responsive booking panel.
 */
export function ListingBooking(props: {
  listingId: number;
  monthlyPrice: string | null;
  currency: Currency;
  engagementType?: string;
  contactPhone?: string | null;
}) {
  const { listingId, monthlyPrice, currency, engagementType, contactPhone } = props;
  const t = useTranslations('ListingDetail');
  const locale = useLocale();
  const isOneOff = engagementType === 'one_off';
  const price = formatWhole(monthlyPrice, currency);

  const phoneHref = useMemo(() => {
    if (!contactPhone) {
      return 'tel:+998937244041';
    }
    const cleanNumber = contactPhone.replaceAll(/\s+/gu, '');
    return cleanNumber.startsWith('tel:') ? cleanNumber : `tel:${cleanNumber}`;
  }, [contactPhone]);

  // Next-available slot for the preferred-date preview — computed from current date + locale.
  const slot = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const label = d.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return `${label} · 14:00`;
  }, [locale]);

  const bookButton = (
    <button className={BOOK_BTN} type="button">
      {t('book_viewing')}
    </button>
  );

  return (
    <>
      {/* Desktop side panel */}
      <div className="sticky top-24 hidden space-y-4 lg:block">
        <div className="space-y-4 rounded-[20px] border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[34px] leading-[38px] font-extrabold tracking-[-0.4px] text-foreground">
                {price}
              </span>
              <span className="text-[15px] text-muted-foreground">{t('per_month')}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={phoneHref}
                aria-label={t('call')}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-medium text-foreground transition hover:bg-muted"
              >
                <Phone className="size-3.5" />
                <span>{t('call')}</span>
              </a>
              <InquiryModal
                listingId={listingId}
                trigger={
                  <button
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-medium text-foreground transition hover:bg-muted"
                    type="button"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>{t('message_ideal')}</span>
                  </button>
                }
              />
            </div>
          </div>
          <div className="h-px w-full bg-border" />
          {!isOneOff && (
            <>
              <BookViewingModal
                listingId={listingId}
                trigger={
                  <button
                    className="flex w-full items-center gap-2.5 rounded-[12px] border border-border bg-card px-3.5 py-3 text-left transition hover:bg-muted"
                    type="button"
                  >
                    <CalendarDays className="size-[18px] shrink-0 text-muted-foreground" />
                    <span className="flex flex-col">
                      <span className="text-[12px] leading-4 font-medium text-muted-foreground">
                        {t('preferred_date')}
                      </span>
                      <span className="text-[14px] leading-5 text-foreground">{slot}</span>
                    </span>
                  </button>
                }
              />
              <BookViewingModal listingId={listingId} trigger={bookButton} />
              <p className="text-center text-[12px] leading-4 text-muted-foreground">
                {t('book_footer')}
              </p>
            </>
          )}
        </div>
        <div className="space-y-3 rounded-[18px] bg-muted p-5">
          <ReassuranceRow
            icon={<ShieldCheck className="size-[18px]" />}
            sub={t('deposit_protected_sub')}
            title={t('deposit_protected')}
          />
          <ReassuranceRow
            icon={<Clock className="size-[18px]" />}
            sub={t('avg_response_sub')}
            title={t('avg_response')}
          />
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2.5 border-t border-border bg-card/95 p-3.5 backdrop-blur-md lg:hidden">
        {!isOneOff && (
          <BookViewingModal
            listingId={listingId}
            trigger={
              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                type="button"
              >
                <CalendarDays className="size-[18px]" />
                {t('book_viewing')}
              </button>
            }
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-baseline gap-1">
            <span className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-foreground">
              {price}
            </span>
            <span className="text-[13px] text-muted-foreground">{t('per_month')}</span>
          </p>
          <div className="flex items-center gap-2">
            <a
              href={phoneHref}
              aria-label={t('call')}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-medium text-foreground transition hover:bg-muted"
            >
              <Phone className="size-3.5" />
              <span>{t('call')}</span>
            </a>
            <InquiryModal
              listingId={listingId}
              trigger={
                <button
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-medium text-foreground transition hover:bg-muted"
                  type="button"
                >
                  <MessageCircle className="size-3.5" />
                  <span>{t('message_ideal')}</span>
                </button>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}

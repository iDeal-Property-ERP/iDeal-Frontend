'use client';

import { CalendarDays, Check, Clock, MessageCircle, ShieldCheck, Phone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { BookViewingModal } from '@/components/listings/BookViewingModal';
import { InquiryModal } from '@/components/listings/InquiryModal';
import type { Currency } from '@/types/enums';

const BOOK_BTN =
  'flex h-[52px] w-full items-center justify-center rounded-[12px] bg-primary font-medium text-[15px] text-primary-foreground transition hover:opacity-90';
const MSG_BTN =
  'flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] border border-border bg-card font-medium text-[15px] text-foreground transition hover:bg-muted';

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
 * Listing booking panel (Figma 34:124 desktop side card + 119:82 mobile sticky bar).
 * Desktop: sticky price card (price, all-inclusive, preferred-date field, Book/Message,
 * footer) + a muted reassurance card. Mobile: a fixed bottom bar with price + Message + Book.
 * @param props - The listing id and the monthly price + currency.
 * @returns The responsive booking panel.
 */
export function ListingBooking(props: {
  listingId: number;
  monthlyPrice: string | null;
  currency: Currency;
  engagementType?: string;
}) {
  const { listingId, monthlyPrice, currency, engagementType } = props;
  const t = useTranslations('ListingDetail');
  const locale = useLocale();
  const isOneOff = engagementType === 'one_off';
  const price = formatWhole(monthlyPrice, currency);
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
  const messageButton = (
    <button className={MSG_BTN} type="button">
      <MessageCircle className="size-[17px]" />
      {t('message_ideal')}
    </button>
  );

  return (
    <>
      {/* Desktop side panel */}
      <div className="sticky top-24 hidden space-y-4 lg:block">
        <div className="space-y-4 rounded-[20px] border border-border bg-card p-6 shadow-lg">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[40px] leading-[44px] font-extrabold tracking-[-0.4px] text-foreground">
              {price}
            </span>
            <span className="text-[16px] text-muted-foreground">{t('per_month')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="size-3.5 text-muted-foreground" />
            <span className="text-[14px] text-muted-foreground">{t('all_inclusive')}</span>
          </div>
          <div className="h-px w-full bg-border" />
          {isOneOff ? (
            <div className="flex items-center gap-2">
              <InquiryModal
                listingId={listingId}
                trigger={
                  <button
                    className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-medium text-primary-foreground transition hover:opacity-90"
                    type="button"
                  >
                    <MessageCircle className="size-[17px]" />
                    {t('message_ideal')}
                  </button>
                }
              />
              <a
                href="tel:+998712000000"
                aria-label="Call"
                className="inline-flex size-[52px] shrink-0 items-center justify-center rounded-[12px] border border-border bg-card text-foreground transition hover:bg-muted"
              >
                <Phone className="size-[20px]" />
              </a>
            </div>
          ) : (
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
              <InquiryModal listingId={listingId} trigger={messageButton} />
            </>
          )}
          <p className="text-center text-[12px] leading-4 text-muted-foreground">
            {t('book_footer')}
          </p>
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
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 lg:hidden">
        <div className="min-w-0">
          <p className="flex items-baseline gap-1">
            <span className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-foreground">
              {price}
            </span>
            <span className="text-[13px] text-muted-foreground">{t('per_month')}</span>
          </p>
          <p className="truncate text-[12px] text-muted-foreground">{t('all_inclusive')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isOneOff ? (
            <>
              <a
                href="tel:+998712000000"
                aria-label="Call"
                className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted"
              >
                <Phone className="size-5" />
              </a>
              <InquiryModal
                listingId={listingId}
                trigger={
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-medium text-primary-foreground transition hover:opacity-90"
                    type="button"
                  >
                    <MessageCircle className="size-[17px]" />
                    {t('message_ideal')}
                  </button>
                }
              />
            </>
          ) : (
            <>
              <InquiryModal
                listingId={listingId}
                trigger={
                  <button
                    aria-label={t('message_ideal')}
                    className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted"
                    type="button"
                  >
                    <MessageCircle className="size-5" />
                  </button>
                }
              />
              <BookViewingModal
                listingId={listingId}
                trigger={
                  <button
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-[15px] font-medium text-primary-foreground transition hover:opacity-90"
                    type="button"
                  >
                    {t('book_viewing')}
                  </button>
                }
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

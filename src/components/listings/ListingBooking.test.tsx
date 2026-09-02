import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ListingBooking } from './ListingBooking';

const messages = {
  ListingDetail: {
    per_month: '/ month',
    call: 'Call',
    message_ideal: 'Chat',
    book_viewing: 'Book a viewing',
    preferred_date: 'Preferred date',
    book_footer: 'Free & no obligation',
    deposit_protected: 'Deposit protected',
    deposit_protected_sub: 'Held in escrow',
    avg_response: 'Avg. response 1 hr',
    avg_response_sub: 'iDeal team',
  },
  Inquiry: {
    title: 'Message iDeal',
    subtitle: 'Ask us anything',
    full_name: 'Full name',
    phone: 'Phone',
    message: 'Your message',
    send: 'Send',
    submitting: 'Sending...',
    success: 'Sent',
    error_required: 'Required',
    error_generic: 'Error',
  },
  BookViewing: {
    title: 'Book a viewing',
    subtitle: 'Pick date',
    full_name: 'Full name',
    phone: 'Phone',
    preferred_date: 'Preferred date',
    preferred_time: 'Preferred time',
    message: 'Message',
    confirm: 'Confirm',
    submitting: 'Sending...',
    success: 'Sent',
    error_required: 'Required',
    error_generic: 'Error',
  },
};

async function renderBooking(props: { contactPhone?: string | null }) {
  return await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ListingBooking
        listingId={123}
        monthlyPrice="500"
        currency="USD"
        contactPhone={props.contactPhone}
      />
    </NextIntlClientProvider>,
  );
}

describe('ListingBooking call button visibility', () => {
  it('renders call link with tel href when contactPhone is provided', async () => {
    const screen = await renderBooking({ contactPhone: '+998 90 123 45 67' });
    const callLinks = screen.container.querySelectorAll('a[href="tel:+998901234567"]');
    expect(callLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('hides call link when contactPhone is null', async () => {
    const screen = await renderBooking({ contactPhone: null });
    const callLinks = screen.container.querySelectorAll('a[href^="tel:"]');
    expect(callLinks).toHaveLength(0);
  });

  it('hides call link when contactPhone is empty string', async () => {
    const screen = await renderBooking({ contactPhone: '' });
    const callLinks = screen.container.querySelectorAll('a[href^="tel:"]');
    expect(callLinks).toHaveLength(0);
  });
});

import { GeistSans } from 'geist/font/sans';
import { headers } from 'next/headers';
import { selectPaymentReturnLocale } from '@/libs/PaymentReturnLocale';
import '@/styles/global.css';

export default async function PaymentReturnLayout(props: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const locale = selectPaymentReturnLocale(requestHeaders.get('accept-language'));

  return (
    <html lang={locale} className={GeistSans.variable}>
      <body>{props.children}</body>
    </html>
  );
}

import { ReactNode } from 'react';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { Providers } from '../providers';

type Props = {
  children: ReactNode;
  params: { locale: string };
};

// Can be imported from a shared config
const locales = ['en', 'de'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: Props) {
  // Validate locale parameter and fallback to default if needed
  const validLocale = locale && locales.includes(locale) ? locale : 'de';
  
  // Enable static rendering
  setRequestLocale(validLocale);

  // Get messages using the proper next-intl function
  const messages = await getMessages();

  return (
    <Providers locale={validLocale} messages={messages}>
      {children}
    </Providers>
  );
}

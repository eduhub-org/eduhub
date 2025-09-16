import { setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

import { HomeContent } from './HomeContent';

// This is a Server Component
type Props = {
  params: { locale: string };
};

export const metadata: Metadata = {
  title: 'EduHub | opencampus.sh',
  description: 'Your platform for educational courses and learning opportunities.',
  openGraph: {
    title: 'EduHub | opencampus.sh',
    images: ['https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png'],
  },
};

export default function HomePage({ params: { locale } }: Props) {
  // Can be imported from a shared config
  const locales = ['en', 'de'];
  
  // Validate locale parameter and fallback to default if needed
  const validLocale = locale && locales.includes(locale) ? locale : 'de';
  
  // Enable static rendering
  setRequestLocale(validLocale);

  return <HomeContent />;
}

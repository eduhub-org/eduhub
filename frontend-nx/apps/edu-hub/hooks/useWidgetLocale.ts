import { useEffect } from 'react';
import { NextRouter } from 'next/router';

/** Switch locale when the widget URL includes `locale=de|en`. */
export const useWidgetLocale = (router: NextRouter, locale: string | string[] | undefined): void => {
  useEffect(() => {
    if (!router.isReady) return;
    if (locale && (locale === 'de' || locale === 'en') && router.locale !== locale) {
      router.push(router.pathname, router.asPath, { locale: locale as string, shallow: true });
    }
  }, [locale, router]);
};

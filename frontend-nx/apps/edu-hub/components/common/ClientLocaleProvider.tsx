'use client';

import useTranslation from 'next-translate/useTranslation';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { de } from 'date-fns/locale/de';
import { enUS } from 'date-fns/locale/en-US';

registerLocale('de', de);
registerLocale('en', enUS);

const ClientLocaleProvider = () => {
  const { lang } = useTranslation('common');

  setDefaultLocale(lang);

  return null; // No UI rendering is needed
};

export default ClientLocaleProvider;

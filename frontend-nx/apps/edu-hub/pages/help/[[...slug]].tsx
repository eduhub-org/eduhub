import { GetStaticPaths, GetStaticProps } from 'next';

import { HelpContent, HelpContentProps } from '../../components/pages/HelpContent';
import { loadManual } from '../../lib/manual/loader';
import { MANUAL_LANGUAGES, ManualLanguage } from '../../lib/manual/markdown';
import { getManualVersion } from '../../lib/manual/version';

/**
 * The EduHub manual (docs/manual), rendered at build time. A page is shown in
 * the user's language; a page not translated yet falls back to the other
 * language with a notice, so every /help link works in both.
 */
const toLanguage = (locale?: string): ManualLanguage => (locale === 'en' ? 'en' : 'de');

export const getStaticPaths: GetStaticPaths = async ({ locales = ['de'] }) => {
  const slugs = new Set(MANUAL_LANGUAGES.flatMap((language) => [...loadManual(language).pages.keys()]));
  return {
    paths: locales.flatMap((locale) =>
      [...slugs].map((slug) => ({ params: { slug: slug ? slug.split('/') : [] }, locale }))
    ),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<HelpContentProps> = async ({ params, locale }) => {
  const slug = ((params?.slug as string[] | undefined) ?? []).join('/');
  const language = toLanguage(locale);
  const own = loadManual(language);
  const other = loadManual(language === 'de' ? 'en' : 'de');
  const found = own.pages.get(slug) ?? other.pages.get(slug);
  if (!found) return { notFound: true };

  const { body, title, summary, audience } = found;
  return {
    props: {
      page: { slug, title, summary, audience, body },
      sections: own.sections,
      isFallback: found.language !== language,
      version: getManualVersion(),
    },
  };
};

export default HelpContent;

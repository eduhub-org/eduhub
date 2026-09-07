import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import { Page } from '../../components/layout/Page';
import EventContent from '../../components/pages/EventContent';

const EventPage: FC = () => {
  const router = useRouter();
  const { sessionId } = router.query;
  const t = useTranslations('event');
  const locale = useLocale();

  const id = parseInt(sessionId as string, 10);

  if (!sessionId || Number.isNaN(id)) {
    return (
      <Page>
        <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32 text-white">
          {t('EventContent.not_found')}
        </div>
      </Page>
    );
  }

  return (
    <>
      <Head>
        <title>{t('seo.title')}</title>
        <meta name="description" content={t('seo.metaDescription')} />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.png" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t('seo.title')} />
        <meta property="og:description" content={t('seo.ogDescription')} />
        <meta property="og:url" content={`https://edu.opencampus.sh/event/${id}`} />
        <meta property="og:site_name" content="EduHub" />
        <meta property="og:image" content="https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png" />
        <meta property="og:locale" content={locale === 'de' ? 'de_DE' : 'en_US'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('seo.title')} />
        <meta name="twitter:description" content={t('seo.twitterDescription')} />
        <meta name="twitter:image" content="https://edu.opencampus.sh/images/edu_WISE23_HeaderWebsitePreview.png" />
      </Head>
      <Page className="text-white">
        <EventContent sessionId={id} />
      </Page>
    </>
  );
};

export default EventPage;

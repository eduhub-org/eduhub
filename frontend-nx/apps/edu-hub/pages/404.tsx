import { FC } from 'react';
import Head from 'next/head';
import { useTranslations, useLocale } from 'next-intl';
import { Page } from '../components/layout/Page';
import { Button } from '../components/common/Button';

const Custom404: FC = () => {
  const t = useTranslations('common');

  return (
    <>
      <Head>
        <title>404 - {t('page_not_found')} | EduHub</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Page className="text-white">
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            {/* Large 404 Number */}
            <div className="mb-8">
              <h1 className="text-9xl sm:text-[12rem] font-bold text-white leading-none mb-4">
                404
              </h1>
              <div className="h-1 w-24 bg-white mx-auto"></div>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
                {t('page_not_found')}
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-md mx-auto">
                {t('page_not_found_description')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button as="link" href="/" filled>
                {t('back_to_home')}
              </Button>
              <Button
                as="button"
                onClick={() => window.history.back()}
                filled
                inverted
              >
                {t('go_back')}
              </Button>
            </div>

            {/* Decorative Elements */}
            <div className="mt-16 opacity-20">
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </Page>
    </>
  );
};

export default Custom404;


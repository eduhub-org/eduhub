import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

export const Footer: FC = () => {
  const t = useTranslations('footer');
  return (
    <footer className="mt-7 sm:mt-20 bg-bg-footer text-white overflow-x-hidden">
      <div className="flex flex-col w-full p-6 md:px-16 max-w-screen-xl mx-auto min-w-0">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 lg:gap-6 w-full min-w-0 max-w-full">
          <div className="order-1 lg:order-2 flex flex-col w-full min-w-0 max-w-full lg:max-w-[49rem]">
            <span className="text-white text-sm font-medium tracking-wide mb-2">
              {t('sponsored_by')}
            </span>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-end justify-center sm:justify-start gap-6 sm:gap-4 bg-white p-6 sm:p-4 rounded w-full max-w-full min-w-0 box-border">
              <a
                href="https://dlc.sh/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-end w-full max-w-[200px] h-[80px] shrink-0"
              >
                <Image
                  src="/images/share/logo_dlc.svg"
                  alt={t('dlc_logo_alt')}
                  width={200}
                  height={80}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="https://www.schleswig-holstein.de"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-end w-full max-w-[400px] h-[80px] min-w-0 sm:flex-1 sm:min-w-[12rem]"
              >
                <Image
                  src="/images/share/foerderlogos_2.svg"
                  alt={t('foerder_logo_alt')}
                  width={400}
                  height={80}
                  priority
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="https://www.kiel.de"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-end w-full max-w-[119px] h-[80px] shrink-0 sm:-ml-4"
              >
                <Image
                  src="/images/share/logo-kiel-sailing-city.svg"
                  alt={t('kiel_sailing_city_logo_alt')}
                  width={119}
                  height={80}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </a>
            </div>
          </div>

          <div className="order-2 lg:order-1 flex flex-col min-w-0 flex-1">
            <h3>
              <span className="text-2xl font-medium">EDU HUB</span>
              <br />
              <span className="text-xl font-light">by opencampus.sh</span>
            </h3>
            <div className="text-sm font-thin mt-4 lg:mt-20">
              <p>
                <Link href="/imprint">{t('imprint')}</Link>
              </p>
              <p>
                <Link href="/privacy">{t('privacy')}</Link>
              </p>
              <p>
                <a href="https://opencampus.gitbook.io/faq/" target="_blank" rel="noopener noreferrer">
                  {t('faq')}
                </a>
              </p>
              <p>
                <a href="https://opencampus.substack.com/" target="_blank" rel="noopener noreferrer">
                  {t('newsletter')}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-8 min-w-0 gap-4">
          <span className="text-sm font-light shrink-0">© 2010 — {new Date().getFullYear()}</span>
          <div className="flex items-center shrink-0">
            <a
              href="https://norden.social/@opencampus_sh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center touch-manipulation"
            >
              <div className="flex h-[23px] w-[23px] items-center">
                <Image
                  src="/images/share/mastodon-icon.svg"
                  alt={t('mastodon_alt')}
                  width={23}
                  height={23}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
            </a>
            <a
              href="https://www.linkedin.com/school/opencampus-sh"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-6 flex min-h-[44px] min-w-[44px] items-center justify-center touch-manipulation sm:ml-20"
            >
              <div className="flex h-[23px] w-[23px] items-center">
                <Image
                  src="/images/share/linkedin-icon.svg"
                  alt={t('linkedin_alt')}
                  width={23}
                  height={23}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
            </a>
            <a
              href="https://www.instagram.com/opencampus.sh?igsh=a3dlN2J4bXo2ejM0"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-6 flex min-h-[44px] min-w-[44px] items-center justify-center touch-manipulation sm:ml-20"
            >
              <div className="flex h-[23px] w-[23px] items-center">
                <Image
                  src="/images/share/instagram-icon.svg"
                  alt={t('instagram_alt')}
                  width={23}
                  height={23}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

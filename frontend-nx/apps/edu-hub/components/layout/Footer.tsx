import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

export const Footer: FC = () => {
  const t = useTranslations('footer');
  return (
    <footer className="mt-7 sm:mt-20 bg-[#0F0F0F] text-white overflow-x-hidden">
      <div className="flex flex-col w-full p-6 md:px-16 max-w-screen-xl mx-auto min-w-0">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 lg:gap-6 w-full min-w-0 max-w-full">
          <div className="order-1 lg:order-2 flex flex-col w-full min-w-0 max-w-full lg:max-w-[36rem]">
            <span className="text-white text-sm font-medium tracking-wide mb-2">
              {t('sponsored_by')}
            </span>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-end justify-center sm:justify-start gap-6 sm:gap-4 bg-white p-6 sm:p-4 rounded w-full max-w-full min-w-0 box-border">
              <div className="flex items-end w-full max-w-[200px] h-[80px] shrink-0">
                <Image
                  src="/images/share/logo_dlc.svg"
                  alt="DLC Logo"
                  width={200}
                  height={80}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-end w-full max-w-[400px] h-[80px] min-w-0 sm:flex-1 sm:min-w-[12rem]">
                <Image
                  src="/images/share/foerderlogos_2.svg"
                  alt="Förder Logo"
                  width={400}
                  height={80}
                  priority
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
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
            <a href="https://norden.social/@opencampus_sh" target="_blank" rel="noopener noreferrer">
              <div className="flex items-center w-[23px] h-[23px]">
                <Image
                  src="/images/share/mastodon-icon.svg"
                  alt="Mastodon"
                  width={23}
                  height={23}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
            </a>
            <a href="https://www.linkedin.com/school/opencampus-sh" target="_blank" rel="noopener noreferrer">
              <div className="ml-6 sm:ml-20 flex items-center w-[23px] h-[23px]">
                <Image
                  src="/images/share/linkedin-icon.svg"
                  alt="LinkedIn"
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
            >
              <div className="ml-6 sm:ml-20 flex items-center w-[23px] h-[23px]">
                <Image
                  src="/images/share/instagram-icon.svg"
                  alt="Instagram"
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

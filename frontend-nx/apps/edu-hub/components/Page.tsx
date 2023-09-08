import { FC, ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import useLogout from '../hooks/logout';

import { Footer } from './Footer';
import { Header } from './Header';
import { useRoleQuery } from '../hooks/authedQuery';
import { AppSettings } from '../queries/__generated__/AppSettings';
import useTranslation from 'next-translate/useTranslation';
import { APP_SETTINGS } from '../queries/appSettings';

type PageProps = {
  children?: ReactNode;
  className?: string;
};

export const Page: FC<PageProps> = ({ children, className }: PageProps) => {
  const { data: session, status } = useSession();
  const logout = useLogout();
  const {lang} = useTranslation();

  const [bannerContent, setBannerContent] = useState('');
  const [isVisible, setIsVisible] = useState(false);

    const {
      loading: appSettingsLoading,
      error: appSettingsError,
    } = useRoleQuery<AppSettings>(APP_SETTINGS, {
      onCompleted: (data) => {
        const appSettings = data.AppSettings[0];
        const fetchedBannerContentDe = appSettings.bannerTextDe;
        const fetchedBannerContentEn = appSettings.bannerTextEn;

        const savedContentDe = localStorage.getItem('bannerContentDe');
        const savedContentEn = localStorage.getItem('bannerContentEn');
        const bannerClosed = localStorage.getItem('bannerClosed');
        if (lang === 'de' && savedContentDe !== fetchedBannerContentDe) {
          setBannerContent(fetchedBannerContentDe);
          setIsVisible(true);
          localStorage.setItem('bannerContentDe', fetchedBannerContentDe);
          localStorage.setItem('bannerClosed', 'false');
        }

        if (lang === 'en' && savedContentEn !== fetchedBannerContentEn) {
          setBannerContent(fetchedBannerContentEn);
          setIsVisible(true);
          localStorage.setItem('bannerContentEn', fetchedBannerContentEn);
          localStorage.setItem('bannerClosed', 'false');
        }
      },
    });

  useEffect(() => {
    if (status !== 'loading' && session?.error === 'RefreshAccessTokenError') {
      logout();
    }
  }, [status, session, logout]);

  // Handle banner visibility
  useEffect(() => {
    const savedContent = localStorage.getItem('bannerContent');
    if (savedContent === bannerContent) {
      setIsVisible(false);
    }
  }, [bannerContent]);

  const handleClose = () => {
    localStorage.setItem('bannerContent', bannerContent);
    setIsVisible(false);
  };

  return (
    <>
      {isVisible && !appSettingsLoading && !appSettingsError && (
        <div className="w-full h-24 bg-black text-white flex justify-between items-center p-4">
          <span>{bannerContent}</span>
          <button onClick={handleClose} className="text-red-400">
            Close
          </button>
        </div>
      )}
      <div className={`flex flex-col ${className} relative`}>
        <Header />
        <main className="">{children}</main>
        <Footer />
      </div>
    </>
  );
};

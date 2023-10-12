import { FC, ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useLogout from '../hooks/logout';
import { Footer } from './Footer';
import { Header } from './Header';
import { useRoleQuery } from '../hooks/authedQuery';
import { AppSettings } from '../queries/__generated__/AppSettings';
import useTranslation from 'next-translate/useTranslation';
import { APP_SETTINGS } from '../queries/appSettings';
import { Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MdClose } from 'react-icons/md';

type PageProps = {
  children?: ReactNode;
  className?: string;
};

export const Page: FC<PageProps> = ({ children, className }) => {
  const { data: session, status } = useSession();
  const logout = useLogout();
  const { lang } = useTranslation();

  const [bannerState, setBannerState] = useState({
    content: '',
    isVisible: false,
  });

  const handleBanner = (contentKey: string, contentValue: string) => {
    if (localStorage.getItem(contentKey) !== contentValue || localStorage.getItem('bannerClosed') !== 'true') {
      setBannerState({
        content: contentValue,
        isVisible: true,
      });
      localStorage.setItem(contentKey, contentValue);
      localStorage.setItem('bannerClosed', 'false');
    }
  };

  const {
    data: appSettingsData,
    loading: appSettingsLoading,
    error: appSettingsError,
  } = useRoleQuery<AppSettings>(APP_SETTINGS, {
    onCompleted: (data) => {
      const appSettings = data.AppSettings[0];
      if (appSettings) {
        if (lang === 'de') handleBanner('bannerContentDe', appSettings.bannerTextDe);
        else if (lang === 'en') handleBanner('bannerContentEn', appSettings.bannerTextEn);
      }
    },
  });

  useEffect(() => {
    if (status !== 'loading' && session?.error === 'RefreshAccessTokenError') logout();
  }, [status, session, logout]);

  const handleBannerClose = () => {
    localStorage.setItem('bannerClosed', 'true');
    setBannerState((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <>
      {/* {bannerState.isVisible && !appSettingsLoading && !appSettingsError && (
        <div className="w-full h-24 bg-black text-white flex justify-between items-center p-4">
          <span>{bannerState.content}</span>
          <button onClick={handleBannerClose} className="text-red-400">
            Close
          </button>
        </div>
      )} */}
      <Transition
        show={bannerState.isVisible && !appSettingsLoading && !appSettingsError}
        enter="transition-transform duration-150 origin-top"
        enterFrom="scale-y-0"
        enterTo="scale-y-100"
        leave="transition-transform duration-150 origin-top"
        leaveFrom="scale-y-100"
        leaveTo="scale-y-0"
      >
        <div
          className={`w-full text-white flex justify-between items-center py-4 md:py-8 px-3 md:px-16`}
          style={{
            backgroundColor: appSettingsData?.AppSettings[0]?.bannerBackgroundColor,
          }}
        >
          <span
            className="prose max-w-none pr-4 md:pr-8 text-lg"
            style={{
              color: appSettingsData?.AppSettings[0]?.bannerFontColor,
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{bannerState.content}</ReactMarkdown>
          </span>
          <button onClick={handleBannerClose} className="text-red-400">
            <MdClose className="w-8 h-8" title="Close" />
          </button>
        </div>
      </Transition>
      <div className={`flex flex-col ${className} relative`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </>
  );
};

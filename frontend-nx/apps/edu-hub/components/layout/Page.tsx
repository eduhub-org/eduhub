import { FC, ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useTranslation from 'next-translate/useTranslation';
import { Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MdClose } from 'react-icons/md';

import useLogout from '../../hooks/logout';
import { Footer } from './Footer';
import { Header } from './Header';
import { useAppSettings } from '../../contexts/AppSettingsContext';

type PageProps = {
  children?: ReactNode;
  className?: string;
};

export const Page: FC<PageProps> = ({ children, className }) => {
  const { data: session, status } = useSession();
  const logout = useLogout();
  const { lang } = useTranslation();
  const {
    bannerBackgroundColor,
    bannerFontColor,
    bannerTextDe,
    bannerTextEn,
    loading: appSettingsLoading,
    error: appSettingsError,
  } = useAppSettings();

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

  useEffect(() => {
    if (bannerTextDe && bannerTextEn) {
      if (lang === 'de') handleBanner('bannerContentDe', bannerTextDe);
      else if (lang === 'en') handleBanner('bannerContentEn', bannerTextEn);
    }
  }, [lang, bannerTextDe, bannerTextEn]);

  useEffect(() => {
    if (status !== 'loading' && session?.error === 'RefreshAccessTokenError') logout();
  }, [status, session, logout]);

  const handleBannerClose = () => {
    localStorage.setItem('bannerClosed', 'true');
    setBannerState((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <>
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
            backgroundColor: bannerBackgroundColor || '',
          }}
        >
          <span
            className="prose max-w-none pr-4 md:pr-8 text-lg"
            style={{
              color: bannerFontColor || '',
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

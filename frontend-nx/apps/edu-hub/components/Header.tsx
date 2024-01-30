import Image from 'next/image';
import Link from 'next/link';
import { FC, MouseEvent, useCallback, useState } from 'react';

import { useIsLoggedIn } from '../hooks/authentication';
import { useUser } from '../hooks/user';
import eduhubLogo from '../public/images/eduhub-logo.svg';
import ocLogo from '../public/images/oc-logo.svg';

import { LoginButton } from './LoginButton';
import { Menu } from './Menu';
import { RegisterButton } from './RegisterButton';
import { Avatar, ClientOnly } from '@opencampus/shared-components';
import { OnlyDesktop } from '@opencampus/shared-components';
import { getPublicUrl } from '../helpers/filehandling';
import useTranslation from 'next-translate/useTranslation';

export const Header: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [menuAnchorElement, setMenuAnchorElement] = useState<HTMLElement>();

  const user = useUser();

  const openMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    setMenuAnchorElement(event.currentTarget);
    setMenuVisible(true);
  }, []);

  const { lang } = useTranslation();
  const isEnglish = lang === 'en';

  const changeLanguage = (lng: string) => {
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split('/');
    const hasLanguageCode = urlParts.length > 3 && urlParts[3].length === 2;

    let newUrl;
    if (hasLanguageCode) {
      urlParts[3] = lng;
      newUrl = urlParts.join('/');
    } else {
      newUrl = `/${lng}${window.location.pathname}`;
    }

    window.location.href = newUrl;
  };

  const userPictureUrl = getPublicUrl(user?.picture);

  return (
    <header className="w-full absolute top-0 left-0 bg-edu-bg-gray bg-opacity-50">
      <div className="flex py-4 px-3 md:px-16 max-w-screen-xl w-full mx-auto justify-between">
        <div className="flex-grow w-full items-center">
          <Link href={`/`}>
            <div className="flex cursor-pointer">
              <div className="flex items-center">
                <Image src={ocLogo} alt="EduHub logo" width={34} height={34} priority />
              </div>
              <div className="flex items-center ml-2">
                <Image src={eduhubLogo} alt="EduHub name" width={46} height={33} priority />
              </div>
            </div>
          </Link>
        </div>
        <div className="mr-2 text-white flex items-center">
          <button onClick={() => changeLanguage('en')} className={`mr-2 ${isEnglish ? 'font-bold' : 'font-light'}`}>
            EN
          </button>
          |
          <button
            onClick={() => changeLanguage('de')}
            className={`mr-6 ml-2 ${isEnglish ? 'font-light' : 'font-bold'}`}
          >
            DE
          </button>
        </div>
        <ClientOnly>
          <div className="flex-shrink ">
            {isLoggedIn ? (
              <div className="flex">
                <div className="flex">
                  <div className="cursor-pointer" onClick={openMenu}>
                    <Avatar imageUrl={userPictureUrl} />
                  </div>
                  {menuAnchorElement ? (
                    <Menu isVisible={isMenuVisible} setVisible={setMenuVisible} anchorElement={menuAnchorElement} />
                  ) : null}
                </div>
              </div>
            ) : null}
            {isLoggedIn ? null : (
              <div className="flex">
                <div className="flex">
                  <LoginButton />
                </div>
                <div className="ml-3">
                  <OnlyDesktop>
                    <RegisterButton />
                  </OnlyDesktop>
                </div>
              </div>
            )}
          </div>
        </ClientOnly>
      </div>
    </header>
  );
};

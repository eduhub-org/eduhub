import Image from 'next/image';
import Link from 'next/link';
import { FC, MouseEvent, useCallback, useState } from 'react';

import { useIsLoggedIn } from '../../hooks/authentication';
import { useUser } from '../../hooks/user';

import { LoginButton } from './LoginButton';
import { Menu } from './Menu';
import { RegisterButton } from './RegisterButton';
import { ClientOnly } from '@opencampus/shared-components';
import { OnlyDesktop } from '@opencampus/shared-components';
import { useLocale } from 'next-intl';
import UserCard from '../common/UserCard';

export const Header: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [menuAnchorElement, setMenuAnchorElement] = useState<HTMLElement>();

  const user = useUser();

  const openMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    setMenuAnchorElement(event.currentTarget);
    setMenuVisible(true);
  }, []);

  const locale = useLocale();
  const isEnglish = locale === 'en';

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

  return (
    <header className="z-10 w-full absolute top-0 left-0" style={{ backgroundColor: 'rgba(34, 34, 34, 0.5)' }}>
      <div className="flex py-4 px-3 md:px-16 max-w-screen-xl w-full mx-auto justify-between">
        <div className="flex-grow w-full items-center">
          <Link href={`/`}>
            <div className="flex cursor-pointer">
              <div className="flex items-center w-[34px] h-[34px]">
                <Image src="/images/oc-logo.svg" alt="EduHub logo" width={34} height={34} priority unoptimized className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center ml-2 w-[46px] h-[33px]">
                <Image src="/images/eduhub-logo.svg" alt="EduHub name" width={46} height={33} priority unoptimized className="w-full h-full object-contain" />
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
            {isLoggedIn && user ? (
              <div className="flex">
                <div className="flex">
                  <div className="cursor-pointer" onClick={openMenu}>
                    <UserCard className="flex items-center" key={`avatar`} user={user} size={`small`} />
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

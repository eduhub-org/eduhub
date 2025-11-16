import Fade from '@mui/material/Fade';
import MaterialMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useCallback } from 'react';
import { useIsAdmin } from '../../hooks/authentication';
import useTranslation from 'next-translate/useTranslation';
import useLogout from '../../hooks/logout';

interface IProps {
  anchorElement: HTMLElement;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

// Replace with styled
const StyledMenu = styled(MaterialMenu)(() => ({
  '& .MuiPaper-root': {
    minWidth: '225px',
    padding: '1rem 2rem',
  },
}));

export const Menu: FC<IProps> = ({ anchorElement, isVisible, setVisible }) => {
  const router = useRouter();
  const hideMenu = useCallback(() => setVisible(false), [setVisible]);

  const handleNavigation = useCallback((href: string) => {
    setVisible(false);
    router.push(href);
  }, [router, setVisible]);

  const isAdmin = useIsAdmin();

  const { t } = useTranslation();

  const logout = useLogout();

  return (
    <StyledMenu
      id="fade-menu"
      anchorEl={anchorElement}
      open={isVisible}
      onClose={hideMenu}
      TransitionComponent={Fade}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem onClick={() => handleNavigation('/profile')}>
        <span className="w-full text-lg">{t('menu.profile')}</span>
      </MenuItem>

      <MenuItem onClick={() => handleNavigation('/my-certificates')}>
        <span className="w-full text-lg">{t('menu.my_certificates')}</span>
      </MenuItem>

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/courses')}>
          <span className="w-full text-lg">{t('menu.courses')}</span>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/programs')}>
          <span className="w-full text-lg">{t('menu.programs')}</span>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/users')}>
          <span className="w-full text-lg">{t('menu.user')}</span>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/organizations')}>
          <span className="w-full text-lg">{t('menu.organizations')}</span>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/location-addresses')}>
          <span className="w-full text-lg">{t('menu.location_addresses')}</span>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/achievement-options')}>
          <span className="w-full text-lg">{t('menu.achievements')}</span>
        </MenuItem>
      )}
      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/achievement-templates')}>
          <span className="w-full text-lg">{t('menu.achievement_templates')}</span>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/statistics')}>
          <span className="w-full text-lg">{t('menu.statistics')}</span>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/email-templates')}>
          <span className="w-full text-lg">{t('menu.email_templates')}</span>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={() => handleNavigation('/manage/app-settings')}>
          <span className="w-full text-lg">{t('menu.app_settings')}</span>
        </MenuItem>
      )}

      <MenuItem onClick={hideMenu}>
        <Link className="w-full text-lg" href="https://opencampus.gitbook.io/faq/" target="_blank" rel="noopener noreferrer">
          {t('menu.faq')}
        </Link>
      </MenuItem>

      <MenuItem onClick={() => logout()}>
        <button className="w-full text-lg text-left">{t('menu.logout')}</button>
      </MenuItem>
    </StyledMenu>
  );
};

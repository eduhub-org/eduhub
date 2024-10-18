import Fade from '@mui/material/Fade';
import MaterialMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
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
  const hideMenu = useCallback(() => setVisible(false), [setVisible]);

  const closeMenu = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

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
      <MenuItem onClick={closeMenu}>
        <Link className="w-full text-lg" href="/profile">
          {t('menu.profile')}
        </Link>
      </MenuItem>

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/manage/courses">
            {t('menu.courses')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/manage/programs">
            {t('menu.programs')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/manage/users">
            {t('menu.user')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/manage/organizations">
            {t('menu.organizations')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/manage/achievement-options">
            {t('menu.achievements')}
          </Link>
        </MenuItem>
      )}
      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/manage/achievement-templates">
            {t('menu.achievement_templates')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/statistics">
            {t('menu.statistics')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/manage/app-settings">
            {t('menu.app_settings')}
          </Link>
        </MenuItem>
      )}

      <MenuItem onClick={closeMenu}>
        <Link className="w-full text-lg" href="https://opencampus.gitbook.io/faq/" target="_blank">
          {t('menu.faq')}
        </Link>
      </MenuItem>

      <MenuItem onClick={() => logout()}>
        <button className="w-full text-lg text-left">{t('menu.logout')}</button>
      </MenuItem>
    </StyledMenu>
  );
};

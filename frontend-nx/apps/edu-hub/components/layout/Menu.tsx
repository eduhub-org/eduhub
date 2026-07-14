import Fade from '@mui/material/Fade';
import MaterialMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useCallback } from 'react';
import { useIsAdmin, useIsInstructor, useIsOrgAdmin } from '../../hooks/authentication';
import { useTranslations } from 'next-intl';
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
    backgroundColor: 'var(--eduhub-fill-primary, #ffffff) !important',
    color: 'var(--eduhub-label-primary, #222222) !important',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  '& .MuiMenuItem-root': {
    color: 'var(--eduhub-label-primary, #222222) !important',
    backgroundColor: 'var(--eduhub-fill-primary, #ffffff) !important',
    padding: '0.75rem 1rem',
    '&:hover': {
      backgroundColor: '#E5E5E5 !important', // Slightly darker than selected for better contrast
    },
    '&.Mui-selected': {
      backgroundColor: 'var(--eduhub-bg-secondary, #F2F2F2) !important',
      borderLeft: '3px solid var(--eduhub-warning)',
      paddingLeft: 'calc(1rem - 3px)',
      '&:hover': {
        backgroundColor: '#E5E5E5 !important', // Slightly darker than selected
      },
    },
  },
}));

export const Menu: FC<IProps> = ({ anchorElement, isVisible, setVisible }) => {
  const router = useRouter();
  const hideMenu = useCallback(() => setVisible(false), [setVisible]);

  const closeMenu = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const isOrgAdmin = useIsOrgAdmin();
  const isInstructorOrAdmin = isAdmin || isInstructor;
  // Organization admins reach the program/course/admin-user management screens (scoped to their own
  // organization). Other manage links remain super-admin only.
  const isAdminOrOrgAdmin = isAdmin || isOrgAdmin;

  const t = useTranslations('common');

  const logout = useLogout();

  const isActiveRoute = (href: string) => {
    if (href.startsWith('http')) return false;
    return router.pathname === href || router.asPath === href;
  };

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
      PaperProps={{
        className: 'light',
      }}
    >
      <MenuItem onClick={closeMenu} selected={isActiveRoute('/profile')}>
        <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/profile">
          {t('menu.profile')}
        </Link>
      </MenuItem>

      <MenuItem onClick={closeMenu} selected={isActiveRoute('/my-certificates')}>
        <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/my-certificates">
          {t('menu.my_certificates')}
        </Link>
      </MenuItem>

      {isAdminOrOrgAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/courses')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/courses">
            {t('menu.courses')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/projects')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/projects">
            {t('menu.projects')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/users')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/users">
            {t('menu.user')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/experts')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/experts">
            {t('menu.experts')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/organizations')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/organizations">
            {t('menu.organizations')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/location-addresses')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/location-addresses">
            {t('menu.location_addresses')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/calendar')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/calendar">
            {t('menu.calendar')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/statistics')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/statistics">
            {t('menu.statistics')}
          </Link>
        </MenuItem>
      )}

      {isAdminOrOrgAdmin && (
        <MenuItem
          onClick={closeMenu}
          selected={isActiveRoute('/manage/settings') || router.pathname.startsWith('/manage/settings/')}
        >
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/settings">
            {t('menu.settings')}
          </Link>
        </MenuItem>
      )}

      {isInstructorOrAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link
            className="block -my-3 -mx-4 py-3 px-4 text-lg"
            href="https://opencampus.gitbook.io/kursleitungshandbuch/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('menu.course_instructor_manual')}
          </Link>
        </MenuItem>
      )}

      <MenuItem onClick={closeMenu}>
        <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="https://opencampus.gitbook.io/faq/" target="_blank">
          {t('menu.faq')}
        </Link>
      </MenuItem>

      <MenuItem onClick={() => logout()}>
        <button className="w-full text-lg text-left">{t('menu.logout')}</button>
      </MenuItem>
    </StyledMenu>
  );
};

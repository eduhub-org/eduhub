import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import ListSubheader from '@mui/material/ListSubheader';
import MaterialMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useCallback } from 'react';
import { useIsAdmin, useIsInstructor, useIsOrgAdmin } from '../../hooks/authentication';
import { useOrgAdminCapabilities } from '../../hooks/orgAdminCapabilities';
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
  '& .MuiListSubheader-root': {
    backgroundColor: 'transparent',
    color: 'var(--eduhub-label-secondary, #666666)',
    fontFamily: 'inherit',
    fontSize: '0.6875rem', // 11px
    fontWeight: 600,
    lineHeight: 2,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '0.5rem 1rem 0.25rem',
  },
  '& .MuiDivider-root': {
    borderColor: '#E5E5E5',
    margin: '0.5rem 0',
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
  const orgAdminCaps = useOrgAdminCapabilities();
  const isInstructorOrAdmin = isAdmin || isInstructor;
  // Organization admins reach the program/course/admin-user management screens (scoped to their own
  // organization). Other manage links remain super-admin only.
  const isAdminOrOrgAdmin = isAdmin || isOrgAdmin;
  // Program-type management entries: super-admins see all three; org admins only see types where
  // they hold the matching canManage* capability on at least one organization.
  const canManageCoursesMenu = isAdmin || (isOrgAdmin && orgAdminCaps.canManageCourses);
  const canManageEventsMenu = isAdmin || (isOrgAdmin && orgAdminCaps.canManageEvents);
  const canManageDegreesMenu = isAdmin || (isOrgAdmin && orgAdminCaps.canManageDegrees);
  // Whether the "Verwaltung" section has any entries for this user (settings is the widest
  // entry — every admin/org admin sees it — so it gates the section header along with the
  // program-type links). Plain instructors have no management entries and skip the section.
  const hasManagement = isAdminOrOrgAdmin || canManageCoursesMenu || canManageEventsMenu || canManageDegreesMenu;

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
      <ListSubheader disableSticky>{t('menu.section_personal')}</ListSubheader>

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

      {hasManagement && <Divider component="li" />}
      {hasManagement && <ListSubheader disableSticky>{t('menu.section_management')}</ListSubheader>}

      {canManageCoursesMenu && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/courses')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/courses">
            {t('menu.courses')}
          </Link>
        </MenuItem>
      )}

      {canManageEventsMenu && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/events')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/events">
            {t('menu.events')}
          </Link>
        </MenuItem>
      )}

      {canManageDegreesMenu && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/degrees')}>
          <Link className="block -my-3 -mx-4 py-3 px-4 text-lg" href="/manage/degrees">
            {t('menu.degrees')}
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

      <Divider component="li" />
      <ListSubheader disableSticky>{t('menu.section_help')}</ListSubheader>

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

      <Divider component="li" />

      <MenuItem onClick={() => logout()}>
        <button className="w-full text-lg text-left">{t('menu.logout')}</button>
      </MenuItem>
    </StyledMenu>
  );
};

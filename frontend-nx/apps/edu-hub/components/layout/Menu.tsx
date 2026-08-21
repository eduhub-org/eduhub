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
    padding: '0.5rem 2rem',
    backgroundColor: 'var(--eduhub-fill-primary) !important',
    color: 'var(--eduhub-label-primary) !important',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  '& .MuiMenuItem-root': {
    color: 'var(--eduhub-label-primary) !important',
    backgroundColor: 'var(--eduhub-fill-primary) !important',
    // Each row renders as a single focusable control (`component={Link}`, or a plain menuitem for
    // logout) rather than wrapping a nested link, so the element that takes focus, the element that
    // navigates and the element that shows the hover highlight are all the same box. That keeps
    // mouse and keyboard activation in sync and makes the whole row — not just the label — clickable.
    padding: '0.375rem 1rem',
    fontSize: '1.125rem',
    lineHeight: 1.375,
    textDecoration: 'none',
    touchAction: 'manipulation',
    // Touch devices get a >=44px target; fine-pointer devices keep the tighter rows so the full
    // admin menu still fits on smaller laptop screens.
    '@media (pointer: coarse)': {
      minHeight: '2.75rem',
    },
    '&:hover': {
      backgroundColor: 'var(--eduhub-fill-disabled) !important', // Slightly darker than selected for better contrast
    },
    '&.Mui-selected': {
      backgroundColor: 'var(--eduhub-bg-secondary) !important',
      // Inset accent bar for the active route — drawn as a box-shadow so it never shifts
      // the layout or renders as a ragged partial border the way a `border-left` would.
      boxShadow: 'inset 3px 0 0 var(--eduhub-warning)',
      '&:hover': {
        backgroundColor: 'var(--eduhub-fill-disabled) !important', // Slightly darker than selected
      },
    },
  },
  '& .MuiListSubheader-root': {
    backgroundColor: 'transparent',
    color: 'var(--eduhub-label-secondary)',
    fontFamily: 'inherit',
    fontSize: '0.6875rem', // 11px
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    // No horizontal padding so the label's left edge lines up with the section
    // dividers (which span the full menu width), sitting left of the item labels.
    padding: '0.5rem 0 0.125rem',
  },
  '& .MuiDivider-root': {
    borderColor: 'var(--eduhub-border-primary)',
    margin: '0.25rem 0',
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

      <MenuItem component={Link} href="/profile" onClick={closeMenu} selected={isActiveRoute('/profile')}>
        {t('menu.profile')}
      </MenuItem>

      <MenuItem
        component={Link}
        href="/my-certificates"
        onClick={closeMenu}
        selected={isActiveRoute('/my-certificates')}
      >
        {t('menu.my_certificates')}
      </MenuItem>

      {hasManagement && <Divider component="li" />}
      {hasManagement && <ListSubheader disableSticky>{t('menu.section_management')}</ListSubheader>}

      {canManageCoursesMenu && (
        <MenuItem
          component={Link}
          href="/manage/courses"
          onClick={closeMenu}
          selected={isActiveRoute('/manage/courses')}
        >
          {t('menu.courses')}
        </MenuItem>
      )}

      {canManageEventsMenu && (
        <MenuItem component={Link} href="/manage/events" onClick={closeMenu} selected={isActiveRoute('/manage/events')}>
          {t('menu.events')}
        </MenuItem>
      )}

      {canManageDegreesMenu && (
        <MenuItem
          component={Link}
          href="/manage/degrees"
          onClick={closeMenu}
          selected={isActiveRoute('/manage/degrees')}
        >
          {t('menu.degrees')}
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem component={Link} href="/manage/users" onClick={closeMenu} selected={isActiveRoute('/manage/users')}>
          {t('menu.user')}
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem
          component={Link}
          href="/manage/experts"
          onClick={closeMenu}
          selected={isActiveRoute('/manage/experts')}
        >
          {t('menu.experts')}
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem
          component={Link}
          href="/manage/calendar"
          onClick={closeMenu}
          selected={isActiveRoute('/manage/calendar')}
        >
          {t('menu.calendar')}
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem component={Link} href="/statistics" onClick={closeMenu} selected={isActiveRoute('/statistics')}>
          {t('menu.statistics')}
        </MenuItem>
      )}

      {isAdminOrOrgAdmin && (
        <MenuItem
          component={Link}
          href="/manage/settings"
          onClick={closeMenu}
          selected={isActiveRoute('/manage/settings') || router.pathname.startsWith('/manage/settings/')}
        >
          {t('menu.settings')}
        </MenuItem>
      )}

      <Divider component="li" />
      <ListSubheader disableSticky>{t('menu.section_help')}</ListSubheader>

      {isInstructorOrAdmin && (
        <MenuItem
          component={Link}
          href="https://opencampus.gitbook.io/kursleitungshandbuch/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          {t('menu.course_instructor_manual')}
        </MenuItem>
      )}

      <MenuItem
        component={Link}
        href="https://opencampus.gitbook.io/faq/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={closeMenu}
      >
        {t('menu.faq')}
      </MenuItem>

      <Divider component="li" />

      <MenuItem onClick={() => logout()}>{t('menu.logout')}</MenuItem>
    </StyledMenu>
  );
};

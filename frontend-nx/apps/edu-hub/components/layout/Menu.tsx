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

// Shared class for the nested navigation links. MUI renders MenuItem as a flex container, so a
// plain block child shrinks to its text width and leaves the rest of the visibly highlighted row
// dead (a click there hits the MenuItem, which only closes the menu without navigating). `w-full`
// plus `self-stretch` make the link span the row in both axes; the row's own padding is moved onto
// the link (MuiMenuItem-root padding is zeroed below) so the hit box and the highlight coincide.
// On touch devices we additionally enforce a >=44px (min-h-11) target; fine-pointer devices keep
// the tighter rows so the full admin menu still fits on smaller laptop screens. The variant is
// written as an arbitrary media query because Tailwind 3 has no built-in `pointer-coarse:`.
const MENU_LINK_CLASS =
  'flex items-center w-full self-stretch py-1.5 px-4 text-lg leading-snug touch-manipulation ' +
  '[@media(pointer:coarse)]:min-h-11';

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
    // The row's padding lives on the nested link/button (see MENU_LINK_CLASS) so that the whole
    // highlighted row is clickable, not just the label.
    padding: 0,
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

      <MenuItem onClick={closeMenu} selected={isActiveRoute('/profile')}>
        <Link className={MENU_LINK_CLASS} href="/profile">
          {t('menu.profile')}
        </Link>
      </MenuItem>

      <MenuItem onClick={closeMenu} selected={isActiveRoute('/my-certificates')}>
        <Link className={MENU_LINK_CLASS} href="/my-certificates">
          {t('menu.my_certificates')}
        </Link>
      </MenuItem>

      {hasManagement && <Divider component="li" />}
      {hasManagement && <ListSubheader disableSticky>{t('menu.section_management')}</ListSubheader>}

      {canManageCoursesMenu && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/courses')}>
          <Link className={MENU_LINK_CLASS} href="/manage/courses">
            {t('menu.courses')}
          </Link>
        </MenuItem>
      )}

      {canManageEventsMenu && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/events')}>
          <Link className={MENU_LINK_CLASS} href="/manage/events">
            {t('menu.events')}
          </Link>
        </MenuItem>
      )}

      {canManageDegreesMenu && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/degrees')}>
          <Link className={MENU_LINK_CLASS} href="/manage/degrees">
            {t('menu.degrees')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/users')}>
          <Link className={MENU_LINK_CLASS} href="/manage/users">
            {t('menu.user')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/experts')}>
          <Link className={MENU_LINK_CLASS} href="/manage/experts">
            {t('menu.experts')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/manage/calendar')}>
          <Link className={MENU_LINK_CLASS} href="/manage/calendar">
            {t('menu.calendar')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu} selected={isActiveRoute('/statistics')}>
          <Link className={MENU_LINK_CLASS} href="/statistics">
            {t('menu.statistics')}
          </Link>
        </MenuItem>
      )}

      {isAdminOrOrgAdmin && (
        <MenuItem
          onClick={closeMenu}
          selected={isActiveRoute('/manage/settings') || router.pathname.startsWith('/manage/settings/')}
        >
          <Link className={MENU_LINK_CLASS} href="/manage/settings">
            {t('menu.settings')}
          </Link>
        </MenuItem>
      )}

      <Divider component="li" />
      <ListSubheader disableSticky>{t('menu.section_help')}</ListSubheader>

      {isInstructorOrAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link
            className={MENU_LINK_CLASS}
            href="https://opencampus.gitbook.io/kursleitungshandbuch/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('menu.course_instructor_manual')}
          </Link>
        </MenuItem>
      )}

      <MenuItem onClick={closeMenu}>
        <Link className={MENU_LINK_CLASS} href="https://opencampus.gitbook.io/faq/" target="_blank">
          {t('menu.faq')}
        </Link>
      </MenuItem>

      <Divider component="li" />

      <MenuItem onClick={() => logout()}>
        <button className={`${MENU_LINK_CLASS} text-left`}>{t('menu.logout')}</button>
      </MenuItem>
    </StyledMenu>
  );
};

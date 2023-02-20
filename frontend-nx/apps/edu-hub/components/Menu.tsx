import Fade from '@material-ui/core/Fade';
import MaterialMenu, { MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useCallback } from 'react';
import { useIsAdmin, useIsInstructor } from '../hooks/authentication';
import useTranslation from 'next-translate/useTranslation';

interface IProps {
  anchorElement: HTMLElement;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

const StyledMenu = withStyles({
  paper: {
    minWidth: '225px',
    padding: '1rem 2rem',
  },
})((props: MenuProps) => (
  <MaterialMenu
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
));

export const Menu: FC<IProps> = ({ anchorElement, isVisible, setVisible }) => {
  const hideMenu = useCallback(() => setVisible(false), [setVisible]);

  const closeMenu = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const { t } = useTranslation();

  const router = useRouter();

  const logout = useCallback(async () => {
    // Fetch Keycloak Logout URL
    const res = await fetch('/api/auth/logout');
    const jsonPayload = await res?.json();
    const url = JSON.parse(jsonPayload).url;

    // Logging user out client side
    await signOut({ redirect: false });

    // Logging user out on keycloak and redirecting back to app
    router.push(url);
  }, [router]);

  return (
    <StyledMenu
      id="fade-menu"
      anchorEl={anchorElement}
      // keepMounted
      open={isVisible}
      onClose={hideMenu}
      TransitionComponent={Fade}
      className="min-w-full"
    >
      <MenuItem onClick={closeMenu}>
        <Link className="w-full text-lg" href="/profile">
          {t('menu-profile')}
        </Link>
      </MenuItem>

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/user-management">
            {t('menu-administration-user')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/courses">
            {t('menu-administration-courses')}
          </Link>
        </MenuItem>
      )}
      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/achievements">
            {t('menu-administration-achievement')}
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/programs">
            {t('menu-administration-programs')}
          </Link>
        </MenuItem>
      )}

      <MenuItem className="w-full text-lg" onClick={() => logout()}>
        {t('menu-logout')}
      </MenuItem>
    </StyledMenu>
  );
};

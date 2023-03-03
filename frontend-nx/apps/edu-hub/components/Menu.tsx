import Fade from '@material-ui/core/Fade';
import MaterialMenu, { MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import Link from 'next/link';
import { FC, useCallback } from 'react';
import { useIsAdmin} from '../hooks/authentication';
import useTranslation from 'next-translate/useTranslation';
import useLogout from '../hooks/logout';

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

  const { t } = useTranslation();

  const logout = useLogout();

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
        <Link href="/profile" passHref>
          <a className="w-full text-lg">{t('menu-profile')}</a>
        </Link>
      </MenuItem>

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link href="/user-management" passHref>
            <a className="w-full text-lg">{t('menu-administration-user')}</a>
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link href="/courses" passHref>
            <a className="w-full text-lg">{t('menu-administration-courses')}</a>
          </Link>
        </MenuItem>
      )}
      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link href="/achievements" passHref>
            <a className="w-full text-lg">
              {t('menu-administration-achievement')}
            </a>
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link href="/programs" passHref>
            <a className="w-full text-lg">
              {t('menu-administration-programs')}
            </a>
          </Link>
        </MenuItem>
      )}

      <MenuItem onClick={() => logout()}>
        <button className="w-full text-lg text-left">{t('menu-logout')}</button>
      </MenuItem>
    </StyledMenu>
  );
};

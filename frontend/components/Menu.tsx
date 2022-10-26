import Fade from "@material-ui/core/Fade";
import MaterialMenu, { MenuProps } from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";
import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useCallback } from "react";
import { useIsAdmin, useIsInstructor } from "../hooks/authentication";

interface IProps {
  anchorElement: HTMLElement;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

const StyledMenu = withStyles({
  paper: {
    minWidth: "225px",
    padding: "1rem 2rem",
  },
})((props: MenuProps) => (
  <MaterialMenu
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
));

const noop = () => {
  /* does nothing, yeah */
};

export const Menu: FC<IProps> = ({ anchorElement, isVisible, setVisible }) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();

  const hideMenu = useCallback(() => setVisible(false), [setVisible]);
  const logout = useCallback(() => {
    const url = keycloak?.createLogoutUrl({
      redirectUri: window.location.href,
    });

    if (!url) return;
    router.push(new URL(url));
    setVisible(false);
  }, [setVisible, router, keycloak]);

  const closeMenu = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

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
      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link href="/profiles">
            <span className="w-full text-lg">Profile</span>
          </Link>
        </MenuItem>
      )}

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link href="/programs">
            <span className="w-full text-lg">Programme</span>
          </Link>
        </MenuItem>
      )}

      {isInstructor && (
        <MenuItem onClick={closeMenu}>
          <Link href="/courses/instructor">
            <span className="w-full text-lg">Kurse (Instruktor)</span>
          </Link>
        </MenuItem>
      )}
      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link href="/courses">
            <span className="w-full text-lg">Kurse (Admin)</span>
          </Link>
        </MenuItem>
      )}
      {isInstructor && (
        <MenuItem onClick={closeMenu}>
          <Link href="/achievements">
            <span className="w-full text-lg">Achievements (Instruktor)</span>
          </Link>
        </MenuItem>
      )}
      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link href="/achievements">
            <span className="w-full text-lg">Achievements (Admin)</span>
          </Link>
        </MenuItem>
      )}
      <MenuItem onClick={logout}>
        <span className="w-full text-lg">Logout</span>
      </MenuItem>
    </StyledMenu>
  );
};

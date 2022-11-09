import Fade from "@material-ui/core/Fade";
import MaterialMenu, { MenuProps } from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";
import { signOut } from "next-auth/react";
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
  const hideMenu = useCallback(() => setVisible(false), [setVisible]);

  const closeMenu = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  const router = useRouter();

  const logout = async () => {
    // Fetch Keycloak Logout URL
    const res = await fetch("/api/auth/logout");
    const jsonPayload = await res?.json();
    const url = JSON.parse(jsonPayload).url;

    // Logging user out client side
    await signOut({ redirect: false });

    // Logging user out on keycloak and redirecting back to app
    router.push(url);
  };
  
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
          <Link href="/user-management">
            <span className="w-full text-lg">User Management</span>
          </Link>
        </MenuItem>
      )}

      <MenuItem onClick={closeMenu}>
        <Link href="/profile">
          <span className="w-full text-lg">Profil</span>
        </Link>
      </MenuItem>

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

      <MenuItem
        onClick={logout}
      >
        <span className="w-full text-lg">Logout</span>
      </MenuItem>
    </StyledMenu>
  );
};

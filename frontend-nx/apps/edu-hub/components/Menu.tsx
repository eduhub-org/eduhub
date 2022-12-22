import Fade from "@material-ui/core/Fade";
import MaterialMenu, { MenuProps } from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";
import { signOut } from "next-auth/react";
import Link from "next/link";
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

export const Menu: FC<IProps> = ({ anchorElement, isVisible, setVisible }) => {
  const hideMenu = useCallback(() => setVisible(false), [setVisible]);

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
          <Link className="w-full text-lg" href="/user-management">
            User Management
          </Link>
        </MenuItem>
      )}

      <MenuItem onClick={closeMenu}>
        <Link className="w-full text-lg" href="/profile">
          Profil
        </Link>
      </MenuItem>

      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/programs">
            Programme
          </Link>
        </MenuItem>
      )}

      {isInstructor && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/courses/instructor">
            Kurse (Instruktor)
          </Link>
        </MenuItem>
      )}
      {isAdmin && (
        <MenuItem onClick={closeMenu}>
          <Link className="w-full text-lg" href="/courses">
            Kurse (Admin)
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

      <MenuItem onClick={() => signOut()}>
        <span className="w-full text-lg">Logout</span>
      </MenuItem>
    </StyledMenu>
  );
};

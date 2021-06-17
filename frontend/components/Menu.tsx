import Fade from "@material-ui/core/Fade";
import MaterialMenu, { MenuProps } from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";
import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { useRouter } from "next/router";
import { FC } from "react";

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
  const { keycloak } = useKeycloak<KeycloakInstance>();
  const router = useRouter();

  return (
    <StyledMenu
      id="fade-menu"
      anchorEl={anchorElement}
      // keepMounted
      open={isVisible}
      onClose={() => setVisible(false)}
      TransitionComponent={Fade}
      className="min-w-full"
    >
      <MenuItem onClick={() => {}}>
        <span className="text-lg font-bold">Profile</span>
      </MenuItem>
      <MenuItem
        onClick={() => {
          const url = keycloak?.createLogoutUrl({
            redirectUri: window.location.href,
          });

          if (!url) return;
          router.push(new URL(url));
          setVisible(false);
        }}
      >
        <span className="text-lg">Logout</span>
      </MenuItem>
    </StyledMenu>
  );
};

import { FC, useCallback, useState } from "react";
import {
  SelectOption,
  StaticComponentProperty,
} from "../../../types/UIComponents";
import EhMenuItem from "../../common/EhMenuItem";
import SidebarMenuItem from "./SidebarMenueItem";

interface IProps {
  sidebarItems: StaticComponentProperty[];
  handleMenuSelection: (obj: StaticComponentProperty) => void;
}
const Sidebar: FC<IProps> = ({ sidebarItems, handleMenuSelection }) => {
  const [menuItems, setMenuItems] = useState(sidebarItems);

  const updateMenuBar = useCallback(
    (selected: StaticComponentProperty) => {
      const newItems = menuItems.map((item) => {
        if (selected.key === item.key) return { ...item, selected: true };
        return { ...item, selected: false };
      });
      setMenuItems(newItems);
    },
    [setMenuItems, menuItems]
  );

  /* #region CallBacks */

  const handleClickOnMenu = useCallback(
    (option: StaticComponentProperty) => {
      updateMenuBar(option);
      handleMenuSelection(option);
    },
    [handleMenuSelection, updateMenuBar]
  );
  /* #endregion */

  return (
    <div className="flex flex-col flex-start space-y-5">
      {menuItems.map((option) => (
        <EhMenuItem
          key={option.key}
          property={option}
          onClickCallback={handleClickOnMenu}
        />
      ))}
    </div>
  );
};

export default Sidebar;

import { TFunction } from "next-i18next";
import { FC, useCallback, useState } from "react";
import { StaticComponentProperty } from "../../types/UIComponents";
import EhMenuItem from "../common/EhMenuItem";
import Searchbar from "../common/Searchbar";

interface IProps {
  t: TFunction;
  handleSearch: (text: string) => void;
  searchText: string;
  topMenuItems: StaticComponentProperty[];
  onMenuItemClick: (property: StaticComponentProperty) => void;
}
const Menubar: FC<IProps> = ({
  t,
  topMenuItems,
  handleSearch,
  searchText,
  onMenuItemClick,
}) => {
  const [menuItems, setMenuItems] = useState(topMenuItems);

  const updateMenuBar = useCallback(
    (selected: StaticComponentProperty) => {
      const newItems = menuItems.map((item) => {
        if (selected.key === item.key) return { ...item, selected: true };
        return { ...item, selected: false };
      });
      setMenuItems(newItems);
    },
    [menuItems, setMenuItems]
  );

  /* #region Callbacks */
  const handleTabClick = useCallback(
    (property: StaticComponentProperty) => {
      updateMenuBar(property);
      onMenuItemClick(property);
    },
    [updateMenuBar, onMenuItemClick]
  );
  /* #region */

  return (
    <div className="flex justify-between mb-5">
      <div className="flex items-center space-x-5">
        {menuItems.map((tab) => (
          <EhMenuItem
            key={tab.key}
            property={tab}
            onClickCallback={handleTabClick}
          />
        ))}
      </div>
      <Searchbar
        onChangeCallback={handleSearch}
        placeholder={t("userSearchPlaceHolder")}
        searchText={searchText}
      />
    </div>
  );
};

export default Menubar;

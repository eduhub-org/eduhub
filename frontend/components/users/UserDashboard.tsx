import { TFunction } from "next-i18next";
import { FC, useCallback, useState } from "react";
import { StaticComponentProperty } from "../../types/UIComponents";
import CommonPageHeader from "../common/CommonPageHeader";
import Menubar from "./Menubar";
import UserList from "./UserList";

interface IProps {
  t: TFunction;
}
const UserDashboard: FC<IProps> = ({ t }) => {
  const menuItems: StaticComponentProperty[] = [
    { key: -1, label: t("all"), selected: true },
    { key: 2, label: "SS20", selected: false },
  ];
  const [searchText, setSearchText] = useState("");

  /* #region Callbacks */
  const handleSearch = useCallback(
    (text: string) => {
      console.log(text);
      setSearchText(text);
    },
    [setSearchText]
  );

  const handleManuItemClick = useCallback(
    (property: StaticComponentProperty) => {
      console.log(property);
    },
    []
  );
  /* #endregion */
  return (
    <>
      <CommonPageHeader headline={t("headline")} />
      <Menubar
        t={t}
        topMenuItems={menuItems}
        handleSearch={handleSearch}
        onMenuItemClick={handleManuItemClick}
        searchText={searchText}
      />
      <UserList t={t} searchedText={searchText} />
    </>
  );
};

export default UserDashboard;

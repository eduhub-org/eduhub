import { TFunction, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC, useCallback, useState } from "react";
import CommonPageHeader from "../../components/common/CommonPageHeader";
import EhMenuItem from "../../components/common/EhMenuItem";
import Searchbar from "../../components/common/Searchbar";
import { Page } from "../../components/Page";
import UserList from "../../components/users/UserList";
import { useIsAdmin, useIsLoggedIn } from "../../hooks/authentication";
import { StaticComponentProperty } from "../../types/UIComponents";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common", "users"])),
  },
});

const Users: FC = () => {
  const { t } = useTranslation("users");
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  return (
    <>
      <Head>
        <title>{t("title")}</title>
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          {isLoggedIn && isAdmin && <UserDashboard t={t} />}
        </div>
      </Page>
    </>
  );
};

export default Users;

interface IProps {
  t: TFunction;
}
const UserDashboard: FC<IProps> = ({ t }) => {
  const menuItems: StaticComponentProperty[] = [
    { key: -1, label: t("all"), selected: true },
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

interface IMenubarProps {
  t: TFunction;
  handleSearch: (text: string) => void;
  searchText: string;
  topMenuItems: StaticComponentProperty[];
  onMenuItemClick: (property: StaticComponentProperty) => void;
}
const Menubar: FC<IMenubarProps> = ({
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

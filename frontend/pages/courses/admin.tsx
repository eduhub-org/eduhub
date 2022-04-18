import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC, useCallback, useState } from "react";
import { Page } from "../../components/Page";
import { useIsInstructor, useIsLoggedIn } from "../../hooks/authentication";
import CourseList from "../../components/courses/admin/CourseList";
import Sidebar from "../../components/courses/admin/Sidebar";
import CommonPageHeader from "../../components/common/CommonPageHeader";
import { StaticComponentProperty } from "../../types/UIComponents";
import { TFunction } from "next-i18next";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["course-admin-page"])),
  },
});

const Admin: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const { t } = useTranslation("course-admin-page");
  return (
    <>
      <Head>{<title>{t("pageTitle")}</title>}</Head>
      <Page>{isLoggedIn && isInstructor && <Dashboard t={t} />}</Page>
    </>
  );
};

export default Admin;

interface IProps {
  t: TFunction;
}
const Dashboard: FC<IProps> = ({ t }) => {
  // TODO: Come up with Valid Category
  const sidebarItems: StaticComponentProperty[] = [
    { key: 0, label: "All Programs", selected: true },
    { key: 1, label: "Tech", selected: false },
    { key: 2, label: "Business", selected: false },
    { key: 3, label: "Creative", selected: false },
    { key: 4, label: "Programmieren", selected: false },
  ];

  const [selected, setSelected] = useState(sidebarItems[0]);

  /* #region Callbacks */
  const handleMenuClick = useCallback(
    (key: StaticComponentProperty) => {
      setSelected(key);
    },
    [setSelected]
  );
  /* #endregion */

  return (
    <>
      <CommonPageHeader headline={t("headline")} />
      <div className="flex flex-row py-5 space-x-5">
        <div className="w-3/12 flex">
          <Sidebar
            handleMenuSelection={handleMenuClick}
            sidebarItems={sidebarItems}
          />
        </div>
        <div className="w-9/12">{<CourseList selectedOption={selected} />}</div>
      </div>
    </>
  );
};

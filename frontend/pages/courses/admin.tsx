import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC, useCallback, useState } from "react";
import { Page } from "../../components/Page";
import { useIsInstructor, useIsLoggedIn } from "../../hooks/authentication";
import CommonPageHeader from "../../components/common/CommonPageHeader";
import { StaticComponentProperty } from "../../types/UIComponents";
import { TFunction } from "next-i18next";
import {
  AdminCourseList,
  AdminCourseListVariables,
  AdminCourseList_Course,
} from "../../queries/__generated__/AdminCourseList";
import { useAdminQuery } from "../../hooks/authedQuery";
import { COURSE_LIST } from "../../queries/courseList";
import Loading from "../../components/courses/Loading";
import { Tile } from "../../components/course/Tile";
import EhMenuItem from "../../components/common/EhMenuItem";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, [
      "course-admin-page",
      "common",
      "user-common",
    ])),
  },
});

const Admin: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const { t } = useTranslation("course-admin-page");
  return (
    <>
      <Head>{<title>{t("pageTitle")}</title>}</Head>
      <Page>
        <div className="min-h-[77vh]">
          {isLoggedIn && isInstructor && <Dashboard t={t} />}
        </div>
      </Page>
    </>
  );
};

export default Admin;

interface IProps {
  t: TFunction;
}
const Dashboard: FC<IProps> = ({ t }) => {
  return (
    <>
      <CommonPageHeader headline={t("headline")} />
      <div className="flex flex-row py-5 space-x-5">
        <div className="w-9/12">{<Courses />}</div>
      </div>
    </>
  );
};

const Courses: FC = () => {
  let courses: AdminCourseList_Course[] = [];
  /* #region DB APIs */
  // TODO: Please Come up with valid instructor ID
  const courseListRequest = useAdminQuery<
    AdminCourseList,
    AdminCourseListVariables
  >(COURSE_LIST, {
    variables: {
      where: { CourseInstructors: { expertId: { _eq: 159 } } },
    },
  });
  /* #endregion */

  if (courseListRequest.loading) {
    return <Loading />;
  }

  if (courseListRequest.error) {
    console.log(courseListRequest.error);
    return <></>;
  }

  if (courseListRequest.data?.Course) {
    courses = courseListRequest.data?.Course;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-5 py-10">
        {courses.map((course) => (
          // TODO: Url of single course
          <div key={`${course.id}`} className="whitespace-normal">
            <Tile course={course} />
          </div>
        ))}
      </div>
    </>
  );
};

interface ISidebarProps {
  sidebarItems: StaticComponentProperty[];
  handleMenuSelection: (obj: StaticComponentProperty) => void;
}
const Sidebar: FC<ISidebarProps> = ({ sidebarItems, handleMenuSelection }) => {
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

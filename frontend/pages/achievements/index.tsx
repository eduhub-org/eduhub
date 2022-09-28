import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC, useCallback, useState } from "react";
import AchievementRow from "../../components/achievements/AchievementRow";
import CommonPageHeader from "../../components/common/CommonPageHeader";
import Loading from "../../components/courses/Loading";
import { Page } from "../../components/Page";
import { ProgramsMenubar } from "../../components/program/ProgramsMenubar";
import { useAdminQuery } from "../../hooks/authedQuery";
import { useIsAdmin, useIsLoggedIn } from "../../hooks/authentication";
import { ADMIN_COURSE_LIST } from "../../queries/courseList";
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from "../../queries/programList";
import {
  AdminCourseList,
  AdminCourseListVariables,
} from "../../queries/__generated__/AdminCourseList";
import {
  Programs,
  Programs_Program,
} from "../../queries/__generated__/Programs";
import { StaticComponentProperty } from "../../types/UIComponents";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, [
      "common",
      "achievements-page",
      "course-page",
    ])),
  },
});
export const QUERY_LIMIT = 15;

const Achievements: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const { t } = useTranslation("achievements-page");
  return (
    <>
      <Head>
        <title>{t("title")}</title>
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          <CommonPageHeader headline={t("page-header")} />
          {isLoggedIn && isAdmin && <DashBoard />}
        </div>
      </Page>
    </>
  );
};
export default Achievements;

// const ProgramConext = createContext();
const DashBoard: FC = () => {
  const programsRequest = useAdminQuery<Programs>(
    PROGRAMS_WITH_MINIMUM_PROPERTIES
  );

  if (programsRequest.error) {
    console.log(programsRequest.error);
  }
  if (programsRequest.loading) {
    return <Loading />;
  }

  const ps = [...(programsRequest?.data?.Program || [])];

  return <>{ps.length > 0 && <Content programs={ps} />}</>;
};

interface IProps {
  programs: Programs_Program[];
}
const Content: FC<IProps> = ({ programs }) => {
  const defaultProgram = programs[0].id;
  const [filter, setFilter] = useState<AdminCourseListVariables>({
    limit: QUERY_LIMIT,
    offset: 0,
    where: { programId: { _eq: defaultProgram } },
  });

  const courseListRequest = useAdminQuery<
    AdminCourseList,
    AdminCourseListVariables
  >(ADMIN_COURSE_LIST, {
    variables: filter,
  });

  const updateFilter = useCallback(
    (newState: AdminCourseListVariables) => {
      setFilter(newState);
    },
    [setFilter]
  );

  if (courseListRequest.error) {
    console.log(courseListRequest.error);
  }

  const onProgramsTabClick = useCallback((menu: StaticComponentProperty) => {
    console.log(menu);
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-5">
        <ProgramsMenubar
          programs={programs}
          defaultProgramId={defaultProgram}
          onTabClicked={onProgramsTabClick}
        />
      </div>
      {courseListRequest.loading ? (
        <Loading />
      ) : (
        courseListRequest.data?.Course && <AchievementList />
      )}
    </div>
  );
};

const AchievementList: FC = () => {
  const { t } = useTranslation("course-page");
  const tableHeaders: string[] = [
    t("tableHeaderTitle"),
    t("tableHeaderInstructor"),
    "Kurse",
    t("tableHeaderProgram"),
  ];

  return (
    <>
      <div className="flex flex-col space-y-10">
        <div className="overflow-x-auto transition-[height]">
          <table className="w-full">
            <thead>
              <tr>
                {tableHeaders.map((text) => {
                  return (
                    <th key={text} className="py-2 px-5">
                      <p className="flex justify-start font-medium text-gray-700 uppercase">
                        {text}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <AchievementRow />
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

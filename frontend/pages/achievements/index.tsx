import { IconButton } from "@material-ui/core";
import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";
import { TFunction, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC, createContext, useCallback, useContext, useState } from "react";
import {
  MdAddCircle,
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";
import AddEditAchievementOption from "../../components/achievements/AddEditAchievementOption";
import CommonPageHeader from "../../components/common/CommonPageHeader";
import EhAddButton from "../../components/common/EhAddButton";
import EhTag from "../../components/common/EhTag";
import TagWithTwoText from "../../components/common/TagWithTwoText";
import Loading from "../../components/courses/Loading";
import { Page } from "../../components/Page";
import { ProgramsMenubar } from "../../components/program/ProgramsMenubar";
import { makeFullName } from "../../helpers/util";
import { useAdminMutation } from "../../hooks/authedMutation";
import { useAdminQuery, useAuthedQuery } from "../../hooks/authedQuery";
import { useIsAdmin, useIsLoggedIn } from "../../hooks/authentication";
import {
  ACHIEVEMENT_OPTIONS,
  ACHIEVEMENT_RECORD_TYPES,
} from "../../queries/achievement";
import { ADMIN_COURSE_LIST } from "../../queries/courseList";
import { EXPERT_LIST } from "../../queries/expert";
import { DELETE_AN_ACHIEVEMENT_OPTION } from "../../queries/mutateAchievement";
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from "../../queries/programList";
import {
  AchievementOptionList,
  AchievementOptionListVariables,
  AchievementOptionList_AchievementOption,
} from "../../queries/__generated__/AchievementOptionList";
import { AchievementRecordTypes } from "../../queries/__generated__/AchievementRecordTypes";
import {
  AdminCourseList,
  AdminCourseListVariables,
  AdminCourseList_Course,
} from "../../queries/__generated__/AdminCourseList";
import {
  DeleteAnAchievementOption,
  DeleteAnAchievementOptionVariables,
} from "../../queries/__generated__/DeleteAnAchievementOption";
import {
  ExpertList,
  ExpertListVariables,
  ExpertList_Expert,
} from "../../queries/__generated__/ExpertList";
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

const achievementOptions: string[] = [
  "ONLINE",
  "DOCUMENTATION",
  "DOCUMENTATION_AND_CSV",
];

interface IContext {
  programs: Programs_Program[];
  achievementRTypes: string[];
  onOffsetChange: (offset: number) => void;
  achievements: AchievementOptionList_AchievementOption[] | [];
  refetch?: () => void;
  course?: AdminCourseList_Course;
}

const DashBoard: FC = () => {
  const programsRequest = useAdminQuery<Programs>(
    PROGRAMS_WITH_MINIMUM_PROPERTIES
  );
  const achievementRecordTypes = useAdminQuery<AchievementRecordTypes>(
    ACHIEVEMENT_RECORD_TYPES
  );

  if (programsRequest.error) {
    console.log(programsRequest.error);
  }
  if (programsRequest.loading || achievementRecordTypes.loading) {
    return <Loading />;
  }

  const art = [
    ...(achievementRecordTypes?.data?.AchievementRecordType.map(
      (record) => record.value
    ) || achievementOptions),
  ];
  const ps = [...(programsRequest?.data?.Program || [])];

  return (
    <>{ps.length > 0 && <Content programs={ps} achievementRTypes={art} />}</>
  );
};

// Start Content

const AchievementContext = createContext({} as IContext);

interface IProps {
  programs: Programs_Program[];
  achievementRTypes: string[];
}
const Content: FC<IProps> = (props) => {
  const defaultProgram = -1; // All tab
  const router = useRouter();

  const [currentProgramId, setCurrentProgramId] = useState(defaultProgram);
  const [offset, setOffset] = useState(0);
  let course: AdminCourseList_Course | undefined;

  if ("courseId" in router.query) {
    const courseID = router.query["courseId"] || 0;
    const courseList = useAdminQuery<AdminCourseList, AdminCourseListVariables>(
      ADMIN_COURSE_LIST,
      {
        variables: {
          where: {
            id: { _eq: courseID as number },
          },
        },
      }
    );

    const c = [...(courseList.data?.Course || [])];
    if (c.length > 0) {
      course = c[0];
    }
  }
  // const { keycloak } = useKeycloak<KeycloakInstance>();
  // const currentExpert = useAuthedQuery<ExpertList, ExpertListVariables>(
  //   EXPERT_LIST,
  //   {
  //     variables: {
  //       where: {
  //         User: { id: { _eq: keycloak?.subject } },
  //       },
  //     },
  //     skip: !keycloak,
  //   }
  // );

  // if (currentExpert.data) console.log(keycloak?.subject);

  const achievementsRequest = useAdminQuery<
    AchievementOptionList,
    AchievementOptionListVariables
  >(ACHIEVEMENT_OPTIONS, {
    variables: {
      limit: QUERY_LIMIT,
      offset,
      where:
        currentProgramId > -1
          ? {
              AchievementOptionCourses: {
                Course: {
                  Program: {
                    id: { _eq: currentProgramId },
                  },
                },
              },
            }
          : {},
    },
  });

  const refetch = useCallback(() => {
    achievementsRequest.refetch();
  }, [achievementsRequest]);

  const [showNewAchievementView, setShowNewAchievementView] = useState(false);

  const onProgramFilterChange = useCallback(
    (menu: StaticComponentProperty) => {
      console.log(menu.key);
      setCurrentProgramId(menu.key);
    },
    [setCurrentProgramId]
  );

  const onOffsetChange = useCallback(
    (os: number) => {
      setOffset(os);
    },
    [setOffset]
  );

  const onSuccessAddEdit = useCallback(
    (success: boolean) => {
      if (success) refetch();
      setShowNewAchievementView(false);
    },
    [refetch, setShowNewAchievementView]
  );

  const addNewAchievement = useCallback(() => {
    setShowNewAchievementView(!showNewAchievementView);
  }, [setShowNewAchievementView, showNewAchievementView]);

  const achievements = [...(achievementsRequest.data?.AchievementOption || [])];

  const provider: IContext = {
    achievementRTypes: props.achievementRTypes,
    onOffsetChange,
    programs: props.programs,
    achievements,
    refetch,
    course: course ?? undefined,
  };
  return (
    <AchievementContext.Provider value={provider}>
      <div className="w-full">
        <div className="flex justify-between mb-5">
          <ProgramsMenubar
            programs={props.programs}
            defaultProgramId={defaultProgram}
            onTabClicked={onProgramFilterChange}
          />
        </div>
        <div className="flex flex-col space-y-1">
          <div className="flex justify-end">
            <EhAddButton
              buttonClickCallBack={addNewAchievement}
              text="Neuen  hinzufügen"
            />
          </div>
          <AchievementList />
          {showNewAchievementView && (
            <div className="flex bg-edu-light-gray py-5">
              <AddEditAchievementOption
                achievementRecordTypes={achievementOptions}
                onSuccess={onSuccessAddEdit}
                course={course}
              />
            </div>
          )}
          {achievements.length > 0 && (
            <div className="flex justify-end">
              <EhAddButton
                buttonClickCallBack={addNewAchievement}
                text="Neuen  hinzufügen"
              />
            </div>
          )}
        </div>
      </div>
    </AchievementContext.Provider>
  );
};

// Start AchievementList
const ml = "ml-[20px]";
const AchievementList: FC = () => {
  const context = useContext(AchievementContext);
  const { t } = useTranslation("course-page");
  const thClass = "font-medium text-gray-700 uppercase";
  const pClass = "flex justify-start " + ml;
  return (
    <>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className={thClass}>
              <p className={pClass}>{t("tableHeaderTitle")}</p>
            </th>
            <th className={thClass}>
              <p className={pClass}>{t("tableHeaderInstructor")}</p>
            </th>
            <th className={thClass}>
              <p className={pClass}>{"Kurse & " + t("tableHeaderProgram")}</p>
            </th>
          </tr>
        </thead>
        <tbody>
          {context.achievements.map(
            (ac: AchievementOptionList_AchievementOption, index) => (
              <AchievementRow key={`listData-${index}`} acop={ac} />
            )
          )}
        </tbody>
      </table>
    </>
  );
};

// Start AchievementRow
interface IPropsForARow {
  acop: AchievementOptionList_AchievementOption;
}
const AchievementRow: FC<IPropsForARow> = (props) => {
  const pClass = "text-gray-700 truncate font-medium ml-[20px]";
  const tdClass = ml;
  const [showDetails, setShowDetails] = useState(false);
  const context = useContext(AchievementContext);

  const handleArrowClick = useCallback(() => {
    setShowDetails((previous) => !previous);
  }, [setShowDetails]);

  const onSuccessAddEdit = useCallback(
    (success: boolean) => {
      if (success && context.refetch) {
        context.refetch();
      }
    },
    [context]
  );

  const [queryDeleteAnAchievement] = useAdminMutation<
    DeleteAnAchievementOption,
    DeleteAnAchievementOptionVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION);

  const onClickDeleteAnAchievement = useCallback(async () => {
    const response = await queryDeleteAnAchievement({
      variables: { id: props.acop.id },
    });
    if (response.errors) {
      console.log("Operation Failed");
      onSuccessAddEdit(false);
    } else {
      onSuccessAddEdit(true);
    }
  }, [queryDeleteAnAchievement, onSuccessAddEdit, props]);
  return (
    <>
      <tr className="bg-edu-row-color h-12">
        <td className={tdClass}>
          {/* Title */}
          <p className={`${pClass} max-w-[350px]`}>{props.acop.title}</p>
        </td>
        <td className={tdClass}>
          {/* Mentoren */}
          <div className={`${ml} flex items-center space-x-2`}>
            {props.acop.AchievementOptionMentors.length > 0 && (
              <EhTag
                tag={{
                  display: makeFullName(
                    props.acop.AchievementOptionMentors[0].Expert.User
                      .firstName,
                    props.acop.AchievementOptionMentors[0].Expert.User.lastName
                  ),
                  id: props.acop.AchievementOptionMentors[0].id,
                }}
              />
            )}
            {/* <MdAddCircle
              className="cursor-pointer inline-block align-middle stroke-cyan-500"
              onClick={handleArrowClick}
            /> */}
          </div>
        </td>
        <td className={ml}>
          {/* Course */}
          <div className={`flex justify-between ${ml}`}>
            <div className="flex items-center space-x-2">
              {props.acop.AchievementOptionCourses.length > 0 && (
                <TagWithTwoText
                  textLeft={props.acop.AchievementOptionCourses[0].Course.title}
                  textRight={
                    props.acop.AchievementOptionCourses[0].Course.Program
                      ?.shortTitle
                  }
                />
              )}
              {/* <MdAddCircle
                className="cursor-pointer inline-block align-middle stroke-cyan-500"
                onClick={handleArrowClick}
              /> */}
            </div>
            <div className="">
              <div className="flex px-3 items-center">
                <button
                  className="focus:ring-2 rounded-md focus:outline-none"
                  role="button"
                  aria-label="option"
                >
                  {showDetails ? (
                    <MdKeyboardArrowUp size={26} onClick={handleArrowClick} />
                  ) : (
                    <MdKeyboardArrowDown size={26} onClick={handleArrowClick} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </td>
        <td className="bg-white">
          {/* Delete button */}
          <IconButton onClick={onClickDeleteAnAchievement} size="small">
            <MdDelete />
          </IconButton>
        </td>
      </tr>

      {showDetails && (
        <tr>
          <td colSpan={3}>
            <div className="flex bg-edu-light-gray pt-5">
              <AddEditAchievementOption
                achievementRecordTypes={context.achievementRTypes}
                onSuccess={onSuccessAddEdit}
                achievementOption={props.acop}
              />
            </div>
          </td>
        </tr>
      )}
      <tr className="h-1" />
    </>
  );
};

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
import {
  useIsAdmin,
  useIsInstructor,
  useIsLoggedIn,
} from "../../hooks/authentication";
import {
  IUserProfile,
  useKeycloakUserProfile,
  useUserId,
} from "../../hooks/user";
import {
  ACHIEVEMENT_OPTIONS,
  ACHIEVEMENT_RECORD_TYPES,
} from "../../queries/achievement";
import { ADMIN_COURSE_LIST } from "../../queries/courseList";
import { EXPERT_LIST } from "../../queries/expert";
import { DELETE_AN_ACHIEVEMENT_OPTION } from "../../queries/mutateAchievement";
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from "../../queries/programList";
import { USERS_WITH_EXPERT_ID } from "../../queries/user";
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
  Programs,
  Programs_Program,
} from "../../queries/__generated__/Programs";
import {
  UsersWithExpertId,
  UsersWithExpertIdVariables,
  UsersWithExpertId_User,
} from "../../queries/__generated__/UsersWithExpertId";
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

interface IContext {
  achievementRTypes: string[];
  refetchAchievementOptions?: () => void;
  isAdmin: boolean;
  isInstructor: boolean;
  course?: AdminCourseList_Course;
  programID: number;
  setProgramID: (id: number) => void;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
}

export const AchievementContext = createContext({} as IContext);

const Achievements: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const { t } = useTranslation("achievements-page");
  const header = isAdmin
    ? "Achievement Administration"
    : "Administration Leistungsnachweise";
  return (
    <>
      <Head>
        <title>{t("title")}</title>
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          <CommonPageHeader headline={header} />
          {isLoggedIn && (isAdmin || isInstructor) && <DashBoard />}
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

const DashBoard: FC = () => {
  const defaultProgram = -1; // All tab

  const router = useRouter();
  const userId = useUserId();
  const profile = useKeycloakUserProfile();
  const [currentProgramId, setCurrentProgramId] = useState(defaultProgram);
  const courseID: number = parseInt(router.query.courseId as string, 10); // {"courseId": 0}
  let course: AdminCourseList_Course | undefined;

  const courseList = useAdminQuery<AdminCourseList, AdminCourseListVariables>(
    ADMIN_COURSE_LIST,
    {
      variables: {
        where: {
          id: { _eq: courseID },
        },
      },
      skip: courseID <= 0,
    }
  );
  const c = [...(courseList.data?.Course || [])];
  if (c.length > 0) {
    course = c[0];
  }
  // const { keycloak } = useKeycloak<KeycloakInstance>();
  // const currentExpert = useAuthedQuery<
  //   UsersWithExpertId,
  //   UsersWithExpertIdVariables
  // >(USERS_WITH_EXPERT_ID, {
  //   variables: {
  //     where: {
  //       id: { _eq: keycloak?.subject },
  //     },
  //   },
  //   skip: !keycloak,
  // });

  const achievementRecordTypes = useAdminQuery<AchievementRecordTypes>(
    ACHIEVEMENT_RECORD_TYPES
  );

  if (achievementRecordTypes.error) {
    console.log(achievementRecordTypes.error);
  }
  const achievementsRequest = useAdminQuery<
    AchievementOptionList,
    AchievementOptionListVariables
  >(ACHIEVEMENT_OPTIONS, {
    variables: {
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

  const aoptions = [...(achievementsRequest.data?.AchievementOption || [])];
  const provider: IContext = {
    achievementRTypes: [
      ...(achievementRecordTypes?.data?.AchievementRecordType.map(
        (v) => v.value
      ) || achievementOptions),
    ],
    refetchAchievementOptions: refetch,
    course: course ?? undefined,
    programID: -1,
    setProgramID: setCurrentProgramId,
    isAdmin: useIsAdmin(),
    isInstructor: useIsInstructor(),
    userProfile: profile,
    userId,
  };

  return (
    <>
      <AchievementContext.Provider value={provider}>
        <Content options={aoptions} />
      </AchievementContext.Provider>
    </>
  );
};

// Start Content

interface IPropsContent {
  options: AchievementOptionList_AchievementOption[];
}
const Content: FC<IPropsContent> = ({ options }) => {
  const context = useContext(AchievementContext);
  const [showNewAchievementView, setShowNewAchievementView] = useState(false);
  const onProgramFilterChange = useCallback(
    (menu: StaticComponentProperty) => {
      context.setProgramID(menu.key);
    },
    [context]
  );

  const onSuccessAddEdit = useCallback(
    (success: boolean) => {
      if (success && context.refetchAchievementOptions) {
        context.refetchAchievementOptions();
      }
      setShowNewAchievementView(false);
    },
    [context, setShowNewAchievementView]
  );

  const programsRequest = useAdminQuery<Programs>(
    PROGRAMS_WITH_MINIMUM_PROPERTIES
  );

  if (programsRequest.error) {
    console.log(programsRequest.error);
  }
  if (programsRequest.loading) {
    <Loading />;
  }
  const addNewAchievement = useCallback(() => {
    setShowNewAchievementView(!showNewAchievementView);
  }, [setShowNewAchievementView, showNewAchievementView]);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-5">
        {!programsRequest.loading && !programsRequest.error && (
          <ProgramsMenubar
            programs={[...(programsRequest?.data?.Program || [])]}
            defaultProgramId={context.programID}
            onTabClicked={onProgramFilterChange}
          />
        )}
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex justify-end">
          <EhAddButton
            buttonClickCallBack={addNewAchievement}
            text="Neuen  hinzufügen"
          />
        </div>
        <AchievementList options={options} />
        {showNewAchievementView && (
          <div className="flex bg-edu-light-gray py-5">
            {/* <AddEditAchievementOption
              achievementRecordTypes={context.achievementRTypes}
              onSuccess={onSuccessAddEdit}
              course={context.course}
              userDetails={context.userDetails}
            /> */}
          </div>
        )}
        {achievementOptions.length > 0 && (
          <div className="flex justify-end">
            <EhAddButton
              buttonClickCallBack={addNewAchievement}
              text="Neuen  hinzufügen"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Start AchievementList
const ml = "ml-[20px]";
const AchievementList: FC<IPropsContent> = ({ options }) => {
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
          {options.map((ac: AchievementOptionList_AchievementOption, index) => (
            <AchievementRow key={`listData-${index}`} acop={ac} />
          ))}
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
      if (success && context.refetchAchievementOptions) {
        context.refetchAchievementOptions();
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
              {/* <AddEditAchievementOption
                achievementRecordTypes={context.achievementRTypes}
                onSuccess={onSuccessAddEdit}
                achievementOption={props.acop}
                userDetails={context.userDetails}
              /> */}
            </div>
          </td>
        </tr>
      )}
      <tr className="h-1" />
    </>
  );
};

import { createContext, FC, MouseEvent, useCallback, useState } from "react";
import { IUserProfile } from "../../../hooks/user";
import { ManagedCourse_Course_by_pk } from "../../../queries/__generated__/ManagedCourse";
import { useKeycloakUserProfile, useUserId } from "../../../hooks/user";
import AchievementOptionDropDown from "../../achievements/AchievementOptionDropDown";
import {
  AchievementOptionCourses,
  AchievementOptionCoursesVariables,
  AchievementOptionCourses_AchievementOptionCourse,
} from "../../../queries/__generated__/AchievementOptionCourses";
import { Button } from "../../common/Button";
import { useAdminQuery } from "../../../hooks/authedQuery";
import { ACHIEVEMENT_OPTION_COURSES } from "../../../queries/achievementOptionCourse";
import { BlockTitle } from "../../common/BlockTitle";
import ModalControl from "../../common/ModalController";
import ProjectResultsUpload from "./ProjectResultsUpload";
import {
  AchievementRecordAuthorList,
  AchievementRecordAuthorListVariables,
} from "../../../queries/__generated__/AchievementRecordAuthorList";
import {
  ACHIEVEMENT_RECORD_AUTHOR_LIST,
  ACHIEVEMENT_RECORD_LIST,
} from "../../../queries/achievementRecord";
import {
  AchievementRecordList,
  AchievementRecordListVariables,
} from "../../../queries/__generated__/AchievementRecordList";
import { makeFullName } from "../../../helpers/util";
interface IContext {
  course: ManagedCourse_Course_by_pk;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
}

export const ProjectResutlUploadContext = createContext({} as IContext);

interface IProps {
  course: ManagedCourse_Course_by_pk;
}

const CourseAchievementOption: FC<IProps> = ({ course }) => {
  const userId = useUserId();
  const profile = useKeycloakUserProfile();
  const [showModal, setShowModal] = useState(false);

  const [selectedAhievementOption, setSelectedAhievementOption] = useState(
    {} as AchievementOptionCourses_AchievementOptionCourse
  );
  const [isVisibleAchievementOptions, setAchievementOptionVisibility] =
    useState(false);
  const [archiveOptionsAnchorElement, setAnchorElement] =
    useState<HTMLElement>();
  /* #region Database*/
  const achievementOptionCourseRequest = useAdminQuery<
    AchievementOptionCourses,
    AchievementOptionCoursesVariables
  >(ACHIEVEMENT_OPTION_COURSES, {
    variables: {
      where:
        course && course.id
          ? {
              courseId: { _eq: course.id },
            }
          : {},
    },
  });

  const aCourseList = [
    ...(achievementOptionCourseRequest.data?.AchievementOptionCourse || []),
  ];

  const achievementRecordListAPI = useAdminQuery<
    AchievementRecordList,
    AchievementRecordListVariables
  >(ACHIEVEMENT_RECORD_LIST, {
    variables: {
      where: {
        _and: [
          {
            achievementOptionId: {
              _eq: selectedAhievementOption.achievementOptionId,
            },
          },
          {
            AchievementRecordAuthors: {
              userId: {
                _eq: userId,
              },
            },
          },
        ],
      },
    },
    skip: !selectedAhievementOption.achievementOptionId,
  });

  const myAchievementRecords = [
    ...(achievementRecordListAPI.data?.AchievementRecord || []),
  ];
  /* #endrgion */

  /* #region Callbacks*/
  const close = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  const upload = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);

  const onAchivementOptionDropdown = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      setAnchorElement(event.currentTarget);
      setAchievementOptionVisibility(true);
    },
    [setAnchorElement, setAchievementOptionVisibility]
  );

  const onItemSelectedFromDropdown = useCallback(
    async (item: AchievementOptionCourses_AchievementOptionCourse) => {
      setSelectedAhievementOption(item);
    },
    [setSelectedAhievementOption]
  );

  /* #endreigon */

  const providerValue: IContext = {
    course: course,
    userProfile: profile,
    userId,
  };
  return (
    <ProjectResutlUploadContext.Provider value={providerValue}>
      <div className="flex flex-col space-y-3 itmes-start">
        <BlockTitle>Leistungsnachweis</BlockTitle>
        <span className="text-lg mt-6">
          Den Leistungsnachweis musst Du bis spätestens zum 16.02.2021
          hochgeladen haben.
        </span>
        <div className="flex mt-10 mb-4">
          {!achievementOptionCourseRequest.loading && aCourseList.length > 0 && (
            <div onClick={onAchivementOptionDropdown}>
              <Button>Wähle einen Leistungsnachweis ↓ </Button>
            </div>
          )}

          {isVisibleAchievementOptions && (
            <AchievementOptionDropDown
              anchorElement={archiveOptionsAnchorElement}
              isVisible={isVisibleAchievementOptions}
              setVisible={setAchievementOptionVisibility}
              courseAchievementOptions={aCourseList}
              callback={onItemSelectedFromDropdown}
            />
          )}
        </div>
        {selectedAhievementOption.id && (
          <div className="flex">
            <Button filled onClick={upload}>
              ↑ Nachweis hochladen
            </Button>
          </div>
        )}
        {selectedAhievementOption.id && myAchievementRecords.length > 0 && (
          <div>
            <p>
              Der letzte Nachweis mit Dir als Autor wurde
              {myAchievementRecords[0].created_at} von
              {profile?.firstName &&
                profile?.lastName &&
                makeFullName(profile.firstName, profile.lastName)}
              hochgeladen.
            </p>
          </div>
        )}
        {selectedAhievementOption.id && myAchievementRecords.length === 0 && (
          <p>
            Bis jetzt wurde noch kein Nachweis mit Dir als Autor hochgeladen.
          </p>
        )}
      </div>
      {showModal && (
        <ModalControl showModal={showModal} onClose={close}>
          <ProjectResultsUpload
            achievementOptionCourse={selectedAhievementOption}
          />
        </ModalControl>
      )}
    </ProjectResutlUploadContext.Provider>
  );
};

export default CourseAchievementOption;

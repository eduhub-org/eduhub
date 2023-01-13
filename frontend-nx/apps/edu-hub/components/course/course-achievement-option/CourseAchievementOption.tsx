import { createContext, FC, MouseEvent, useCallback, useState } from 'react';
import { IUserProfile } from '../../../hooks/user';
import { useKeycloakUserProfile, useUserId } from '../../../hooks/user';
import AchievementOptionDropDown from '../../achievements/AchievementOptionDropDown';
import {
  AchievementOptionCourses,
  AchievementOptionCoursesVariables,
  AchievementOptionCourses_AchievementOptionCourse,
} from '../../../queries/__generated__/AchievementOptionCourses';
import { Button } from '../../common/Button';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { ACHIEVEMENT_OPTION_COURSES } from '../../../queries/achievementOptionCourse';
import { BlockTitle } from '@opencampus/shared-components';
import ModalControl from '../../common/ModalController';
import ProjectResultsUpload from './AchievementResultsUpload';

import { ACHIEVEMENT_RECORD_LIST } from '../../../queries/achievementRecord';
import {
  AchievementRecordList,
  AchievementRecordListVariables,
} from '../../../queries/__generated__/AchievementRecordList';
import {
  makeFullName,
  formattedDate,
  formattedDateWithTime,
} from '../../../helpers/util';
import { AlertMessageDialog } from '../../common/dialogs/AlertMessageDialog';
import { Translate } from 'next-translate';
import { ManagedCourse_Course_by_pk } from '../../../queries/__generated__/ManagedCourse';
interface IContext {
  course: ManagedCourse_Course_by_pk;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
  t: Translate;
  setAlertMessage: (value: string) => void;
}

export const ProjectResultUploadContext = createContext({} as IContext);

interface IProps {
  course: ManagedCourse_Course_by_pk;
  t: Translate;
}

const CourseAchievementOption: FC<IProps> = ({ course, t }) => {
  const userId = useUserId();
  const profile = useKeycloakUserProfile();
  const [showModal, setShowModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [selectedAchievementOption, setSelectedAchievementOption] = useState(
    {} as AchievementOptionCourses_AchievementOptionCourse
  );
  const [isVisibleAchievementOptions, setAchievementOptionVisibility] =
    useState(false);
  const [archiveOptionsAnchorElement, setAnchorElement] =
    useState<HTMLElement>();
  /* #region Database */
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
              _eq: selectedAchievementOption.achievementOptionId,
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
    skip: !selectedAchievementOption.achievementOptionId,
  });

  const myAchievementRecords = [
    ...(achievementRecordListAPI.data?.AchievementRecord || []),
  ];

  /* #endregion */

  /* #region Callbacks*/
  const close = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  const upload = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);

  const onAchievementOptionDropdown = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      setAnchorElement(event.currentTarget);
      setAchievementOptionVisibility(true);
    },
    [setAnchorElement, setAchievementOptionVisibility]
  );

  const onItemSelectedFromDropdown = useCallback(
    async (item: AchievementOptionCourses_AchievementOptionCourse) => {
      setSelectedAchievementOption(item);
    },
    [setSelectedAchievementOption]
  );

  const closeAlertDialog = useCallback(() => {
    setAlertMessage('');
  }, [setAlertMessage]);

  const onSuccess = useCallback(() => {
    setShowModal(false);
    achievementRecordListAPI.refetch();
  }, [setShowModal, achievementRecordListAPI]);
  /* #endregion */

  const providerValue: IContext = {
    course: course,
    userProfile: profile,
    userId,
    t,
    setAlertMessage,
  };
  return (
    <ProjectResultUploadContext.Provider value={providerValue}>
      {alertMessage.trim().length > 0 && (
        <AlertMessageDialog
          alert={alertMessage}
          confirmationText={'OK'}
          onClose={closeAlertDialog}
          open={alertMessage.trim().length > 0}
        />
      )}

      <div className="flex flex-col space-y-3 items-start">
        <BlockTitle>{t('achievement-option')}</BlockTitle>
        <span className="text-lg mt-6">
          {t('achievement-record-upload-dead-line-text', {
            date: formattedDate(course.Program.achievementRecordUploadDeadline),
          })}
        </span>
        <div className="flex mt-10 mb-4">
          {!achievementOptionCourseRequest.loading &&
            aCourseList.length > 0 && (
              <div onClick={onAchievementOptionDropdown}>
                <Button>{`${t('choose-achievement-option')} ↓`}</Button>
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
        {selectedAchievementOption.id && (
          <div className="flex">
            <Button filled onClick={upload}>
              {`↑ ${t('upload-proof')}`}
            </Button>
          </div>
        )}
        {selectedAchievementOption.id && myAchievementRecords.length > 0 && (
          <p>
            {t('last-upload-from-a-author', {
              dateTime: formattedDateWithTime(
                new Date(myAchievementRecords[0].created_at)
              ),
              fullName: makeFullName(profile.firstName, profile.lastName),
            })}
          </p>
        )}

        {selectedAchievementOption.id && myAchievementRecords.length === 0 && (
          <p>{t('no-proof-uploaded-by-me-as-author')}</p>
        )}
      </div>
      {showModal && (
        <ModalControl showModal={showModal} onClose={close}>
          <ProjectResultsUpload
            achievementOptionCourse={selectedAchievementOption}
            onSuccess={onSuccess}
          />
        </ModalControl>
      )}
    </ProjectResultUploadContext.Provider>
  );
};

export default CourseAchievementOption;

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
import { useAuthedQuery } from '../../../hooks/authedQuery';
import { BlockTitle } from '@opencampus/shared-components';
import ModalControl from '../../common/ModalController';
import FormToUploadAchievementRecord from './FormToUploadAchievementRecord';
import {
  makeFullName,
  formattedDate,
  formattedDateWithTime,
} from '../../../helpers/util';
import { AlertMessageDialog } from '../../common/dialogs/AlertMessageDialog';
import { Translate } from 'next-translate';
import { ACHIEVEMENT_OPTION_COURSES } from '../../../queries/achievementOption';
import { ACHIEVEMENT_RECORD_AUTHORS } from 'apps/edu-hub/queries/AchievementRecordAuthor';
import {
  AchievementRecordAuthorQuery,
  AchievementRecordAuthorQueryVariables,
} from 'apps/edu-hub/queries/__generated__/AchievementRecordAuthorQuery';
interface IContext {
  achievementRecordUploadDeadline: any;
  courseTitle: string;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
  t: Translate;
  setAlertMessage: (value: string) => void;
}

export const ProjectResultUploadContext = createContext({} as IContext);

interface IProps {
  courseId: number;
  achievementRecordUploadDeadline: any;
  t: Translate;
  courseTitle: string;
}

const CourseAchievementOption: FC<IProps> = ({
  courseId,
  achievementRecordUploadDeadline,
  courseTitle,
  t,
}) => {
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
  const query = useAuthedQuery<
    AchievementOptionCourses,
    AchievementOptionCoursesVariables
  >(ACHIEVEMENT_OPTION_COURSES, {
    variables: {
      where: {
        courseId: { _eq: courseId },
      },
    },
    skip: courseId <= 0,
  });

  const aCourseList = [...(query.data?.AchievementOptionCourse || [])];
  const myRecordsQuery = useAuthedQuery<
    AchievementRecordAuthorQuery,
    AchievementRecordAuthorQueryVariables
  >(ACHIEVEMENT_RECORD_AUTHORS, {
    variables: {
      where: {
        _and: [
          {
            achievementRecordId: {
              _eq: selectedAchievementOption.achievementOptionId,
            },
          },
          {
            userId: { _eq: userId },
          },
        ],
      },
    },
    skip: !selectedAchievementOption.achievementOptionId,
  });

  const myAchievementRecords = [
    ...(myRecordsQuery.data?.AchievementRecordAuthor || []),
  ];

  // console.log(
  //   myAchievementRecords,
  //   selectedAchievementOption.achievementOptionId,
  //   userId
  // );
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
    myRecordsQuery.refetch();
  }, [myRecordsQuery]);
  /* #endregion */

  const providerValue: IContext = {
    achievementRecordUploadDeadline: achievementRecordUploadDeadline,
    userProfile: profile,
    userId,
    courseTitle,
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
            date: formattedDate(achievementRecordUploadDeadline),
          })}
        </span>
        <div className="flex mt-10 mb-4">
          {!query.loading && aCourseList.length > 0 && (
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
          <FormToUploadAchievementRecord
            achievementOptionId={selectedAchievementOption.achievementOptionId}
            csvTemplateUrl={
              selectedAchievementOption.AchievementOption.csvTemplateUrl
            }
            documentationTemplateUrl={
              selectedAchievementOption.AchievementOption
                .documentationTemplateUrl
            }
            recordType={selectedAchievementOption.AchievementOption.recordType}
            title={selectedAchievementOption.AchievementOption.title}
            onSuccess={onSuccess}
            courseTitle={courseTitle}
            setAlertMessage={setAlertMessage}
            userId={userId}
          />
        </ModalControl>
      )}
    </ProjectResultUploadContext.Provider>
  );
};

export default CourseAchievementOption;

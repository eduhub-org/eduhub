import {
  createContext,
  FC,
  MouseEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { IUserProfile } from '../../../../hooks/user';
import { useKeycloakUserProfile, useUserId } from '../../../../hooks/user';
import AchievementOptionDropDown from '../../../achievements/AchievementOptionDropDown';
import {
  AchievementOptionCourses,
  AchievementOptionCoursesVariables,
} from '../../../../queries/__generated__/AchievementOptionCourses';
import { Button } from '../../../common/Button';
import { useAuthedQuery } from '../../../../hooks/authedQuery';
import { BlockTitle } from '@opencampus/shared-components';
import FormToUploadAchievementRecord from '../../../FormToUploadAchievementRecord';
import {
  makeFullName,
  formattedDate,
  formattedDateWithTime,
} from '../../../../helpers/util';
import { AlertMessageDialog } from '../../../common/dialogs/AlertMessageDialog';
import { Translate } from 'next-translate';
import { ACHIEVEMENT_OPTION_COURSES } from '../../../../queries/achievementOption';

import { order_by } from '../../../../__generated__/globalTypes';
import {
  AchievementRecordListWithAuthors,
  AchievementRecordListWithAuthorsVariables,
  AchievementRecordListWithAuthors_AchievementRecord,
} from '../../../../queries/__generated__/AchievementRecordListWithAuthors';
import { ACHIEVEMENT_RECORDS_WITH_AUTHORS } from '../../../../queries/achievementRecord';
import { Link } from '@material-ui/core';
import { MinAchievementOption } from '../../../../helpers/achievement';
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
  const [myRecords, setMyRecords] = useState(
    null as AchievementRecordListWithAuthors_AchievementRecord
  );

  const [selectedAchievementOption, setSelectedAchievementOption] = useState(
    {} as MinAchievementOption
  );
  const [isVisibleAchievementOptions, setAchievementOptionVisibility] =
    useState(false);
  const [archiveOptionsAnchorElement, setAnchorElement] =
    useState<HTMLElement>();
  const [achievementOptions, setAchievementOptions] = useState(
    [] as MinAchievementOption[]
  );

  /* #region Database */
  const query = useAuthedQuery<
    AchievementOptionCourses,
    AchievementOptionCoursesVariables
  >(ACHIEVEMENT_OPTION_COURSES);

  useEffect(() => {
    const options = [...(query.data?.AchievementOptionCourse || [])];
    setAchievementOptions(options.map((options) => options.AchievementOption));
  }, [query.data?.AchievementOptionCourse]);

  const myRecordsQuery = useAuthedQuery<
    AchievementRecordListWithAuthors,
    AchievementRecordListWithAuthorsVariables
  >(ACHIEVEMENT_RECORDS_WITH_AUTHORS, {
    variables: {
      where: {
        _and: [
          {
            achievementOptionId: {
              _eq: selectedAchievementOption.id,
            },
          },
          {
            AchievementRecordAuthors: { userId: { _eq: userId } },
          },
        ],
      },
      orderBy: { created_at: order_by.desc },
      limit: 1,
    },
  });

  /* #endregion */

  useEffect(() => {
    const r = myRecordsQuery.data?.AchievementRecord[0] || null;
    setMyRecords(r);
  }, [myRecordsQuery]);
  /* #region Callbacks*/
  const onClosed = useCallback(() => {
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
    async (item: MinAchievementOption) => {
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
          {!query.loading && achievementOptions.length > 0 && (
            <div onClick={onAchievementOptionDropdown}>
              <Button>{`${t('choose-achievement-option')} ↓`}</Button>
            </div>
          )}

          {isVisibleAchievementOptions && (
            <AchievementOptionDropDown
              anchorElement={archiveOptionsAnchorElement}
              isVisible={isVisibleAchievementOptions}
              setVisible={setAchievementOptionVisibility}
              courseAchievementOptions={achievementOptions}
              callback={onItemSelectedFromDropdown}
            />
          )}
        </div>
        {selectedAchievementOption.id && (
          <Link
            href={`../achievements/${selectedAchievementOption.id}?courseId=${courseId}`}
          >
            {selectedAchievementOption.title}
          </Link>
        )}
        {selectedAchievementOption.id && (
          <div className="flex">
            <Button filled onClick={upload}>
              {`↑ ${t('upload-proof')}`}
            </Button>
          </div>
        )}
        {selectedAchievementOption.id && myRecords && (
          <p>
            {t('last-upload-from-a-author', {
              dateTime: formattedDateWithTime(new Date(myRecords.created_at)),
              fullName: makeFullName(profile.firstName, profile.lastName),
            })}
          </p>
        )}

        {selectedAchievementOption.id && !myRecords && (
          <p>{t('no-proof-uploaded-by-me-as-author')}</p>
        )}
      </div>
      {showModal && (
        <FormToUploadAchievementRecord
          onClose={onClosed}
          achievementOption={selectedAchievementOption}
          onSuccess={onSuccess}
          courseTitle={courseTitle}
          setAlertMessage={setAlertMessage}
          userId={userId}
          courseId={courseId}
        />
      )}
    </ProjectResultUploadContext.Provider>
  );
};

export default CourseAchievementOption;

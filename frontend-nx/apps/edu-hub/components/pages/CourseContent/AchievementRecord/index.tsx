import { createContext, FC, useCallback, useEffect, useState } from 'react';
import { IUserProfile } from '../../../../hooks/user';
import { useKeycloakUserProfile, useUserId, useUser } from '../../../../hooks/user';
import { FragmentType, useFragment } from '../../../../types/generated';
import { Button } from '../../../common/Button';
import { useAuthedQuery } from '../../../../hooks/authedQuery';
import { BlockTitle } from '@opencampus/shared-components';
import UploadAchievementRecordModal from './UploadAchievementRecordModal';
import { makeFullName, formattedDate, formattedDateWithTime } from '../../../../helpers/util';
import { AlertMessageDialog } from '../../../common/dialogs/AlertMessageDialog';
import { ACHIEVEMENT_OPTION_COURSES } from '../../../../graphql/queries/achievementOption';
import { ACHIEVEMENT_OPTION_FRAGMENT } from '../../../../graphql/fragments/achievementOptionFragment';
import { ACHIEVEMENT_RECORD_FRAGMENT } from '../../../../graphql/fragments/achievementRecordFragment';

import { Order_By } from '../../../../types/generated/graphql';
import { ACHIEVEMENT_RECORDS_WITH_AUTHORS } from '../../../../graphql/queries/achievementRecord/achievementRecord';
import useTranslation from 'next-translate/useTranslation';
interface IContext {
  achievementRecordUploadDeadline: any;
  courseTitle: string;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
  setAlertMessage: (value: string) => void;
}

export const ProjectResultUploadContext = createContext({} as IContext);

interface IProps {
  courseId: number;
  achievementRecordUploadDeadline: any;
  courseTitle: string;
}

const AchievementRecord: FC<IProps> = ({ courseId, achievementRecordUploadDeadline, courseTitle }) => {
  const { t, lang } = useTranslation();
  const user = useUser();
  const userId = useUserId();
  const profile = useKeycloakUserProfile();
  const [showModal, setShowModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [myRecord, setMyRecord] = useState<FragmentType<typeof ACHIEVEMENT_RECORD_FRAGMENT>>(null);

  const [achievementOptions, setAchievementOptions] = useState<FragmentType<typeof ACHIEVEMENT_OPTION_FRAGMENT>[]>([]);

  const myUnmaskedRecord = useFragment(ACHIEVEMENT_RECORD_FRAGMENT, myRecord);

  /* #region Database */
  const query = useAuthedQuery(
    ACHIEVEMENT_OPTION_COURSES,
    { variables: { where: { courseId: { _eq: courseId } } } }
  );

useEffect(() => {
    const options = [...(query.data?.AchievementOptionCourse || [])];
    setAchievementOptions(options.map((options) => options.AchievementOption));
  }, [query.data?.AchievementOptionCourse]);

  const myRecordsQuery = useAuthedQuery(ACHIEVEMENT_RECORDS_WITH_AUTHORS, {
    variables: {
      where: { _and: [{ AchievementRecordAuthors: { userId: { _eq: userId } } }, { courseId: { _eq: courseId } }] },
      orderBy: { created_at: Order_By.Desc },
      limit: 1,
    },
  });
  /* #endregion */

  useEffect(() => {
    const r = myRecordsQuery.data?.AchievementRecord[0] || null;
    setMyRecord(r);
  }, [myRecordsQuery]);
  /* #region Callbacks*/
  const onClosed = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  const upload = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);

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
        <BlockTitle>{t('course-page:achievement-option')}</BlockTitle>
        {!query.loading && achievementOptions.length > 0 && (
          <span className="text-lg mt-6">
            {t('course-page:achievement-record-upload-dead-line-text', {
              date: formattedDate(achievementRecordUploadDeadline),
            })}
          </span>
        )}
        {myRecord ? (
          <p>
            {t('course-page:last_record_upload', {
              dateTime: formattedDateWithTime(new Date(myUnmaskedRecord.created_at), lang),
              fullName: makeFullName(profile.firstName, profile.lastName),
              achievementRecordTitle: myUnmaskedRecord.AchievementOption.title,
              achievementRecordFileName: myUnmaskedRecord.documentationUrl.substring(
                myUnmaskedRecord.documentationUrl.lastIndexOf('/') + 1
              ),
            })}
          </p>
        ) : (
          <p>{t('course-page:no_existing_record_upload')}</p>
        )}
        <div className="flex flex-col lg:flex-row">
          <Button filled onClick={upload}>
           {`↑ ${t('course-page:upload_achievement_record')}`}
          </Button>
        </div>
      </div>
      {showModal && (
        <UploadAchievementRecordModal
          onClose={onClosed}
          achievementOptionsQuery={query}
          onSuccess={onSuccess}
          setAlertMessage={setAlertMessage}
          userId={userId}
          user={user}
          courseId={courseId}
          isOpen={showModal}
        />
      )}
    </ProjectResultUploadContext.Provider>
  );
};

export default AchievementRecord;

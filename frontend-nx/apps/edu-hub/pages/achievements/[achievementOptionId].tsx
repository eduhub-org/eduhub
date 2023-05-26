import Head from 'next/head';
import { Page } from '../../components/Page';
import { useRouter } from 'next/router';

import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { useAuthedQuery } from '../../hooks/authedQuery';
import { ACHIEVEMENT_OPTIONS } from '../../queries/achievementOption';

import { formattedDate, isDateExpired, makeFullName } from '../../helpers/util';
import { Button } from '../../components/common/Button';
import { BlockTitle } from '@opencampus/shared-components';
import {
  AchievementOptionList,
  AchievementOptionListVariables,
  AchievementOptionList_AchievementOption,
} from '../../queries/__generated__/AchievementOptionList';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { PageBlock } from '../../components/common/PageBlock';
import {
  CourseMinimum,
  CourseMinimumVariables,
  CourseMinimum_Course_by_pk,
} from '../../queries/__generated__/CourseMinimum';
import { COURSE_MINIMUM } from '../../queries/course';
import {
  AchievementRecordListWithAuthors,
  AchievementRecordListWithAuthorsVariables,
  AchievementRecordListWithAuthors_AchievementRecord,
} from '../../queries/__generated__/AchievementRecordListWithAuthors';
import { ACHIEVEMENT_RECORDS_WITH_AUTHORS } from '../../queries/achievementRecord';
import {
  AchievementRecordType_enum,
  order_by,
} from '../../__generated__/globalTypes';
import { Translate } from 'next-translate';
import FormToUploadAchievementRecord from '../../components/not-considered/course-achievement-option/FormToUploadAchievementRecord';
import { AlertMessageDialog } from '../../components/common/dialogs/AlertMessageDialog';
import { useUserId } from '../../hooks/user';
import { COURSE_ENROLLMENTS } from '../../queries/courseEnrollment';
import {
  CourseEnrollmentQuery,
  CourseEnrollmentQueryVariables,
} from '../../queries/__generated__/CourseEnrollmentQuery';
const AchievementOptionDetails: FC = () => {
  const router = useRouter();
  const { achievementOptionId } = router.query;

  const courseIdString = router.query.courseId;
  const { t } = useTranslation();
  const id =
    typeof achievementOptionId === 'string' ? parseInt(achievementOptionId) : 0;
  const courseId =
    typeof courseIdString === 'string' ? parseInt(courseIdString) : 0;
  const [course, setCourse] = useState(null as CourseMinimum_Course_by_pk);
  const [achievementOption, setAchievementOption] = useState(
    null as AchievementOptionList_AchievementOption
  );

  const achievementOptionQuery = useAuthedQuery<
    AchievementOptionList,
    AchievementOptionListVariables
  >(ACHIEVEMENT_OPTIONS, {
    variables: {
      where: { id: { _eq: id } },
    },
    skip: id <= 0,
  });

  const courseDetails = useAuthedQuery<CourseMinimum, CourseMinimumVariables>(
    COURSE_MINIMUM,
    {
      variables: {
        id: courseId,
      },
      skip: courseId === 0,
    }
  );

  useEffect(() => {
    const details = courseDetails.data?.Course_by_pk || null;
    setCourse(details);
    const list = [...(achievementOptionQuery.data?.AchievementOption || [])];
    setAchievementOption(list.length > 0 ? list[0] : null);
  }, [
    achievementOptionQuery.data?.AchievementOption,
    courseDetails,
    setCourse,
  ]);

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          {achievementOption && course && (
            <AchievementOptionDetailsDashboard
              achievementOption={achievementOption}
              course={course}
            />
          )}
        </div>
      </Page>
    </>
  );
};

export default AchievementOptionDetails;

interface IProps {
  achievementOption: AchievementOptionList_AchievementOption;
  course: CourseMinimum_Course_by_pk;
}
const AchievementOptionDetailsDashboard: FC<IProps> = ({
  achievementOption,
  course,
}) => {
  const userId = useUserId();
  const { t } = useTranslation();
  const [alertMessage, setAlertMessage] = useState('');
  const closeAlertDialog = useCallback(() => {
    setAlertMessage('');
  }, [setAlertMessage]);

  return (
    <PageBlock classname="flex flex-col gap-8 pb-5">
      {alertMessage.trim().length > 0 && (
        <AlertMessageDialog
          alert={alertMessage}
          confirmationText={'OK'}
          onClose={closeAlertDialog}
          open={alertMessage.trim().length > 0}
        />
      )}

      <ContentRowTwoColumn
        left={<span className="text-sm uppercase">{course.title}</span>}
        right={
          <span className="text-sm uppercase">{course.Program.shortTitle}</span>
        }
      ></ContentRowTwoColumn>
      <BlockTitle>{achievementOption.title}</BlockTitle>
      <div id="mentors" className="flex flex-col gap-5">
        <Title>{t('achievements-page:mentors')}</Title>
        <BoldText>
          {achievementOption.AchievementOptionMentors.map((m) =>
            makeFullName(m.User.firstName, m.User.lastName)
          ).join(', ')}
        </BoldText>
      </div>

      <div id="mentors" className="flex flex-col gap-5">
        <Title>{t('achievements-page:description')}</Title>
        <BoldText>{achievementOption.description}</BoldText>
      </div>

      {achievementOption.recordType ===
        AchievementRecordType_enum.DOCUMENTATION_AND_CSV && (
        <ViewForCSV
          achievementOption={achievementOption}
          course={course}
          t={t}
          setAlertMessage={setAlertMessage}
          userId={userId}
        />
      )}

      {achievementOption.recordType ===
        AchievementRecordType_enum.DOCUMENTATION && (
        <RecordTypeDocumentView
          achievementOption={achievementOption}
          course={course}
          t={t}
          setAlertMessage={setAlertMessage}
          userId={userId}
        />
      )}
    </PageBlock>
  );
};
interface IProps2 extends IProps {
  t: Translate;
  setAlertMessage: (value: string) => void;
  userId: string;
}
const ViewForCSV: FC<IProps2> = ({
  achievementOption,
  course,
  setAlertMessage,
  userId,
  t,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [records, setAchievementRecords] = useState(
    [] as AchievementRecordListWithAuthors_AchievementRecord[]
  );
  const achievementRecords = useAuthedQuery<
    AchievementRecordListWithAuthors,
    AchievementRecordListWithAuthorsVariables
  >(ACHIEVEMENT_RECORDS_WITH_AUTHORS, {
    variables: {
      where: {
        _and: [
          { achievementOptionId: { _eq: achievementOption.id } },
          {
            csvResults: { _is_null: false },
          },
        ],
      },
    },
  });

  useEffect(() => {
    const r = [...(achievementRecords.data?.AchievementRecord || [])];
    setAchievementRecords(r);
  }, [achievementRecords.data?.AchievementRecord]);

  const onClosed = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  const upload = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);

  const onSuccess = useCallback(() => {
    setShowModal(false);
    achievementRecords.refetch();
  }, [achievementRecords]);

  return (
    <>
      {showModal && (
        <FormToUploadAchievementRecord
          achievementOption={achievementOption}
          onSuccess={onSuccess}
          onClose={onClosed}
          courseTitle={course.title}
          setAlertMessage={setAlertMessage}
          userId={userId}
          courseId={course.id}
        />
      )}

      {/* This section is only shown if any csv results were uploaded or the achievement option is not expired yet. */}

      {(records.length > 0 || !isDateExpired(new Date(course.endTime))) && (
        <>
          <Title>{t('achievements-page:results')}</Title>
          <ContentRowTwoColumn
            left={
              <div id="results" className="flex flex-col gap-2">
                {/* This button is only shown if the achievement option is not yet expired. */}
                {!isDateExpired(new Date(course.endTime)) && (
                  <div>
                    <Button onClick={upload} filled>{`${t(
                      'achievements-page:upload'
                    )}`}</Button>
                  </div>
                )}
              </div>
            }
            right={
              <p className="uppercase">
                {/* AchievementOption.Course.endDate */}
                {t('achievements-page:deadline')}{' '}
                {formattedDate(course.endTime)}
              </p>
            }
          ></ContentRowTwoColumn>
          {/* The table is only shown if achievement records including csv results do actually exist. */}
          {records.length > 0 && (
            <div id="records">
              <Title>{t('achievements-page:results-so-far')}</Title>

              <Paper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">
                        {t('achievements-page:rank')}
                      </TableCell>
                      <TableCell align="center">
                        {t('achievements-page:results')}
                      </TableCell>
                      {/* Column is only show when AchievementOption.showScoreAuthors==TRUE */}
                      {achievementOption.showScoreAuthors && (
                        <TableCell>{t('achievements-page:mentors')}</TableCell>
                      )}
                      <TableCell>{t('date')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell align="center" component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell align="center">{row.score}</TableCell>
                        {/* Column is only show when AchievementOption.showScoreAuthors==TRUE */}
                        {achievementOption.showScoreAuthors && (
                          <TableCell>
                            <BoldText>
                              {row.AchievementRecordAuthors.map((m) =>
                                makeFullName(m.User.firstName, m.User.lastName)
                              ).join(', ')}
                            </BoldText>
                          </TableCell>
                        )}
                        <TableCell>
                          {formattedDate(new Date(row.created_at))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </div>
          )}
        </>
      )}
    </>
  );
};

const RecordTypeDocumentView: FC<IProps2> = ({
  achievementOption,
  course,
  t,
  setAlertMessage,
  userId,
}) => {
  const [records, setAchievementRecords] = useState(
    [] as AchievementRecordListWithAuthors_AchievementRecord[]
  );
  const [myLastUpload, setMyLastUpload] = useState(
    [] as AchievementRecordListWithAuthors_AchievementRecord[]
  );

  const achievementRecords = useAuthedQuery<
    AchievementRecordListWithAuthors,
    AchievementRecordListWithAuthorsVariables
  >(ACHIEVEMENT_RECORDS_WITH_AUTHORS, {
    variables: {
      where: { achievementOptionId: { _eq: achievementOption.id } },
    },
  });

  const myUploadsQuery = useAuthedQuery<
    AchievementRecordListWithAuthors,
    AchievementRecordListWithAuthorsVariables
  >(ACHIEVEMENT_RECORDS_WITH_AUTHORS, {
    variables: {
      where: {
        _and: [
          { achievementOptionId: { _eq: achievementOption.id } },
          { uploadUserId: { _eq: userId } },
        ],
      },
      orderBy: { created_at: order_by.desc },
      limit: 1,
    },
  });

  useEffect(() => {
    const r = [...(achievementRecords.data?.AchievementRecord || [])];
    setAchievementRecords(r);
  }, [achievementRecords.data?.AchievementRecord]);

  const [showModal, setShowModal] = useState(false);
  const onClosed = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  const upload = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);

  const onSuccess = useCallback(() => {
    setShowModal(false);
    achievementRecords.refetch();
    myUploadsQuery.refetch();
  }, [achievementRecords, myUploadsQuery]);

  const enrollment = useAuthedQuery<
    CourseEnrollmentQuery,
    CourseEnrollmentQueryVariables
  >(COURSE_ENROLLMENTS, {
    variables: {
      where: {
        _and: [
          {
            courseId: { _eq: course.id },
          },
          {
            userId: { _eq: userId },
          },
        ],
      },
    },
  });

  const [isEnrolled, setEnrollmentStatus] = useState(false);

  const getLastAfterSplitting = (input: string) => {
    if (!input || input.trim().length === 0) return input;
    return input.split('/').pop();
  };

  useEffect(() => {
    const r = enrollment.data
      ? enrollment.data?.CourseEnrollment.length > 0
      : false;
    setEnrollmentStatus(r);
  }, [enrollment.data, setEnrollmentStatus]);

  useEffect(() => {
    const myLast = [...(myUploadsQuery.data?.AchievementRecord || [])];
    setMyLastUpload(myLast);
  }, [myUploadsQuery.data?.AchievementRecord]);
  return (
    <>
      {showModal && (
        <FormToUploadAchievementRecord
          onClose={onClosed}
          achievementOption={achievementOption}
          onSuccess={onSuccess}
          courseTitle={course.title}
          setAlertMessage={setAlertMessage}
          userId={userId}
          courseId={course.id}
        />
      )}
      {/* This section is only shown for a user currently registered in the course indicated for this achievement option */}
      {isEnrolled && (
        <>
          <Title>{t('achievements-page:documentation')}</Title>
          <ContentRowTwoColumn
            left={
              <div id="results" className="flex flex-col gap-2">
                <Button onClick={upload} filled>{`${t(
                  'achievements-page:upload'
                )}`}</Button>
              </div>
            }
            right={
              <p className="uppercase">
                {/* AchievementOption.Course.endDate */}
                {t('achievements-page:deadline')}{' '}
                {formattedDate(course.endTime)}
              </p>
            }
          ></ContentRowTwoColumn>
          {/* For users who are enrolled for the shown project (i.e. user is logged in) and already uploaded a documentation,
           before the view includes an additional section below the upload button, showing the file name of the last submitted project documentation, the authors and the date it was uploaded. */}
          {myLastUpload.length > 0 && (
            <div id="my-uploads">
              <Typography variant="button">
                {t('achievements-page:last-submitted-documentation')}
              </Typography>
              <Paper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('achievements-page:file-name')}</TableCell>
                      <TableCell>{t('achievements-page:mentors')}</TableCell>
                      <TableCell>{t('date')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {myLastUpload[0].documentationUrl &&
                          getLastAfterSplitting(
                            myLastUpload[0].documentationUrl
                          )}
                      </TableCell>
                      <TableCell>
                        <BoldText>
                          {myLastUpload[0].AchievementRecordAuthors.map((m) =>
                            makeFullName(m.User.firstName, m.User.lastName)
                          ).join(', ')}
                        </BoldText>
                      </TableCell>
                      <TableCell>
                        {formattedDate(new Date(myLastUpload[0].created_at))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </div>
          )}
          <div id="records">
            <Typography variant="button">
              {t('achievements-page:results-so-far')}
            </Typography>
            {records && (
              <Paper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('achievements-page:file-name')}</TableCell>
                      <TableCell colSpan={4}>
                        {t('achievements-page:mentors')}
                      </TableCell>
                      <TableCell colSpan={4}>{t('date')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell
                          colSpan={1}
                          variant="head"
                          component="th"
                          scope="row"
                        >
                          <Tooltip
                            title={getLastAfterSplitting(row.documentationUrl)}
                            enterDelay={300}
                          >
                            {row.documentationUrl.length > 0 && (
                              <p className="text-ellipsis overflow-hidden">
                                {getLastAfterSplitting(row.documentationUrl)}
                              </p>
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell colSpan={4}>
                          <BoldText>
                            {row.AchievementRecordAuthors.map((m) =>
                              makeFullName(m.User.firstName, m.User.lastName)
                            ).join(', ')}
                          </BoldText>
                        </TableCell>
                        <TableCell colSpan={4}>
                          {formattedDate(new Date(row.created_at))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </div>
        </>
      )}
    </>
  );
};

interface IPropsTitle {
  children: ReactNode;
}

const Title: FC<IPropsTitle> = ({ children }) => {
  return <Typography variant="button">{children}</Typography>;
};

const BoldText: FC<IPropsTitle> = ({ children }) => {
  return (
    <p className="font-medium text-sm leading-5 grid grid-cols-1">{children}</p>
  );
};

const ContentRowTwoColumn: FC<{ left: ReactNode; right: ReactNode }> = ({
  left,
  right,
}) => {
  return (
    <div className="flex flex-row justify-between">
      <div id="left" className="w-1/2">
        {left}
      </div>
      <div id="right" className="w-1/2 text-right">
        {right}
      </div>
    </div>
  );
};

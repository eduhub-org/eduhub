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
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
import { AchievementRecordType_enum } from '../../__generated__/globalTypes';
import { Translate } from 'next-translate';
import FormToUploadAchievementRecord from 'apps/edu-hub/components/course/course-achievement-option/FormToUploadAchievementRecord';
import ModalControl from 'apps/edu-hub/components/common/ModalController';
import { AlertMessageDialog } from 'apps/edu-hub/components/common/dialogs/AlertMessageDialog';
import { useUserId } from 'apps/edu-hub/hooks/user';
import { COURSE_ENROLLMENTS } from 'apps/edu-hub/queries/courseEnrollment';
import {
  CourseEnrollmentQuery,
  CourseEnrollmentQueryVariables,
} from 'apps/edu-hub/queries/__generated__/CourseEnrollmentQuery';
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

  const achievementOptionQuery = useAuthedQuery<
    AchievementOptionList,
    AchievementOptionListVariables
  >(ACHIEVEMENT_OPTIONS, {
    variables: {
      where: { id: { _eq: id } },
    },
    skip: id <= 0,
  });

  const achievementOptions = [
    ...(achievementOptionQuery.data?.AchievementOption || []),
  ];

  const details = achievementOptions.length > 0 ? achievementOptions[0] : null;

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
  }, [courseDetails, setCourse]);

  return (
    <>
      <Head>
        <title>
          {achievementOptionQuery.loading
            ? 'Loading'
            : details
            ? details.title
            : t('achievement-option')}
        </title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          {achievementOptionQuery.loading ? (
            <CircularProgress></CircularProgress>
          ) : details && course ? (
            <AchievementOptionDetailsDashboard
              achievementOption={details}
              course={course}
            />
          ) : (
            ''
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
    <PageBlock classname="flex flex-col gap-8">
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
        <ViewForOnlyDocument
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

  const close = useCallback(() => {
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
        <ModalControl showModal={showModal} onClose={close}>
          <FormToUploadAchievementRecord
            achievementOptionId={achievementOption.id}
            csvTemplateUrl={achievementOption.csvTemplateUrl}
            documentationTemplateUrl={
              achievementOption.documentationTemplateUrl
            }
            recordType={achievementOption.recordType}
            title={achievementOption.title}
            onSuccess={onSuccess}
            courseTitle={course.title}
            setAlertMessage={setAlertMessage}
            userId={userId}
            courseId={course.id}
          />
        </ModalControl>
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
            <div id="records" className="pb-5">
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
                        <TableCell align="left">
                          {t('achievements-page:mentors')}
                        </TableCell>
                      )}
                      <TableCell align="left">{t('date')}</TableCell>
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
                        <TableCell align="left">
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

const ViewForOnlyDocument: FC<IProps2> = ({
  achievementOption,
  course,
  t,
  setAlertMessage,
  userId,
}) => {
  const [records, setAchievementRecords] = useState(
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

  useEffect(() => {
    const r = [...(achievementRecords.data?.AchievementRecord || [])];
    setAchievementRecords(r);
  }, [achievementRecords.data?.AchievementRecord]);

  const [showModal, setShowModal] = useState(false);
  const close = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  const upload = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);

  const onSuccess = useCallback(() => {
    setShowModal(false);
    achievementRecords.refetch();
  }, [achievementRecords]);

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

  useEffect(() => {
    const r = enrollment.data
      ? enrollment.data?.CourseEnrollment.length > 0
      : false;
    setEnrollmentStatus(r);
  }, [enrollment.data, setEnrollmentStatus]);

  return (
    <>
      {showModal && (
        <ModalControl showModal={showModal} onClose={close}>
          <FormToUploadAchievementRecord
            achievementOptionId={achievementOption.id}
            csvTemplateUrl={achievementOption.csvTemplateUrl}
            documentationTemplateUrl={
              achievementOption.documentationTemplateUrl
            }
            recordType={achievementOption.recordType}
            title={achievementOption.title}
            onSuccess={onSuccess}
            courseTitle={course.title}
            setAlertMessage={setAlertMessage}
            userId={userId}
            courseId={course.id}
          />
        </ModalControl>
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
          <div id="records" className="pb-5">
            <Title>{t('achievements-page:results-so-far')}</Title>
            {records && (
              <Paper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="left">
                        {t('achievements-page:file-name')}
                      </TableCell>
                      <TableCell align="left">
                        {t('achievements-page:mentors')}
                      </TableCell>
                      <TableCell align="left">{t('date')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell align="left" component="th" scope="row">
                          {row.documentationUrl.length > 0 && (
                            <p className="text-ellipsis overflow-hidden">
                              {row.documentationUrl.split('/').pop()}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <BoldText>
                            {row.AchievementRecordAuthors.map((m) =>
                              makeFullName(m.User.firstName, m.User.lastName)
                            ).join(', ')}
                          </BoldText>
                        </TableCell>
                        <TableCell align="left">
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
  children: string;
}

const Title: FC<IPropsTitle> = ({ children }) => {
  return <p className="uppercase text-sm">{children}</p>;
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

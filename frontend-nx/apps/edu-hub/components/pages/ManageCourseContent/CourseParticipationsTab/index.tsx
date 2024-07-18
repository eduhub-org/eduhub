import { LazyQueryResult, QueryResult } from '@apollo/client';
import { ACHIEVEMENT_OPTION_COURSES } from '../../../../queries/achievementOption';
import useTranslation from 'next-translate/useTranslation';
import Link from 'next/link';
import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react';
import { useIsAdmin } from '../../../../hooks/authentication';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { DOT_COLORS, EhDot, greenDot, greyDot, redDot } from '../../../common/dots_old';
import { CertificateDownload } from '../../../common/CertificateDownload';

import { MdAddCircle, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { useLazyRoleQuery, useRoleQuery } from '../../../../hooks/authedQuery';
import { QUERY_LIMIT } from '../../../../pages/manage/courses';
import { UPDATE_AN_ACHIEVEMENT_RECORD } from '../../../../queries/achievementRecord';
import { INSERT_SINGLE_ATTENDANCE } from '../../../../queries/courseEnrollment';
import { DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK } from '../../../../queries/mutateAchievement';
import { GET_SIGNED_URL } from '../../../../queries/actions';
import {
  AchievementOptionCourses,
  AchievementOptionCoursesVariables,
} from '../../../../queries/__generated__/AchievementOptionCourses';
import {
  UpdateAchievementRecordByPk,
  UpdateAchievementRecordByPkVariables,
} from '../../../../queries/__generated__/UpdateAchievementRecordByPk';
import {
  DeleteAnAchievementOptionCourse,
  DeleteAnAchievementOptionCourseVariables,
} from '../../../../queries/__generated__/DeleteAnAchievementOptionCourse';
import {
  InsertSingleAttendance,
  InsertSingleAttendanceVariables,
} from '../../../../queries/__generated__/InsertSingleAttendance';
import { GetSignedUrl, GetSignedUrlVariables } from '../../../../queries/__generated__/GetSignedUrl';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords,
  ManagedCourse_Course_by_pk_CourseEnrollments,
  ManagedCourse_Course_by_pk_Sessions,
} from '../../../../queries/__generated__/ManagedCourse';

import { StaticComponentProperty } from '../../../../types/UIComponents';
import { GenerateCertificatesButton } from './GenerateCertificatesButton';
import { getAttendancesForParticipants } from '../../../../helpers/courseHelpers';
import { AchievementRecordRating_enum, AttendanceStatus_enum } from '../../../../__generated__/globalTypes';
import TagWithTwoText from '../../../common/TagWithTwoText';
import Loading from '../../../common/Loading';
import { Button } from '../../../common/Button';
import { CircularProgress } from '@material-ui/core';

interface CourseParticipationsTabIProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}
export const CourseParticipationsTab: FC<CourseParticipationsTabIProps> = ({ course, qResult }) => {
  return (
    <>
      <div className="flex flex-col space-y-2">
        {/* The following component displays all avaiable achievement options for this
        cours (if available) and allows to delete them
        TODO (Issue #515):
        Rather allowing to delete it, clicking on it should forward to the site where it is defined */}
        <CourseAchievementOptions courseId={course.id} />

        <ParticipationList course={course} qResult={qResult} />
      </div>
    </>
  );
};

/* #region Course AchievementOptions */

interface IPropsCourseAchievementOptions {
  courseId: number;
}
const CourseAchievementOptions: FC<IPropsCourseAchievementOptions> = (props) => {
  const achievementOptionsForACourse = useRoleQuery<AchievementOptionCourses, AchievementOptionCoursesVariables>(
    ACHIEVEMENT_OPTION_COURSES,
    {
      variables: {
        limit: QUERY_LIMIT,
        where: {
          courseId: { _eq: props.courseId },
        },
      },
    }
  );

  const [deleteAnAchievementCourse] = useRoleMutation<
    DeleteAnAchievementOptionCourse,
    DeleteAnAchievementOptionCourseVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK);

  const queryDeleteAnAchievementCourseFromDB = useCallback(
    async (pk: number) => {
      try {
        const response = await deleteAnAchievementCourse({
          variables: {
            id: pk,
          },
        });
        if (!response.errors) {
          achievementOptionsForACourse.refetch();
        }
      } catch (error) {
        console.log(error);
      }
    },
    [deleteAnAchievementCourse, achievementOptionsForACourse]
  );
  const list = [...(achievementOptionsForACourse.data?.AchievementOptionCourse || [])];

  return (
    <>
      {achievementOptionsForACourse.loading && <Loading />}
      <div className="flex gap-2 items-center flex-wrap">
        {list.map((data, index) => (
          <div className="max-w-[30%]" key={index}>
            <TagWithTwoText
              textLeft={`${data.AchievementOption.title} - ${data.id}`}
              onRemoveClick={queryDeleteAnAchievementCourseFromDB}
              id={data.id}
              textClickLink={`/achievements/${data.AchievementOption.id}`}
            />
          </div>
        ))}
        <Link href={`/achievements?courseId=${props.courseId}`}>
          {/*
          To avoid the following warning , I used a an extra 'div'
          Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()? */}
          <div>
            <MdAddCircle className="cursor-pointer" />
          </div>
        </Link>
      </div>
    </>
  );
};

/* #endregion */

/* #region Course Enrollment List */
interface IPropsParticipationList {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

type ExtendedEnrollment = ManagedCourse_Course_by_pk_CourseEnrollments & {
  mostRecentRecord?: ManagedCourse_Course_by_pk_AchievementOptionCourses_AchievementOption_AchievementRecords;
};

const ParticipationList: FC<IPropsParticipationList> = ({ course, qResult }) => {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [refetchAchievementCertificates, setRefetchAchievementCertificates] = useState(false);
  const [refetchAttendanceCertificates, setRefetchAttendanceCertificates] = useState(false);

  const tableHeaders: StaticComponentProperty[] = [
    { key: 0, label: t('firstName') },
    { key: 1, label: t('lastName') },
    { key: 2, label: t('manageCourse:attendances') },
    { key: 3, label: t('manageCourse:certificate_achievement') },
    { key: 4, label: t('manageCourse:certificates') },
  ];

  const participationEnrollments: ExtendedEnrollment[] = [...(course.CourseEnrollments || [])]
    .filter((enrollment) => enrollment.status === 'CONFIRMED')
    .sort((a, b) => a.User.lastName.localeCompare(b.User.lastName))
    .map((enrollment) => {
      // get all records for this enrollment
      const allRecords = course.AchievementOptionCourses.flatMap((course) =>
        course.AchievementOption.AchievementRecords.filter((record) =>
          record.AchievementRecordAuthors.some((author) => author.userId === enrollment.User.id)
        )
      );

      // find most recent record for this enrollment
      const mostRecentRecord =
        allRecords.length > 0
          ? allRecords.reduce((prevRecord, currRecord) =>
              new Date(currRecord.created_at) > new Date(prevRecord.created_at) ? currRecord : prevRecord
            )
          : null;

      // return a new object that combines the enrollment and its most recent record
      return {
        ...enrollment,
        mostRecentRecord,
      };
    });

  const sessions = [...(course.Sessions || [])];

  const attendances = getAttendancesForParticipants(participationEnrollments, sessions);

  // assign passedUserEnrollments to the array of participationEnrollments filtered on enrollments from those users who have less then the allowed number of missed or not tracked attendances for this course
  const passedUserEnrollmentsForAttendanceCertificate = participationEnrollments.filter((enrollment) => {
    const userAttendances = attendances.filter((attendance) => attendance.userId === enrollment.userId);
    const missedAttendances = userAttendances.filter(
      (attendance) => attendance.status === AttendanceStatus_enum.MISSED
    );
    const noInfoAttendances = userAttendances.filter(
      (attendance) => attendance.status === AttendanceStatus_enum.NO_INFO
    );
    return missedAttendances.length + noInfoAttendances.length <= course.maxMissedSessions;
  });

  const passedUserEnrollmentsForAchievementCertificate = participationEnrollments
    .filter((enrollment) => {
      const userAttendances = attendances.filter((attendance) => attendance.userId === enrollment.userId);
      const missedAttendances = userAttendances.filter(
        (attendance) => attendance.status === AttendanceStatus_enum.MISSED
      );
      const noInfoAttendances = userAttendances.filter(
        (attendance) => attendance.status === AttendanceStatus_enum.NO_INFO
      );
      return missedAttendances.length + noInfoAttendances.length <= course.maxMissedSessions;
    })
    .filter((enrollment) => {
      const mostRecentRecord = enrollment.mostRecentRecord;
      return mostRecentRecord && mostRecentRecord.rating === AchievementRecordRating_enum.PASSED;
    });

  return (
    <>
      {participationEnrollments.length > 0 ? (
        <div className="overflow-x-auto transition-[height] w-full pb-10">
          <table className="w-full">
            <thead>
              <tr className="focus:outline-none h-16 ">
                {tableHeaders.map((component) => {
                  return (
                    <th key={component.key} className="py-2 px-5">
                      <p className="flex justify-start font-medium text-gray-400 uppercase">{component.label}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {participationEnrollments.map((ce) => (
                <ParticipationRow
                  key={ce.id}
                  enrollment={ce}
                  sessions={sessions}
                  userId={ce.User.id}
                  qResult={qResult}
                  maxMissedSessions={course.maxMissedSessions}
                  refetchAchievementCertificates={refetchAchievementCertificates}
                  refetchAttendanceCertificates={refetchAttendanceCertificates}
                  setRefetchAchievementCertificates={setRefetchAchievementCertificates}
                  setRefetchAttendanceCertificates={setRefetchAttendanceCertificates}
                />
              ))}
            </tbody>
          </table>
          {isAdmin && course.attendanceCertificatePossible === true && (
            <GenerateCertificatesButton
              userEnrollments={passedUserEnrollmentsForAttendanceCertificate}
              course={course}
              certificateType="attendance"
              refetchCourse={qResult.refetch}
              refetch={setRefetchAttendanceCertificates}
            />
          )}
          {isAdmin && course.achievementCertificatePossible === true && (
            <GenerateCertificatesButton
              userEnrollments={passedUserEnrollmentsForAchievementCertificate}
              course={course}
              certificateType="achievement"
              refetchCourse={qResult.refetch}
              refetch={setRefetchAchievementCertificates}
            />
          )}
        </div>
      ) : (
        <p className="m-auto text-center mb-14 text-gray-400">{t('course-page:no-enrollments-present')}</p>
      )}
    </>
  );
};

/* #endregion */

interface IDotData {
  color: DOT_COLORS;
  session: ManagedCourse_Course_by_pk_Sessions;
}

const pStyle = 'text-gray-700 truncate';
const tdStyle = 'pl-5 py-4';

/* #region ParticipationRow */

interface IPropsParticipationRow {
  enrollment: ExtendedEnrollment;
  sessions: ManagedCourse_Course_by_pk_Sessions[];
  qResult: QueryResult<any, any>;
  userId: string;
  maxMissedSessions: number;
  refetchAchievementCertificates?: boolean;
  refetchAttendanceCertificates?: boolean;
  setRefetchAchievementCertificates?: Dispatch<SetStateAction<boolean>>;
  setRefetchAttendanceCertificates?: Dispatch<SetStateAction<boolean>>;
}
const ParticipationRow: FC<IPropsParticipationRow> = ({
  enrollment,
  sessions,
  qResult,
  userId,
  maxMissedSessions,
  refetchAchievementCertificates,
  refetchAttendanceCertificates,
  setRefetchAchievementCertificates,
  setRefetchAttendanceCertificates,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [documentationUrlLoaded, setDocumentationUrlLoaded] = useState(false);

  const [getAchievementRecordDocumentation, getAchievementRecordDocumentationResult] = useLazyRoleQuery<
    GetSignedUrl,
    GetSignedUrlVariables
  >(GET_SIGNED_URL);

  const attendanceRecordBySession: Record<number, { id: number; status: AttendanceStatus_enum }> =
    enrollment.User.Attendances.reduce<Record<number, { id: number; status: AttendanceStatus_enum }>>(
      (prev, current) => {
        if (!prev[current.Session.id] || prev[current.Session.id].id < current.id) {
          prev[current.Session.id] = { id: current.id, status: current.status };
        }
        return prev;
      },
      {}
    );

  const [insertAttendance] = useRoleMutation<InsertSingleAttendance, InsertSingleAttendanceVariables>(
    INSERT_SINGLE_ATTENDANCE
  );

  const handleDotClick = useCallback(
    async (session: ManagedCourse_Course_by_pk_Sessions) => {
      const attendanceRecord = attendanceRecordBySession[session.id];
      let status: AttendanceStatus_enum;
      if (
        !attendanceRecord ||
        attendanceRecord.status === AttendanceStatus_enum.MISSED ||
        attendanceRecord.status === AttendanceStatus_enum.NO_INFO
      ) {
        status = AttendanceStatus_enum.ATTENDED;
      } else {
        status = AttendanceStatus_enum.MISSED;
      }
      const insertResponse = await insertAttendance({
        variables: {
          input: {
            status,
            sessionId: session.id,
            source: 'INSTRUCTOR',
            userId,
          },
        },
      });
      if (insertResponse.errors) {
        console.log('Error: ', insertResponse.errors);
        return;
      }
      qResult.refetch();
    },
    [qResult, insertAttendance, attendanceRecordBySession, userId]
  );

  const handleDetailsClick = async () => {
    setShowDetails((prev) => !prev);
    if (!documentationUrlLoaded && enrollment.mostRecentRecord !== null) {
      getAchievementRecordDocumentation({
        variables: {
          path: enrollment.mostRecentRecord.documentationUrl,
        },
      });
      setDocumentationUrlLoaded(true);
    }
  };

  /**
   * For each existing session in the course a circle is shown,
   * depending on the participant's attendance for each session the circle is green
   * [Attendance:Status=="ATTENDED"], red [Attendance:Status=="MISSED"], or grey [Attendance:Status=="UNRATED"]
   * *
   * @param {CourseEnrollmentByCourseID_Course_by_pk_Sessions} sn Database object
   * @returns {DOT_COLORS} ("GREY" | "GREEN" | "ORANGE" | "RED")
   */
  const dotColor = (sn: ManagedCourse_Course_by_pk_Sessions) => {
    if (enrollment.User.Attendances.length === 0) return 'GREY';
    const attendance = attendanceRecordBySession[sn.id];
    if (!attendance) return 'GREY';
    if (attendance.status === AttendanceStatus_enum.MISSED) return 'RED';
    if (attendance.status === AttendanceStatus_enum.ATTENDED) return 'GREEN';
    return 'GREY';
  };

  const dotsData: IDotData[] = sessions.map((session) => ({
    session,
    color: dotColor(session),
  }));
  const missedSessionCount = () => {
    const result = dotsData.reduce((prev, current) => prev + (current.color === 'RED' ? 1 : 0), 0);
    return result;
  };

  const attendedSessionCount = () => {
    const result = dotsData.reduce((prev, current) => prev + (current.color === 'GREEN' ? 1 : 0), 0);
    return result;
  };

  const passedStatus = () => {
    // const missedSession = sessions.length - missedSessionCount();
    return missedSessionCount() > maxMissedSessions ? 'RED' : 'GREEN';
  };

  return (
    <>
      <tr className="font-medium bg-edu-course-list h-12">
        <td className={tdStyle}>
          <p className={pStyle}>{enrollment.User.firstName}</p>
        </td>
        <td className={tdStyle}>
          <p className={pStyle}>{enrollment.User.lastName}</p>
        </td>
        <td className={tdStyle}>
          <div className="flex space-x-10 flex-row">
            <div className="flex space-x-3 flex-row">
              {dotsData.map((dotData) => {
                return (
                  // <> {greyDot} </>
                  <EhDotWithCallBack
                    key={dotData.session.id}
                    dotData={dotData}
                    handleDotClick={handleDotClick}
                    session={dotData.session}
                  />
                );
              })}
            </div>
            <div className="flex space-x-1 flex-row">
              <p className={pStyle}> {`${missedSessionCount()}/${attendedSessionCount() + missedSessionCount()}`} </p>
              <EhDot color={passedStatus()} />
            </div>
          </div>
        </td>
        <td className={`${tdStyle} min-w-[260px]`}>
          <div className="flex flex-row">
            {!enrollment.mostRecentRecord && (
              <div>
                <p className={pStyle}> {t('course-page:not-submitted')} </p>
              </div>
            )}

            {enrollment.mostRecentRecord?.rating === AchievementRecordRating_enum.UNRATED ? greyDot : <></>}
            {enrollment.mostRecentRecord?.rating === AchievementRecordRating_enum.PASSED ? greenDot : <></>}
            {enrollment.mostRecentRecord?.rating === AchievementRecordRating_enum.FAILED ? redDot : <></>}
          </div>
        </td>

        <td>
          <div className={tdStyle}>
            <CertificateDownload
              courseEnrollment={enrollment}
              manageView
              refetchAchievementCertificates={refetchAchievementCertificates}
              refetchAttendanceCertificates={refetchAttendanceCertificates}
              setRefetchAchievementCertificates={setRefetchAchievementCertificates}
              setRefetchAttendanceCertificates={setRefetchAttendanceCertificates}
            />
          </div>
        </td>

        <td className={tdStyle}>
          <div>
            <button className="focus:ring-2 rounded-md focus:outline-none" role="button" aria-label="option">
              {showDetails ? (
                <MdKeyboardArrowUp size={26} onClick={handleDetailsClick} />
              ) : (
                <MdKeyboardArrowDown size={26} onClick={handleDetailsClick} />
              )}
            </button>
          </div>
        </td>
      </tr>
      <tr className={showDetails ? 'h-0' : 'h-1'} />
      {showDetails && (
        <ShowDetails
          enrollment={enrollment}
          achievementRecordDocumentationResult={getAchievementRecordDocumentationResult}
          qResult={qResult}
        />
      )}
    </>
  );
};

/* #endregion */
interface IPropsShowDetails {
  enrollment: ExtendedEnrollment;
  achievementRecordDocumentationResult: LazyQueryResult<GetSignedUrl, GetSignedUrlVariables>;
  qResult: QueryResult<any, any>;
}
const ShowDetails: FC<IPropsShowDetails> = ({ enrollment, achievementRecordDocumentationResult, qResult }) => {
  const { t } = useTranslation();
  const [setAchievementRecord] = useRoleMutation<UpdateAchievementRecordByPk, UpdateAchievementRecordByPkVariables>(
    UPDATE_AN_ACHIEVEMENT_RECORD
  );
  const onSetAchievementRecordRatingClick = async (achievementRecordRating: AchievementRecordRating_enum) => {
    await setAchievementRecord({
      variables: {
        id: enrollment.mostRecentRecord.id,
        setInput: {
          rating: achievementRecordRating,
        },
      },
    });
    qResult.refetch();
  };
  return (
    <>
      <tr className="bg-edu-course-list f-full">
        <td colSpan={3} className={tdStyle}>
          <div className="flex">
            <p className={pStyle}> {enrollment.User.email} </p>
          </div>
        </td>
        <td colSpan={3} className={`${tdStyle} min-w-[260px]`}>
          <div className="flex flex-col">
            {enrollment.mostRecentRecord && (
              <>
                <div className="flex items-center mb-3">
                  <EhDot
                    onClick={() => onSetAchievementRecordRatingClick(AchievementRecordRating_enum.UNRATED)}
                    className="cursor-pointer"
                    color="GREY"
                    size={
                      enrollment.mostRecentRecord.rating === AchievementRecordRating_enum.UNRATED ? 'LARGE' : 'DEFAULT'
                    }
                  />
                  <EhDot
                    onClick={() => onSetAchievementRecordRatingClick(AchievementRecordRating_enum.PASSED)}
                    className="cursor-pointer"
                    color="GREEN"
                    size={
                      enrollment.mostRecentRecord.rating === AchievementRecordRating_enum.PASSED ? 'LARGE' : 'DEFAULT'
                    }
                  />
                  <EhDot
                    onClick={() => onSetAchievementRecordRatingClick(AchievementRecordRating_enum.FAILED)}
                    className="cursor-pointer"
                    color="RED"
                    size={
                      enrollment.mostRecentRecord.rating === AchievementRecordRating_enum.FAILED ? 'LARGE' : 'DEFAULT'
                    }
                  />
                </div>
                <div className="mb-3">
                  {`${t('manageCourse:projectTitle')}: `}
                  {enrollment.mostRecentRecord.AchievementOption.title}
                </div>
                <Button
                  as={'a'}
                  href={
                    achievementRecordDocumentationResult.loading
                      ? '#'
                      : achievementRecordDocumentationResult?.data?.getSignedUrl?.link
                  }
                >
                  {achievementRecordDocumentationResult.loading ? <CircularProgress /> : 'Download Documentation'}
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
      <tr className="h-1" />
    </>
  );
};
/* #region IEhDotProps With Extra callback */
interface IEhDotProps {
  dotData: IDotData;
  handleDotClick: (session: ManagedCourse_Course_by_pk_Sessions) => void;
  session: ManagedCourse_Course_by_pk_Sessions;
}
const EhDotWithCallBack: FC<IEhDotProps> = ({ dotData, handleDotClick, session }) => {
  const handleClick = useCallback(() => {
    handleDotClick(session);
  }, [handleDotClick, session]);

  return (
    <EhDot
      onClick={handleClick}
      color={dotData.color}
      className="cursor-pointer hover:border-2 hover:border-indigo-200 hover:rounded-full"
      title={new Date(session.startDateTime).toLocaleString()}
    />
  );
};

/* #endregion */

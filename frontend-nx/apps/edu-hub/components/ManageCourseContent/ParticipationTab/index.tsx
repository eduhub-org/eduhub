import { QueryResult, useMutation, useQuery } from '@apollo/client';
import { ACHIEVEMENT_OPTION_COURSES } from '../../../queries/achievementOption';
import useTranslation from 'next-translate/useTranslation';
import Link from 'next/link';
import { FC, useCallback, useState } from 'react';
import { useIsAdmin } from '../../../hooks/authentication';
import {
  DOT_COLORS,
  EhDot,
  greenDot,
  greyDot,
  orangeDot,
  redDot,
} from '../../common/dots';
import { useRoleMutation } from '../../../hooks/authedMutation';

import {
  MdAddCircle,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from 'react-icons/md';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { QUERY_LIMIT } from '../../../pages/manage/courses';
import { INSERT_SINGLE_ATTENDANCE } from '../../../queries/courseEnrollment';
import { DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK } from '../../../queries/mutateAchievement';
import {
  AchievementOptionCourses,
  AchievementOptionCoursesVariables,
} from '../../../queries/__generated__/AchievementOptionCourses';

import {
  DeleteAnAchievementOptionCourse,
  DeleteAnAchievementOptionCourseVariables,
} from '../../../queries/__generated__/DeleteAnAchievementOptionCourse';
import {
  InsertSingleAttendance,
  InsertSingleAttendanceVariables,
} from '../../../queries/__generated__/InsertSingleAttendance';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
  ManagedCourse_Course_by_pk_Sessions,
} from '../../../queries/__generated__/ManagedCourse';

import { StaticComponentProperty } from '../../../types/UIComponents';
import { AttendanceStatus_enum } from '../../../__generated__/globalTypes';
import TagWithTwoText from '../../common/TagWithTwoText';
import Loading from '../../ManageCoursesContent/Loading';
import { CertificateButton } from './CertificationButton';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}
const ParticipationsTab: FC<IProps> = ({ course, qResult }) => {
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

export default ParticipationsTab;

/* #region Course AchievementOptions */

interface IPropsCourseAchievementOptions {
  courseId: number;
}
const CourseAchievementOptions: FC<IPropsCourseAchievementOptions> = (
  props
) => {
  const achievementOptionsForACourse = useAdminQuery<
    AchievementOptionCourses,
    AchievementOptionCoursesVariables
  >(ACHIEVEMENT_OPTION_COURSES, {
    variables: {
      limit: QUERY_LIMIT,
      where: {
        courseId: { _eq: props.courseId },
      },
    },
  });

  const [deleteAnAchievementCourse] = useAdminMutation<
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
  const list = [
    ...(achievementOptionsForACourse.data?.AchievementOptionCourse || []),
  ];

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

const ParticipationList: FC<IPropsParticipationList> = ({
  course,
  qResult,
}) => {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();

  const tableHeaders: StaticComponentProperty[] = [
    { key: 0, label: t('firstName') },
    { key: 1, label: t('lastName') },
    { key: 2, label: t('manage-course:attendances') },
    { key: 3, label: t('manage-course:certificateAchievement') },
  ];

  const participationList = [...(course.CourseEnrollments || [])]
    .filter((enrollment) => enrollment.status === 'CONFIRMED')
    .sort((a, b) => a.User.lastName.localeCompare(b.User.lastName));
  const sessions = [...(course.Sessions || [])];

  console.log('EnrollmentList length: ', ParticipationList.toString);

  return (
    <>
      {participationList.length > 0 ? (
        <div className="overflow-x-auto transition-[height] w-full pb-10">
          <table className="w-full">
            <thead>
              <tr className="focus:outline-none h-16 ">
                {tableHeaders.map((component) => {
                  return (
                    <th key={component.key} className="py-2 px-5">
                      <p className="flex justify-start font-medium text-gray-400 uppercase">
                        {component.label}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {participationList.map((ce) => (
                <ParticipationRow
                  key={ce.id}
                  enrollment={ce}
                  sessions={sessions}
                  userId={ce.User.id}
                  qResult={qResult}
                  maxMissedSessions={course.maxMissedSessions}
                />
              ))}
            </tbody>
          </table>
          {isAdmin && <CertificateButton />}
        </div>
      ) : (
        <p className="m-auto text-center mb-14 text-gray-400">
          {t('course-page:no-enrollments-present')}
        </p>
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
const tdStyle = 'pl-5';

/* #region ParticipationRow */

interface IPropsParticipationRow {
  enrollment: ManagedCourse_Course_by_pk_CourseEnrollments;
  sessions: ManagedCourse_Course_by_pk_Sessions[];
  qResult: QueryResult<any, any>;
  userId: string;
  maxMissedSessions: number;
}
const ParticipationRow: FC<IPropsParticipationRow> = ({
  enrollment,
  sessions,
  qResult,
  userId,
  maxMissedSessions,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const attendanceRecordBySession: Record<
    number,
    { id: number; status: AttendanceStatus_enum }
  > = enrollment.User.Attendances.reduce<
    Record<number, { id: number; status: AttendanceStatus_enum }>
  >((prev, current) => {
    if (!prev[current.Session.id] || prev[current.Session.id].id < current.id) {
      prev[current.Session.id] = { id: current.id, status: current.status };
    }
    return prev;
  }, {});

  const [insertAttendance] = useAdminMutation<
    InsertSingleAttendance,
    InsertSingleAttendanceVariables
  >(INSERT_SINGLE_ATTENDANCE);

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

  const handleDetailsClick = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, [setShowDetails]);

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
    const result = dotsData.reduce(
      (prev, current) => prev + (current.color === 'RED' ? 1 : 0),
      0
    );
    return result;
  };

  const attendedSessionCount = () => {
    const result = dotsData.reduce(
      (prev, current) => prev + (current.color === 'GREEN' ? 1 : 0),
      0
    );
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
              <p className={pStyle}>
                {' '}
                {`${missedSessionCount()}/${
                  attendedSessionCount() + missedSessionCount()
                }`}{' '}
              </p>
              <EhDot color={passedStatus()} />
            </div>
          </div>
        </td>
        <td className={tdStyle}>
          <div className="flex flex-row justify-center">
            <div>
              <p className={pStyle}> {t('course-page:not-submitted')} </p>
            </div>
            {greyDot}
            {/* {enrollment.motivationRating === 'UNRATED' ? greyDot : <></>}
            {enrollment.motivationRating === 'INVITE' ? greenDot : <></>}
            {enrollment.motivationRating === 'REVIEW' ? orangeDot : <></>}
            {enrollment.motivationRating === 'DECLINE' ? redDot : <></>} */}
          </div>
        </td>

        <td className={tdStyle}>
          <div>
            <button
              className="focus:ring-2 rounded-md focus:outline-none"
              role="button"
              aria-label="option"
            >
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
      {showDetails && <ShowDetails enrollment={enrollment} />}
    </>
  );
};

/* #endregion */
interface IPropsShowDetails {
  enrollment: ManagedCourse_Course_by_pk_CourseEnrollments;
}
const ShowDetails: FC<IPropsShowDetails> = ({ enrollment }) => {
  return (
    <>
      <tr className="bg-edu-course-list f-full">
        <td colSpan={12} className={tdStyle}>
          <div className="flex">
            <p className={pStyle}> {enrollment.User.email} </p>
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
const EhDotWithCallBack: FC<IEhDotProps> = ({
  dotData,
  handleDotClick,
  session,
}) => {
  const handleClick = useCallback(() => {
    handleDotClick(session);
  }, [handleDotClick, session]);

  return (
    <EhDot
      onClick={handleClick}
      color={dotData.color}
      className="cursor-pointer hover:border-2 hover:border-indigo-200 hover:rounded-full"
    />
  );
};

/* #endregion */

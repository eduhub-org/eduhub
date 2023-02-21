import { QueryResult } from '@apollo/client';
import { ACHIEVEMENT_OPTION_COURSES } from '../../queries/achievementOption';
import useTranslation from 'next-translate/useTranslation';
import Link from 'next/link';
import { FC, useCallback, useState } from 'react';
import {
  MdAddCircle,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from 'react-icons/md';
import { useAdminMutation } from '../../hooks/authedMutation';
import { useAdminQuery } from '../../hooks/authedQuery';
import { QUERY_LIMIT } from '../../pages/courses';
import {
  INSERT_SINGLE_ATTENDENCE,
  UPDATE_ATTENDENCE,
} from '../../queries/courseEnrollment';
import { DELETE_AN_ACHIEVEMENT_OPTION_COURSE_BY_PK } from '../../queries/mutateAchievement';
import {
  AchievementOptionCourses,
  AchievementOptionCoursesVariables,
} from '../../queries/__generated__/AchievementOptionCourses';

import {
  DeleteAnAchievementOptionCourse,
  DeleteAnAchievementOptionCourseVariables,
} from '../../queries/__generated__/DeleteAnAchievementOptionCourse';
import {
  InsertSingleAttendence,
  InsertSingleAttendenceVariables,
} from '../../queries/__generated__/InsertSingleAttendence';
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
  ManagedCourse_Course_by_pk_Sessions,
} from '../../queries/__generated__/ManagedCourse';

import {
  UpdateSingleAttendenceByPk,
  UpdateSingleAttendenceByPkVariables,
} from '../../queries/__generated__/UpdateSingleAttendenceByPk';
import { StaticComponentProperty } from '../../types/UIComponents';
import { AttendanceStatus_enum } from '../../__generated__/globalTypes';
import { DOT_COLORS, EhDot } from '../common/dots';
import TagWithTwoText from '../common/TagWithTwoText';
import Loading from '../courses/Loading';
import { Button } from '../common/Button';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}
const ManageCourseEnrollment: FC<IProps> = ({ course, qResult }) => {
  return (
    <>
      <div className="flex flex-col space-y-2">
        <CourseAchievementOptions courseId={course.id} />
        <EnrollmentList course={course} qResult={qResult} />
      </div>
    </>
  );
};

export default ManageCourseEnrollment;

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
interface IPropsEnrollmentList {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

const EnrollmentList: FC<IPropsEnrollmentList> = ({ course, qResult }) => {
  const { t } = useTranslation();

  const newLocal = 'manage-course:attendances';
  const tableHeaders: StaticComponentProperty[] = [
    { key: 0, label: t('firstName') },
    { key: 1, label: t('lastName') },
    { key: 2, label: t(newLocal) },
    { key: 3, label: t('manage-course:certificateAchievement') },
  ];

  const enrollmentList = [...(course.CourseEnrollments || [])].sort((a, b) =>
    a.User.lastName.localeCompare(b.User.lastName)
  );
  const sessions = [...(course.Sessions || [])];

  return (
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
          {enrollmentList.map((ce) => (
            <OneCourseEnrollmentRow
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
      <div className="flex justify-end mt-10">
        <Button filled={true}>{t('course-page:certificate-generation')}</Button>
      </div>
    </div>
  );
};

/* #endregion */

interface IDotData {
  color: DOT_COLORS;
  session: ManagedCourse_Course_by_pk_Sessions;
}

const pStyle = 'text-gray-700 truncate';
const tdStyle = 'pl-5';

/* #region OneCourseEnrollmentRow */

interface IPropsOneRow {
  enrollment: ManagedCourse_Course_by_pk_CourseEnrollments;
  sessions: ManagedCourse_Course_by_pk_Sessions[];
  qResult: QueryResult<any, any>;
  userId: string;
  maxMissedSessions: number;
}
const OneCourseEnrollmentRow: FC<IPropsOneRow> = ({
  enrollment,
  sessions,
  qResult,
  userId,
  maxMissedSessions,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const attendanceRecordBySession: Record<
    number,
    { id: number; status: AttendanceStatus_enum }
  > = enrollment.User.Attendances.reduce<
    Record<number, { id: number; status: AttendanceStatus_enum }>
  >((prev, current) => {
    prev[current.Session.id] = { id: current.id, status: current.status };
    return prev;
  }, {});

  const [insertAttendence] = useAdminMutation<
    InsertSingleAttendence,
    InsertSingleAttendenceVariables
  >(INSERT_SINGLE_ATTENDENCE);

  const [updateAnAttendence] = useAdminMutation<
    UpdateSingleAttendenceByPk,
    UpdateSingleAttendenceByPkVariables
  >(UPDATE_ATTENDENCE);

  /**
   * By clicking on a circle the user can change the attendance status of the course,
   * from grey to green, from green to red, and from red to grey.
   * @param  {AttendanceStatus_enum} previousStatus Previous attendance status
   * @returns {AttendanceStatus_enum} Returns an AttendanceStatus_enum
   */
  const updateAttendenceStatus = (previousStatus: AttendanceStatus_enum) => {
    if (previousStatus === AttendanceStatus_enum.ATTENDED) {
      return AttendanceStatus_enum.MISSED;
    }
    if (previousStatus === AttendanceStatus_enum.MISSED) {
      return AttendanceStatus_enum.NO_INFO;
    }
    return AttendanceStatus_enum.ATTENDED;
  };

  const handleDotClick = useCallback(
    async (session: ManagedCourse_Course_by_pk_Sessions) => {
      const obj = attendanceRecordBySession[session.id];
      if (obj) {
        const updatedStatus: AttendanceStatus_enum = updateAttendenceStatus(
          obj.status
        );
        const response = await updateAnAttendence({
          variables: {
            pkId: obj.id,
            changes: {
              status: updatedStatus,
            },
          },
        });
        if (response.errors) {
          console.log('Update Error: ', response.errors);
          return;
        }
        qResult.refetch();
        return;
      }

      // Insert attendance with default AttendanceStatus_enum = "ATTENDED"
      const response = await insertAttendence({
        variables: {
          input: {
            status: AttendanceStatus_enum.ATTENDED,
            sessionId: session.id,
            source: 'INSTRUCTOR',
            userId,
          },
        },
      });
      if (response.errors) {
        console.log('Error: ', response.errors);
        return;
      }
      qResult.refetch();
    },
    [
      attendanceRecordBySession,
      qResult,
      insertAttendence,
      updateAnAttendence,
      userId,
    ]
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
  const attendedSessionCount = () => {
    const result = dotsData.reduce(
      (prev, current) =>
        prev + (current.color === 'GREEN' || current.color === 'GREY' ? 1 : 0),
      0
    );
    return result;
  };

  const passedStatus = () => {
    const missedSession = sessions.length - attendedSessionCount();
    return missedSession > maxMissedSessions ? 'RED' : 'GREEN';
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
            <div className="flex space-x-5 flex-row">
              {dotsData.map((dotData) => {
                return (
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
                {`${attendedSessionCount()}/${sessions.length}`}{' '}
              </p>
              <EhDot color={passedStatus()} />
            </div>
          </div>
        </td>
        <td className={tdStyle}>
          <div className="flex space-x-2 flex-row">
            <div>
              <p className={pStyle}> {'PerformanceRating?'} </p>
            </div>
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

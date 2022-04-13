import { QueryResult } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { title } from "process";
import { FC, useCallback, useState } from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { useAdminMutation } from "../../hooks/authedMutation";
import { useAdminQuery } from "../../hooks/authedQuery";
import {
  COURSE_ENROLLMENT_BY_COURSE_ID,
  INSERT_SINGLE_ATTENDENCE,
  UPDATE_ATTENDENCE,
} from "../../queries/courseEnrollment";
import {
  CourseEnrollmentByCourseID,
  CourseEnrollmentByCourseIDVariables,
  CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments,
  CourseEnrollmentByCourseID_Course_by_pk_Sessions,
} from "../../queries/__generated__/CourseEnrollmentByCourseID";
import {
  InsertSingleAttendence,
  InsertSingleAttendenceVariables,
} from "../../queries/__generated__/InsertSingleAttendence";

import {
  UpdateSingleAttendenceByPk,
  UpdateSingleAttendenceByPkVariables,
} from "../../queries/__generated__/UpdateSingleAttendenceByPk";
import { StaticComponentProperty } from "../../types/UIComponents";
import { AttendanceStatus_enum } from "../../__generated__/globalTypes";
import { DOT_COLORS, EhDot } from "../common/dots";
import Loading from "../courses/Loading";

interface IProps {
  courseId: number;
}
const ManageCourseEnrollment: FC<IProps> = ({ courseId }) => {
  // const courseEnrollments = qResult.data?.Course_by_pk?.CourseEnrollments || [];
  const courseEnrollmentRequest = useAdminQuery<
    CourseEnrollmentByCourseID,
    CourseEnrollmentByCourseIDVariables
  >(COURSE_ENROLLMENT_BY_COURSE_ID, {
    variables: {
      courseId,
    },
  });
  if (courseEnrollmentRequest.error) {
    console.log(courseEnrollmentRequest.error);
  }
  return (
    <>
      {courseEnrollmentRequest.loading ? (
        <Loading />
      ) : (courseEnrollmentRequest.data?.Course_by_pk?.CourseEnrollments || [])
          .length > 0 ? (
        <EnrollmentList courseEnrollmentRequest={courseEnrollmentRequest} />
      ) : (
        <></>
      )}
    </>
  );
};

export default ManageCourseEnrollment;

/* #region Course Enrollment List */
interface IPropsEnrollmentList {
  courseEnrollmentRequest: QueryResult<
    CourseEnrollmentByCourseID,
    CourseEnrollmentByCourseIDVariables
  >;
}

const EnrollmentList: FC<IPropsEnrollmentList> = ({
  courseEnrollmentRequest,
}) => {
  const { t } = useTranslation(["user-common", "manage-course"]);

  const tableHeaders: StaticComponentProperty[] = [
    { key: 0, label: t("firstName") },
    { key: 1, label: t("lastName") },
    { key: 2, label: t("manage-course:attendances") },
    { key: 3, label: t("manage-course:certificateAchievement") },
  ];

  const enrollmentList =
    courseEnrollmentRequest.data?.Course_by_pk?.CourseEnrollments || [];
  const sessions = courseEnrollmentRequest.data?.Course_by_pk?.Sessions || [];

  return (
    <div className="overflow-x-auto transition-[height] w-full pb-10">
      <table className="w-full">
        <thead>
          <tr className="focus:outline-none h-16 ">
            {tableHeaders.map((component) => {
              return (
                <th key={component.key} className="py-2 px-10">
                  <p className="flex justify-start font-medium text-gray-700 uppercase">
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
              courseEnrollmentRequest={courseEnrollmentRequest}
              maxMissedSessions={
                courseEnrollmentRequest.data?.Course_by_pk?.maxMissedSessions ||
                0
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* #endregion */

interface IDotData {
  color: DOT_COLORS;
  session: CourseEnrollmentByCourseID_Course_by_pk_Sessions;
}

const pStyle = "text-gray-700 truncate";
const tdStyple = "font-medium bg-edu-course-list py-2 px-10 ";

/* #region OneCourseEnrollmentRow */

interface IPropsOneRow {
  enrollment: CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments;
  sessions: CourseEnrollmentByCourseID_Course_by_pk_Sessions[];
  courseEnrollmentRequest: QueryResult<
    CourseEnrollmentByCourseID,
    CourseEnrollmentByCourseIDVariables
  >;
  userId: string;
  maxMissedSessions: number;
}
const OneCourseEnrollmentRow: FC<IPropsOneRow> = ({
  enrollment,
  sessions,
  courseEnrollmentRequest,
  userId,
  maxMissedSessions,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const attendenceRecordBySession: Record<
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

  const [udpateAnAttendence] = useAdminMutation<
    UpdateSingleAttendenceByPk,
    UpdateSingleAttendenceByPkVariables
  >(UPDATE_ATTENDENCE);

  /**
   * By clicking on a circle the user can change the attendance status of the course,
   * from grey to green, from green to red, and from red to grey.
   * @param  {AttendanceStatus_enum} previousStatus Previous attendence status
   * @returns {AttendanceStatus_enum} Returns an AttendanceStatus_enum
   */
  const udateAttendenceStatus = (previousStatus: AttendanceStatus_enum) => {
    if (previousStatus === AttendanceStatus_enum.ATTENDED) {
      return AttendanceStatus_enum.MISSED;
    }
    if (previousStatus === AttendanceStatus_enum.MISSED) {
      return AttendanceStatus_enum.ATTENDED;
    }
    // TODO: no information for NO_INFO
    // if (session.title === AttendanceStatus_enum.NO_INFO) return AttendanceStatus_enum.ATTENDED;
    return AttendanceStatus_enum.ATTENDED;
  };

  // TODO: AttendanceSource_enum not Creating as "globalTypes" ??
  const handleDotClick = useCallback(
    async (session: CourseEnrollmentByCourseID_Course_by_pk_Sessions) => {
      const obj = attendenceRecordBySession[session.id];
      if (obj) {
        const udpatedStatus: AttendanceStatus_enum = udateAttendenceStatus(
          obj.status
        );
        const response = await udpateAnAttendence({
          variables: {
            pkId: obj.id,
            changes: {
              status: udpatedStatus,
            },
          },
        });
        if (response.errors) {
          console.log("Update Error: ", response.errors);
          return;
        }
        courseEnrollmentRequest.refetch();
        return;
      }

      // Insert attendence with default AttendanceStatus_enum = "ATTENDED"
      const response = await insertAttendence({
        variables: {
          input: {
            status: AttendanceStatus_enum.ATTENDED,
            sessionId: session.id,
            source: "INSTRUCTOR", // TODO , create AttendanceSource_enum as "globalTypes" ??
            userId,
          },
        },
      });
      if (response.errors) {
        console.log("Error: ", response.errors);
        return;
      }
      courseEnrollmentRequest.refetch();
    },
    [
      attendenceRecordBySession,
      courseEnrollmentRequest,
      insertAttendence,
      udpateAnAttendence,
      userId,
    ]
  );

  const handleDetailsClick = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, [setShowDetails]);

  // TODO: No enum called "UNRATED" in database. and No suggestion for "NO_INFO"
  /**
   * For each existing session in the course a circle is shown,
   * depending on the participant's attendance for each session the circle is green
   * [Attendance:Status=="ATTENDED"], red [Attendance:Status=="MISSED"], or grey [Attendance:Status=="UNRATED"]
   * *
   * @param {CourseEnrollmentByCourseID_Course_by_pk_Sessions} sn Database object
   * @returns {DOT_COLORS} ("GREY" | "GREEN" | "ORANGE" | "RED")
   */
  const dotColor = (sn: CourseEnrollmentByCourseID_Course_by_pk_Sessions) => {
    if (enrollment.User.Attendances.length === 0) return "GREY";
    const index = enrollment.User.Attendances.findIndex(
      (ob) => ob.Session.id === sn.id
    );
    if (index < 0) return "GREY";
    const attendance = enrollment.User.Attendances[index];
    if (attendance.status === AttendanceStatus_enum.MISSED) return "RED";
    if (attendance.status === AttendanceStatus_enum.ATTENDED) return "GREEN";
    // if (attendance.status === AttendanceStatus_enum.NO_INFO)  // TODO: not specified in github document
    return "GREY";
  };

  const dotsData: IDotData[] = sessions.map((session) => ({
    session,
    color: dotColor(session),
  }));
  const attendedSessionCount = () => {
    const result = dotsData.reduce(
      (prev, current) => prev + (current.color === "GREEN" ? 1 : 0),
      0
    );
    return result;
  };

  const passedStatus = () => {
    const missedSession = sessions.length - attendedSessionCount();
    return missedSession > maxMissedSessions ? "RED" : "GREEN";
  };

  return (
    <>
      <tr>
        <td className={tdStyple}>
          <p className={pStyle}>{enrollment.User.firstName}</p>
        </td>
        <td className={tdStyple}>
          <p className={pStyle}>{enrollment.User.lastName}</p>
        </td>
        <td className={tdStyple}>
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
                {" "}
                {`${attendedSessionCount()}/${sessions.length}`}{" "}
              </p>
              <EhDot color={passedStatus()} />
            </div>
          </div>
        </td>
        <td className={tdStyple}>
          <div className="flex space-x-2 flex-row">
            <div>
              <p className={pStyle}> {"//TODO: no PerformanceRating"} </p>
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
      <tr className={showDetails ? "h-0" : "h-1"} />
      {showDetails && <ShowDetails enrollment={enrollment} />}
    </>
  );
};

/* #endregion */
interface IPropsShowDetails {
  enrollment: CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments;
}
const ShowDetails: FC<IPropsShowDetails> = ({ enrollment }) => {
  return (
    <>
      <tr className="bg-edu-course-list f-full">
        <td colSpan={12} className={tdStyple}>
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
  handleDotClick: (
    session: CourseEnrollmentByCourseID_Course_by_pk_Sessions
  ) => void;
  session: CourseEnrollmentByCourseID_Course_by_pk_Sessions;
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

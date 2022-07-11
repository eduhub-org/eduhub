import { QueryResult } from "@apollo/client";
import { Button } from "@material-ui/core";
import { FC, useCallback, useMemo } from "react";
import { MdAddCircle } from "react-icons/md";
import {
  identityEventMapper,
  pickIdPkMapper,
  useAdminMutation,
  useDeleteCallback,
  useUpdateCallback,
  useUpdateCallback2,
} from "../../hooks/authedMutation";
import {
  DELETE_SESSION,
  DELETE_SESSION_LOCATION,
  DELETE_SESSION_SPEAKER,
  INSERT_NEW_SESSION,
  INSERT_NEW_SESSION_LOCATION,
  UPDATE_SESSION_END_TIME,
  UPDATE_SESSION_START_TIME,
  UPDATE_SESSION_TITLE,
} from "../../queries/course";
import {
  InsertCourseSession,
  InsertCourseSessionVariables,
} from "../../queries/__generated__/InsertCourseSession";
import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_Sessions,
} from "../../queries/__generated__/ManagedCourse";
import { SessionRow } from "./SessionRow";
import {
  DeleteCourseSession,
  DeleteCourseSessionVariables,
} from "../../queries/__generated__/DeleteCourseSession";
import {
  UpdateSessionStartTime,
  UpdateSessionStartTimeVariables,
} from "../../queries/__generated__/UpdateSessionStartTime";
import {
  UpdateSessionEndTime,
  UpdateSessionEndTimeVariables,
} from "../../queries/__generated__/UpdateSessionEndTime";
import {
  UpdateSessionTitle,
  UpdateSessionTitleVariables,
} from "../../queries/__generated__/UpdateSessionTitle";
import {
  InsertSessionLocation,
  InsertSessionLocationVariables,
} from "../../queries/__generated__/InsertSessionLocation";
import {
  DeleteCourseSessionLocation,
  DeleteCourseSessionLocationVariables,
} from "../../queries/__generated__/DeleteCourseSessionLocation";
import {
  DeleteSessionSpeaker,
  DeleteSessionSpeakerVariables,
} from "../../queries/__generated__/DeleteSessionSpeaker";

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

export const SessionsTab: FC<IProps> = ({ course, qResult }) => {
  const userRole = "instructor_access";

  const courseSessions = useMemo(() => {
    const result = [...course.Sessions];
    result.sort((a, b) => {
      const aValue = a.startDateTime.getTime();
      const bValue = b.startDateTime.getTime();
      return aValue - bValue;
    });
    return result;
  }, [course]);

  const [insertSessionMutation] = useAdminMutation<
    InsertCourseSession,
    InsertCourseSessionVariables
  >(INSERT_NEW_SESSION);
  const [insertSessionLocationMutation] = useAdminMutation<
    InsertSessionLocation,
    InsertSessionLocationVariables
  >(INSERT_NEW_SESSION_LOCATION);
  const insertSession = useCallback(async () => {
    const startTime: Date = new Date(
      courseSessions.length > 0
        ? courseSessions[courseSessions.length - 1].startDateTime
        : new Date()
    );
    const endTime: Date = new Date(
      courseSessions.length > 0
        ? courseSessions[courseSessions.length - 1].endDateTime
        : new Date()
    );
    startTime.setDate(startTime.getDate() + 7);
    endTime.setDate(endTime.getDate() + 7);
    const inserted = await insertSessionMutation({
      variables: {
        courseId: course.id,
        startTime,
        endTime,
      },
    });

    // add the standard locations
    const newSessionId = inserted?.data?.insert_Session?.returning[0]?.id;
    if (newSessionId != null) {
      for (const loc of course.CourseLocations) {
        await insertSessionLocationMutation({
          variables: {
            sessionId: newSessionId,
            link: loc.link,
          },
        });
      }
    }

    qResult.refetch();
  }, [
    course,
    qResult,
    insertSessionMutation,
    courseSessions,
    insertSessionLocationMutation,
  ]);

  const deleteSessionLocation = useDeleteCallback<
    DeleteCourseSessionLocation,
    DeleteCourseSessionLocationVariables
  >(
    DELETE_SESSION_LOCATION,
    userRole,
    "addressId",
    identityEventMapper,
    qResult
  );

  const deleteSessionSpeaker = useDeleteCallback<
    DeleteSessionSpeaker,
    DeleteSessionSpeakerVariables
  >(
    DELETE_SESSION_SPEAKER,
    userRole,
    "speakerId",
    identityEventMapper,
    qResult
  );

  const deleteSession = useDeleteCallback<
    DeleteCourseSession,
    DeleteCourseSessionVariables
  >(DELETE_SESSION, userRole, "sessionId", identityEventMapper, qResult);

  const setSessionTitle = useUpdateCallback2<
    UpdateSessionTitle,
    UpdateSessionTitleVariables
  >(
    UPDATE_SESSION_TITLE,
    userRole,
    "sessionId",
    "title",
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const setSessionStart = useUpdateCallback2<
    UpdateSessionStartTime,
    UpdateSessionStartTimeVariables
  >(
    UPDATE_SESSION_START_TIME,
    userRole,
    "sessionId",
    "startTime",
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const setSessionEnd = useUpdateCallback2<
    UpdateSessionEndTime,
    UpdateSessionEndTimeVariables
  >(
    UPDATE_SESSION_END_TIME,
    userRole,
    "sessionId",
    "endTime",
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={insertSession} startIcon={<MdAddCircle />}>
          neuen Termin hinzufügen
        </Button>
      </div>

      <div className="mb-8">
        <SessionRow
          onDelete={deleteSession}
          onSetStartDate={setSessionStart}
          onSetEndDate={setSessionEnd}
          onSetTitle={setSessionTitle}
          onDeleteSpeaker={deleteSessionSpeaker}
          onDeleteLocation={deleteSessionLocation}
          lectureStart={course.Program?.lectureStart}
          lectureEnd={course.Program?.lectureEnd}
          session={null}
          qResult={qResult}
        />
      </div>

      {courseSessions.map((session) => (
        <SessionRow
          onDelete={deleteSession}
          onSetStartDate={setSessionStart}
          onSetEndDate={setSessionEnd}
          onSetTitle={setSessionTitle}
          onDeleteLocation={deleteSessionLocation}
          onDeleteSpeaker={deleteSessionSpeaker}
          lectureStart={course.Program?.lectureStart}
          lectureEnd={course.Program?.lectureEnd}
          key={session.id}
          session={session}
          qResult={qResult}
        />
      ))}

      <div className="flex justify-end mt-4 mb-4">
        <Button onClick={insertSession} startIcon={<MdAddCircle />}>
          neuen Termin hinzufügen
        </Button>
      </div>
    </div>
  );
};

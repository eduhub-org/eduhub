import { QueryResult } from "@apollo/client";
import { Button } from "@material-ui/core";
import { FC, useCallback } from "react";
import { MdAddCircle } from "react-icons/md";
import { identityEventMapper, pickIdPkMapper, useAdminMutation, useDeleteCallback, useUpdateCallback, useUpdateCallback2 } from "../../hooks/authedMutation";
import { DELETE_SESSION, INSERT_NEW_SESSION, UPDATE_SESSION_END_TIME, UPDATE_SESSION_START_TIME } from "../../queries/course";
import { InsertCourseSession, InsertCourseSessionVariables } from "../../queries/__generated__/InsertCourseSession";
import { ManagedCourse_Course_by_pk, ManagedCourse_Course_by_pk_Sessions } from "../../queries/__generated__/ManagedCourse";
import { SessionRow } from "./SessionRow";
import { DeleteCourseSession, DeleteCourseSessionVariables } from "../../queries/__generated__/DeleteCourseSession";
import { UpdateSessionStartTime, UpdateSessionStartTimeVariables } from "../../queries/__generated__/UpdateSessionStartTime";
import { UpdateSessionEndTime, UpdateSessionEndTimeVariables } from "../../queries/__generated__/UpdateSessionEndTime";

interface IProps {
    course: ManagedCourse_Course_by_pk,
    qResult: QueryResult<any, any>
}


export const SessionsTab: FC<IProps> = ({
    course,
    qResult
}) => {

    // TODO
    const userRole = "admin";

    const courseSessions = [...course.Sessions];
    courseSessions.sort((a, b) => {
        const aValue = a.startDateTime.getTime();
        const bValue = b.startDateTime.getTime();
        return aValue - bValue;
    });

    const [insertSessionMutation] = useAdminMutation<
        InsertCourseSession,
        InsertCourseSessionVariables
    >(INSERT_NEW_SESSION);
    const insertSession = useCallback(async () => {
        const startTime: Date = new Date(courseSessions.length > 0 ? courseSessions[courseSessions.length - 1].startDateTime : new Date());
        const endTime: Date = new Date(courseSessions.length > 0 ? courseSessions[courseSessions.length - 1].endDateTime : new Date());
        startTime.setDate(startTime.getDate() + 7);
        endTime.setDate(endTime.getDate() + 7);
        await insertSessionMutation({
            variables: {
                courseId: course.id,
                startTime,
                endTime
            }
        });
        qResult.refetch();
    }, [qResult, insertSessionMutation]);

    const deleteSession = useDeleteCallback<DeleteCourseSession, DeleteCourseSessionVariables>(
        DELETE_SESSION,
        userRole,
        "sessionId",
        identityEventMapper,
        qResult
    );

    const setSessionStart = useUpdateCallback2<
        UpdateSessionStartTime,
        UpdateSessionStartTimeVariables
    >(UPDATE_SESSION_START_TIME, userRole, "sessionId", "startTime", pickIdPkMapper, identityEventMapper, qResult);
    
    const setSessionEnd = useUpdateCallback2<
        UpdateSessionEndTime,
        UpdateSessionEndTimeVariables
    >(UPDATE_SESSION_END_TIME, userRole, "sessionId", "endTime", pickIdPkMapper, identityEventMapper, qResult);

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
                    session={null} />
            </div>

            {courseSessions.map(session =>
                <SessionRow 
                    onDelete={deleteSession}
                    onSetStartDate={setSessionStart}
                    onSetEndDate={setSessionEnd}
                    key={session.id} 
                    session={session} />
            )}

            <div className="flex justify-end mt-4 mb-4">
                <Button onClick={insertSession} startIcon={<MdAddCircle />}>
                    neuen Termin hinzufügen
                </Button>
            </div>

        </div>
    );
}
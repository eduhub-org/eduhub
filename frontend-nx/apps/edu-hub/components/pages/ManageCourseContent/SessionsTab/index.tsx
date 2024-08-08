import { QueryResult } from '@apollo/client';
import { Button } from '@material-ui/core';
import { FC, useCallback, useMemo } from 'react';

import { MdAddCircle } from 'react-icons/md';
import {
  identityEventMapper,
  pickIdPkMapper,
  useRoleMutation,
  useDeleteCallback,
  useUpdateCallback2,
} from '../../../../hooks/authedMutation';
import {
  DELETE_SESSION,
  DELETE_SESSION_SPEAKER,
  INSERT_SESSION_WITH_ADDRESSES,
  UPDATE_SESSION_END_TIME,
  UPDATE_SESSION_START_TIME,
  UPDATE_SESSION_TITLE,
} from '../../../../queries/course';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import { SessionRow } from './SessionRow';
import { DeleteSession, DeleteSessionVariables } from '../../../../queries/__generated__/DeleteSession';
import {
  UpdateSessionStartTime,
  UpdateSessionStartTimeVariables,
} from '../../../../queries/__generated__/UpdateSessionStartTime';
import {
  UpdateSessionEndTime,
  UpdateSessionEndTimeVariables,
} from '../../../../queries/__generated__/UpdateSessionEndTime';
import { UpdateSessionTitle, UpdateSessionTitleVariables } from '../../../../queries/__generated__/UpdateSessionTitle';
import {
  InsertSessionWithAddresses,
  InsertSessionWithAddressesVariables,
} from '../../../../queries/__generated__/InsertSessionWithAddresses';
import {
  DeleteSessionSpeaker,
  DeleteSessionSpeakerVariables,
} from '../../../../queries/__generated__/DeleteSessionSpeaker';
import useTranslation from 'next-translate/useTranslation';
import { SessionAddress_insert_input } from '../../../../__generated__/globalTypes';

// Import the utility functions
import { convertToUTCTimeString, convertToGermanTimeString } from '../../../../helpers/dateHelpers';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

export const SessionsTab: FC<IProps> = ({ course, qResult }) => {
  const { t } = useTranslation();

  const courseSessions = useMemo(() => {
    const result = [...course.Sessions];
    result.sort((a, b) => {
      const aValue = a.startDateTime.getTime();
      const bValue = b.startDateTime.getTime();
      return aValue - bValue;
    });
    return result;
  }, [course]);

  // Get all location ids for the course
  const courseLocationIds = useMemo(() => {
    const result = course.CourseLocations.map((location) => location.id);
    return result;
  }, [course.CourseLocations]);

  const sessionAddresses: SessionAddress_insert_input[] = courseLocationIds.map((courseLocationId) => ({
    courseLocationId: courseLocationId,
  }));

  const [insertSessionMutation] = useRoleMutation<InsertSessionWithAddresses, InsertSessionWithAddressesVariables>(
    INSERT_SESSION_WITH_ADDRESSES
  );

  const insertSession = useCallback(async () => {
    const lastSession = courseSessions.length > 0 ? courseSessions[courseSessions.length - 1] : null;

    const startTime: Date = new Date(lastSession ? lastSession.startDateTime : new Date());
    const endTime: Date = new Date(lastSession ? lastSession.endDateTime : new Date());

    startTime.setDate(startTime.getDate() + 7);
    endTime.setDate(endTime.getDate() + 7);

    // Convert to UTC time string
    const startTimeUTC = convertToUTCTimeString(convertToGermanTimeString(startTime), startTime);
    const endTimeUTC = convertToUTCTimeString(convertToGermanTimeString(endTime), endTime);

    await insertSessionMutation({
      variables: {
        courseId: course.id,
        startTime: new Date(startTimeUTC),
        endTime: new Date(endTimeUTC),
        sessionAddresses: sessionAddresses,
      },
    });

    qResult.refetch();
  }, [sessionAddresses, courseSessions, insertSessionMutation, course.id, qResult]);

  const deleteSessionSpeaker = useDeleteCallback<DeleteSessionSpeaker, DeleteSessionSpeakerVariables>(
    DELETE_SESSION_SPEAKER,
    'speakerId',
    identityEventMapper,
    qResult
  );

  const deleteSession = useDeleteCallback<DeleteSession, DeleteSessionVariables>(
    DELETE_SESSION,
    'sessionId',
    identityEventMapper,
    qResult
  );

  const setSessionTitle = useUpdateCallback2<UpdateSessionTitle, UpdateSessionTitleVariables>(
    UPDATE_SESSION_TITLE,
    'sessionId',
    'title',
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const setSessionStart = useUpdateCallback2<UpdateSessionStartTime, UpdateSessionStartTimeVariables>(
    UPDATE_SESSION_START_TIME,
    'sessionId',
    'startTime',
    pickIdPkMapper,
    (event, session) => convertToUTCTimeString(event.target.value, new Date(session.startDateTime)),
    qResult
  );

  const setSessionEnd = useUpdateCallback2<UpdateSessionEndTime, UpdateSessionEndTimeVariables>(
    UPDATE_SESSION_END_TIME,
    'sessionId',
    'endTime',
    pickIdPkMapper,
    (event, session) => convertToUTCTimeString(event.target.value, new Date(session.endDateTime)),
    qResult
  );

  return (
    <div>
      <div className="flex justify-start mb-4 text-white">
        <Button onClick={insertSession} startIcon={<MdAddCircle />} color="inherit">
          {t('course-page:add-session')}
        </Button>
      </div>

      <div className="mb-3 text-gray-400">
        <SessionRow
          onDelete={deleteSession}
          onSetStartDate={setSessionStart}
          onSetEndDate={setSessionEnd}
          onSetTitle={setSessionTitle}
          onDeleteSpeaker={deleteSessionSpeaker}
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
          onDeleteSpeaker={deleteSessionSpeaker}
          lectureStart={course.Program?.lectureStart}
          lectureEnd={course.Program?.lectureEnd}
          key={session.id}
          session={session}
          qResult={qResult}
        />
      ))}
    </div>
  );
};

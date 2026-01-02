import { QueryResult } from '@apollo/client';
import { Button } from '@mui/material';
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
  UPDATE_SESSION_TITLE,
} from '../../../../queries/course';
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk,
} from '../../../../queries/__generated__/ManagedCourse';
import { SessionRow } from './SessionRow';
import { DeleteSession, DeleteSessionVariables } from '../../../../queries/__generated__/DeleteSession';
import { UpdateSessionTitle, UpdateSessionTitleVariables } from '../../../../queries/__generated__/UpdateSessionTitle';
import {
  InsertSessionWithAddresses,
  InsertSessionWithAddressesVariables,
} from '../../../../queries/__generated__/InsertSessionWithAddresses';
import {
  DeleteSessionSpeaker,
  DeleteSessionSpeakerVariables,
} from '../../../../queries/__generated__/DeleteSessionSpeaker';
import { useTranslations, useLocale } from 'next-intl';
import { SessionAddress_insert_input } from '../../../../__generated__/globalTypes';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<ManagedCourse, ManagedCourseVariables>;
}

export const SessionsTab: FC<IProps> = ({ course, qResult }) => {
  const t = useTranslations("manageCourse");

  const courseSessions = useMemo(() => {
    const result = [...course.Sessions];
    result.sort((a, b) => {
      const aValue = a.startDateTime.getTime();
      const bValue = b.startDateTime.getTime();
      return aValue - bValue;
    });
    return result;
  }, [course]);

  // get all locations ids for the course
  const courseLocationIds = useMemo(() => {
    const result = course.CourseLocations.map((location) => location.id);
    return result;
  }, [course.CourseLocations]); // Add dependency array here

  const sessionAddresses: SessionAddress_insert_input[] = courseLocationIds.map((courseLocationId) => ({
    courseLocationId: courseLocationId,
  }));

  const [insertSessionMutation] = useRoleMutation<InsertSessionWithAddresses, InsertSessionWithAddressesVariables>(
    INSERT_SESSION_WITH_ADDRESSES
  );
  const insertSession = useCallback(async () => {
    let startTime: Date;
    let endTime: Date;

    if (courseSessions.length > 0) {
      // Copy from last session but add 7 days
      startTime = new Date(courseSessions[courseSessions.length - 1].startDateTime);
      endTime = new Date(courseSessions[courseSessions.length - 1].endDateTime);

      // Add 7 days to both dates
      startTime.setDate(startTime.getDate() + 7);
      endTime.setDate(endTime.getDate() + 7);
    } else {
      // Use course start/end time if available, otherwise default to 00:00-00:00
      const today = new Date();
      startTime = new Date(today);
      endTime = new Date(today);

      if (course.startTime) {
        // Parse course.startTime (format: "HH:MM:SS") and set to startTime
        const [startHours, startMinutes] = course.startTime.split(':').map(Number);
        startTime.setHours(startHours, startMinutes, 0, 0);
      } else {
        // Default to 00:00 AM if no course start time
        startTime.setHours(0, 0, 0, 0);
      }

      if (course.endTime) {
        // Parse course.endTime (format: "HH:MM:SS") and set to endTime
        const [endHours, endMinutes] = course.endTime.split(':').map(Number);
        endTime.setHours(endHours, endMinutes, 0, 0);
      } else {
        // Default to 00:00 AM if no course end time
        endTime.setHours(0, 0, 0, 0);
      }
    }

    await insertSessionMutation({
      variables: {
        courseId: course.id,
        startTime,
        endTime,
        sessionAddresses: sessionAddresses,
      },
    });

    qResult.refetch();
  }, [sessionAddresses, courseSessions, insertSessionMutation, course.id, course.startTime, course.endTime, qResult]);

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

  return (
    <div>
      <div className="flex justify-start mb-4 text-white">
        <Button onClick={insertSession} startIcon={<MdAddCircle />} color="inherit">
          {t('add_session')}
        </Button>
      </div>

      <div className="mb-3 text-gray-400">
        <SessionRow
          onDelete={deleteSession}
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

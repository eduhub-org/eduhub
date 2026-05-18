import { memo, useMemo } from 'react';
import { Tooltip } from '@mui/material';
import Dot, { DotColor } from '../../../common/Dot';
import {
  collapseAttendancesBySession,
  getAttendanceStatusFromMap,
  getDotColorForAttendance,
} from '../../../../helpers/courseParticipationAttendance';
import {
  CourseParticipations_Course_by_pk_CourseEnrollments,
  CourseParticipations_Course_by_pk_Sessions,
} from '../../../../queries/__generated__/CourseParticipations';

export interface AttendanceDotsCellProps {
  enrollment: CourseParticipations_Course_by_pk_CourseEnrollments;
  sessions: readonly CourseParticipations_Course_by_pk_Sessions[];
  sessionTooltips: readonly string[];
  maxMissedSessions: number;
  statusTooltipPassed: string;
  statusTooltipFailed: string;
  statusTooltipUncertain: string;
  onDotClick: (session: CourseParticipations_Course_by_pk_Sessions, userId: string) => void;
}

const SessionDot = memo(function SessionDot({
  color,
  title,
  onClick,
}: {
  color: DotColor;
  title: string;
  onClick: () => void;
}) {
  return (
    <Dot
      color={color}
      className="cursor-pointer hover:border-2 hover:border-indigo-200 hover:rounded-full flex-shrink-0"
      title={title}
      onClick={onClick}
    />
  );
});

function AttendanceDotsCellComponent({
  enrollment,
  sessions,
  sessionTooltips,
  maxMissedSessions,
  statusTooltipPassed,
  statusTooltipFailed,
  statusTooltipUncertain,
  onDotClick,
}: AttendanceDotsCellProps) {
  const attendanceBySession = useMemo(
    () => collapseAttendancesBySession(enrollment.User.Attendances),
    [enrollment.User.Attendances]
  );

  const { attended, total, statusDotColor, statusTooltip } = useMemo(() => {
    let missed = 0;
    let attendedCount = 0;
    for (const session of sessions) {
      const color = getDotColorForAttendance(attendanceBySession[session.id]);
      if (color === 'red') missed += 1;
      if (color === 'lightgreen') attendedCount += 1;
    }
    const status = getAttendanceStatusFromMap(attendanceBySession, sessions, maxMissedSessions);
    const statusDotColor: DotColor =
      status === 'passed' ? 'lightgreen' : status === 'failed' ? 'red' : 'grey';
    const statusTooltip =
      status === 'passed'
        ? statusTooltipPassed
        : status === 'failed'
          ? statusTooltipFailed
          : statusTooltipUncertain;
    return {
      attended: attendedCount,
      total: attendedCount + missed,
      statusDotColor,
      statusTooltip,
    };
  }, [
    attendanceBySession,
    sessions,
    maxMissedSessions,
    statusTooltipPassed,
    statusTooltipFailed,
    statusTooltipUncertain,
  ]);

  const userId = enrollment.userId;

  return (
    <div className="flex flex-row items-center gap-4 min-w-0">
      <div
        className="flex flex-row items-center gap-1 overflow-x-auto max-w-[220px] flex-nowrap"
        role="list"
        aria-label="session attendance"
      >
        {sessions.map((session, index) => (
          <SessionDot
            key={session.id}
            color={getDotColorForAttendance(attendanceBySession[session.id])}
            title={sessionTooltips[index] ?? ''}
            onClick={() => onDotClick(session, userId)}
          />
        ))}
      </div>
      <div className="flex flex-row items-center gap-1 flex-shrink-0">
        <span className="text-label-primary text-sm whitespace-nowrap">{`${attended}/${total}`}</span>
        <Tooltip title={statusTooltip}>
          <span className="inline-flex">
            <Dot color={statusDotColor} />
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

export const AttendanceDotsCell = memo(AttendanceDotsCellComponent);

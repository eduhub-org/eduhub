import { FC } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { AttendanceStatus_enum, LocationOption_enum } from '../../../../__generated__/globalTypes';
import { AttendanceLike, SessionAttendances } from '../../../../helpers/courseParticipationAttendance';
import {
  ATTENDANCE_SOURCE_ZOOM,
  MIN_ATTENDANCE_SHARE,
  attendanceLocationOption,
  attendanceShare,
  formatMinutes,
  formatPercent,
  parseClosestCandidates,
} from '../../../../helpers/attendanceDetails';

interface Props {
  /** Session date, program and optional labels shown first. */
  heading: string;
  attendances: SessionAttendances;
  sessionStart: string | null;
  sessionEnd: string | null;
  /** Match quality (email / name score) is only shown to admins. */
  showMatchQuality: boolean;
}

const isLocationOption = (value: string | null): value is LocationOption_enum =>
  value != null && (Object.values(LocationOption_enum) as string[]).includes(value);

/** What the automatic check found for one Participant and Session, line by line. */
const useAutomaticLines = (sessionStart: string | null, sessionEnd: string | null, showMatchQuality: boolean) => {
  const t = useTranslations('manageCourse.attendance_hover');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
  const formatTime = (value: string | null | undefined) => {
    const ms = value ? Date.parse(value) : Number.NaN;
    return Number.isNaN(ms) ? null : timeFormat.format(new Date(ms));
  };
  const locationLabel = (option: string | null) =>
    isLocationOption(option) ? tCommon(`location.${option}`) : option ?? '';

  return (attendance: AttendanceLike): string[] => {
    const lines: string[] = [];
    const matched = attendance.matchType != null && attendance.matchType !== 'NONE';

    if (matched || attendance.status === AttendanceStatus_enum.ATTENDED) {
      const option = attendanceLocationOption(attendance.source, attendance.location);
      if (attendance.source === ATTENDANCE_SOURCE_ZOOM) {
        const share = attendanceShare(attendance.totalAttendanceTime, sessionStart, sessionEnd);
        const range = [formatTime(attendance.startDateTime), formatTime(attendance.endDateTime)]
          .filter(Boolean)
          .join('–');
        lines.push(
          [
            locationLabel(option),
            range,
            [formatMinutes(attendance.totalAttendanceTime), share != null ? `(${formatPercent(share)})` : null]
              .filter(Boolean)
              .join(' '),
            attendance.interruptionCount ? t('interruptions', { count: attendance.interruptionCount }) : null,
            share != null && share < MIN_ATTENDANCE_SHARE ? t('below_minimum') : null,
          ]
            .filter(Boolean)
            .join(' · ')
        );
      } else {
        const place = attendance.location?.trim();
        const checkedIn = formatTime(attendance.startDateTime);
        lines.push(
          [
            locationLabel(option),
            place && place !== locationLabel(option) ? place : null,
            checkedIn ? t('checked_in', { time: checkedIn }) : null,
          ]
            .filter(Boolean)
            .join(' · ')
        );
      }
      if (showMatchQuality && matched) {
        if (attendance.matchType === 'EMAIL') lines.push(t('match_email'));
        else if (attendance.matchScore != null) {
          lines.push(
            t(attendance.matchType === 'PARTIAL_NAME' ? 'match_partial_name' : 'match_name', {
              score: attendance.matchScore,
            })
          );
        }
      }
      return lines;
    }

    const candidates = parseClosestCandidates(attendance.closestCandidates);
    if (candidates.length > 0) {
      lines.push(t('not_recognised'));
      candidates.forEach((c) =>
        lines.push(t('closest', { location: locationLabel(c.location), identifier: c.identifier, score: c.score }))
      );
    } else if (attendance.recordedIdentifier) {
      // Sessions checked before closest candidates were stored per location.
      lines.push(t('not_recognised'));
      lines.push(t('closest_legacy', { identifier: attendance.recordedIdentifier }));
    } else {
      lines.push(t('no_records'));
    }
    return lines;
  };
};

export const AttendanceDotTooltip: FC<Props> = ({
  heading,
  attendances,
  sessionStart,
  sessionEnd,
  showMatchQuality,
}) => {
  const t = useTranslations('manageCourse.attendance_hover');
  const automaticLines = useAutomaticLines(sessionStart, sessionEnd, showMatchQuality);
  const { manual, automatic } = attendances;
  const statusLabel = (status: AttendanceStatus_enum) =>
    status === AttendanceStatus_enum.ATTENDED
      ? t('attended')
      : status === AttendanceStatus_enum.MISSED
        ? t('missed')
        : t('unknown');

  let lines: string[];
  if (manual) {
    lines = [
      t('manual', { status: statusLabel(manual.status) }),
      automatic
        ? `${t('automatic', { status: statusLabel(automatic.status) })}: ${automaticLines(automatic).join(' · ')}`
        : t('automatic_not_checked'),
    ];
  } else if (automatic) {
    lines = automaticLines(automatic);
  } else {
    lines = [t('not_checked')];
  }

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <span className="font-semibold">{heading}</span>
      {lines.map((line, i) => (
        <span key={i}>{line}</span>
      ))}
    </div>
  );
};

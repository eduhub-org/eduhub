import { Menu, MenuItem } from '@mui/material';
import { useLocale, useTranslations } from 'next-intl';
import { FC, MouseEvent, useCallback, useState } from 'react';

import { Button } from '../../../common/Button';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { useLazyRoleQuery } from '../../../../hooks/authedQuery';
import { MANAGED_COURSE_PARTICIPANT_EXPORT } from '../../../../queries/course';
import {
  ManagedCourseParticipantExport,
  ManagedCourseParticipantExportVariables,
} from '../../../../queries/__generated__/ManagedCourseParticipantExport';
import { useAppSettings } from '../../../../contexts/AppSettingsContext';
import { AttendanceStatus_enum } from '../../../../__generated__/globalTypes';
import { getDayStatus, groupSessionsIntoAttendanceDays } from '../../../../helpers/attendanceDays';
import { collapseAttendancesBySession, groupAttendancesByUser } from '../../../../helpers/courseParticipationAttendance';
import { mergeSessions } from '../../../../helpers/programSessions';
import {
  attendanceDayLabel,
  buildAttendanceListHtml,
  buildCsv,
  buildNameTagsHtml,
  downloadTextFile,
  exportFileName,
  printHtml,
  toExportParticipants,
} from './participantExport';

type ExportKind = 'csv' | 'attendance_list' | 'name_tags';

const EXPORT_KINDS: ExportKind[] = ['csv', 'attendance_list', 'name_tags'];

interface ParticipantExportMenuProps {
  courseId: number;
}

/**
 * Exports everyone with an active enrollment (guests included) for on-site
 * use: a CSV for spreadsheets and mail merge, a printable attendance list to
 * tick off, and printable name tags. The CSV has one attendance column per day
 * with a session; filled in, it can be uploaded on the participations tab.
 */
export const ParticipantExportMenu: FC<ParticipantExportMenuProps> = ({ courseId }) => {
  const t = useTranslations('manageCourse.participant_export');
  const locale = useLocale();
  const { timeZone } = useAppSettings();

  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [loadParticipants, { loading }] = useLazyRoleQuery<
    ManagedCourseParticipantExport,
    ManagedCourseParticipantExportVariables
  >(MANAGED_COURSE_PARTICIPANT_EXPORT, { fetchPolicy: 'network-only' });

  const handleExport = useCallback(
    async (kind: ExportKind) => {
      setAnchorElement(null);
      try {
        const result = await loadParticipants({ variables: { id: courseId } });
        const course = result.data?.Course_by_pk;
        if (result.error || !course) {
          setErrorMessage(t('failed'));
          return;
        }

        const participants = toExportParticipants(course.CourseEnrollments);
        if (participants.length === 0) {
          setErrorMessage(t('no_participants'));
          return;
        }

        if (kind === 'csv') {
          const statusLabel = (status: string) =>
            ['REGISTERED', 'CONFIRMED', 'COMPLETED'].includes(status) ? t(`statuses.${status}`) : status;
          const days = groupSessionsIntoAttendanceDays(
            mergeSessions(course.Sessions, course.Program?.Sessions),
            timeZone
          );
          const attendanceCells = course.CourseEnrollments.map(({ User }) => {
            const [attendances = []] = Object.values(
              groupAttendancesByUser(User.Attendances.map((a) => ({ ...a, userId: User.id })))
            );
            const attendanceBySession = collapseAttendancesBySession(attendances);
            return days.map((day) =>
              getDayStatus(day, attendanceBySession) === AttendanceStatus_enum.ATTENDED ? 'x' : ''
            );
          });
          const csv = buildCsv(
            [
              [
                t('last_name'),
                t('first_name'),
                t('organization'),
                t('email'),
                t('status'),
                ...days.map((day) => t('present_on', { date: attendanceDayLabel(day.dayStart, timeZone, locale) })),
              ],
              ...participants.map((p, index) => [
                p.lastName,
                p.firstName,
                p.organization,
                p.email,
                statusLabel(p.status),
                ...attendanceCells[index],
              ]),
            ],
            locale === 'de' ? ';' : ','
          );
          downloadTextFile(csv, exportFileName(course.title, t('file_suffix'), 'csv'), 'text/csv;charset=utf-8');
          return;
        }

        if (kind === 'attendance_list') {
          const firstSessionStart = course.Sessions[0]?.startDateTime;
          const subtitle = firstSessionStart
            ? new Date(firstSessionStart).toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '';
          printHtml(
            buildAttendanceListHtml({
              courseTitle: course.title,
              subtitle,
              participants,
              lang: locale,
              labels: {
                number: t('number'),
                lastName: t('last_name'),
                firstName: t('first_name'),
                organization: t('organization'),
                present: t('present'),
                signature: t('signature'),
                count: t('count', { count: participants.length }),
              },
            })
          );
          return;
        }

        printHtml(buildNameTagsHtml({ courseTitle: course.title, participants, lang: locale }));
      } catch {
        setErrorMessage(t('failed'));
      }
    },
    [courseId, loadParticipants, locale, t, timeZone]
  );

  return (
    <>
      <Button
        onClick={(event: MouseEvent<HTMLElement>) => setAnchorElement(event.currentTarget)}
        disabled={loading}
        aria-haspopup="menu"
        aria-expanded={anchorElement !== null}
        inverted
      >
        {t('button')}
      </Button>
      <Menu
        anchorEl={anchorElement}
        open={anchorElement !== null}
        onClose={() => setAnchorElement(null)}
        PaperProps={{ className: 'light' }}
      >
        {EXPORT_KINDS.map((kind) => (
          <MenuItem key={kind} onClick={() => handleExport(kind)}>
            {t(kind)}
          </MenuItem>
        ))}
        <li className="px-4 pt-2 pb-1 text-xs text-gray-500 max-w-xs" role="note">
          {t('hint')}
        </li>
      </Menu>
      <ErrorMessageDialog open={errorMessage !== ''} errorMessage={errorMessage} onClose={() => setErrorMessage('')} />
    </>
  );
};

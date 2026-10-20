import { useTranslations } from 'next-intl';
import { ChangeEvent, FC, useCallback, useRef, useState } from 'react';

import { Button } from '../../../common/Button';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { useLazyRoleQuery } from '../../../../hooks/authedQuery';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { ATTENDANCE_SOURCE_INSTRUCTOR } from '../../../../helpers/attendance';
import { AttendanceDay } from '../../../../helpers/attendanceDays';
import { useDisplayDate } from '../../../../helpers/dateTimeHelpers';
import { COURSE_ATTENDANCE_IMPORT_PARTICIPANTS } from '../../../../queries/courseParticipation';
import { INSERT_ATTENDANCES } from '../../../../queries/courseEnrollment';
import {
  CourseAttendanceImportParticipants,
  CourseAttendanceImportParticipantsVariables,
} from '../../../../queries/__generated__/CourseAttendanceImportParticipants';
import { InsertAttendances, InsertAttendancesVariables } from '../../../../queries/__generated__/InsertAttendances';
import { parseAttendanceCsv, parseCsv } from '../ParticipantExport/participantExport';
import { AttendanceImportPlan, planAttendanceImport } from './attendanceImport';

// Long lists of unknown emails or unreadable cells are cut off in the dialog.
const MAX_LISTED = 10;

const listed = (items: string[]) =>
  items.slice(0, MAX_LISTED).join(', ') + (items.length > MAX_LISTED ? ', …' : '');

interface AttendanceCsvUploadProps {
  courseId: number;
  days: readonly AttendanceDay[];
  onImported: (message: string) => void;
}

/**
 * Imports the participant CSV from the registrations tab after its day columns
 * were filled in: x / ja / 1 marks attended, an empty cell marks missed.
 * Participants are matched by email; a summary is confirmed before writing.
 */
export const AttendanceCsvUpload: FC<AttendanceCsvUploadProps> = ({ courseId, days, onImported }) => {
  const t = useTranslations('manageCourse.attendance_import');
  const displayDate = useDisplayDate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<AttendanceImportPlan | null>(null);
  const [invalidCells, setInvalidCells] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [loadParticipants] = useLazyRoleQuery<
    CourseAttendanceImportParticipants,
    CourseAttendanceImportParticipantsVariables
  >(COURSE_ATTENDANCE_IMPORT_PARTICIPANTS, { fetchPolicy: 'network-only' });
  const [insertAttendances] = useRoleMutation<InsertAttendances, InsertAttendancesVariables>(INSERT_ATTENDANCES, {
    refetchQueries: ['CourseParticipations', 'CourseParticipationAttendances'],
  });

  const handleFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Choosing the same file again must fire another change event.
      event.target.value = '';
      if (!file) return;

      setBusy(true);
      try {
        const parsed = parseAttendanceCsv(parseCsv(await file.text()));
        if (!parsed.hasEmailColumn) {
          setErrorMessage(t('no_email_column'));
          return;
        }
        if (parsed.dayColumns.length === 0) {
          setErrorMessage(t('no_day_columns'));
          return;
        }

        const result = await loadParticipants({ variables: { courseId } });
        if (result.error || !result.data) {
          setErrorMessage(t('failed'));
          return;
        }
        const participants = result.data.CourseEnrollment.map((enrollment) => ({
          userId: enrollment.userId,
          email: enrollment.User.email,
          Attendances: enrollment.User.Attendances.map((attendance) => ({
            id: attendance.id,
            status: attendance.status,
            source: attendance.source,
            Session: { id: attendance.sessionId },
          })),
        }));

        const nextPlan = planAttendanceImport({ parsed, days, participants });
        if (nextPlan.importedDayKeys.length === 0) {
          setErrorMessage(t('no_matching_days'));
          return;
        }
        setInvalidCells(parsed.invalidCells.map((cell) => t('invalid_cell', { ...cell })));
        setPlan(nextPlan);
      } catch {
        setErrorMessage(t('failed'));
      } finally {
        setBusy(false);
      }
    },
    [courseId, days, loadParticipants, t]
  );

  const handleConfirm = useCallback(async () => {
    if (!plan) return;
    const { changes, attendedDays, missedDays } = plan;
    setPlan(null);
    if (changes.length === 0) return;

    setBusy(true);
    try {
      await insertAttendances({
        variables: {
          objects: changes.map((change) => ({ ...change, source: ATTENDANCE_SOURCE_INSTRUCTOR })),
        },
      });
      onImported(t('success', { attended: attendedDays, missed: missedDays }));
    } catch (error) {
      setErrorMessage(t('save_failed', { error: error instanceof Error ? error.message : String(error) }));
    } finally {
      setBusy(false);
    }
  }, [insertAttendances, onImported, plan, t]);

  const summary = plan
    ? [
        t('summary_matched', { count: plan.matchedCount }),
        t('summary_days', {
          days: plan.importedDayKeys
            .map((key) => displayDate(days.find((day) => day.dayKey === key)?.dayStart ?? key))
            .join(', '),
        }),
        plan.changes.length > 0
          ? t('summary_changes', { attended: plan.attendedDays, missed: plan.missedDays })
          : t('summary_no_changes'),
        plan.unknownEmails.length > 0
          ? t('summary_unknown_emails', { count: plan.unknownEmails.length, emails: listed(plan.unknownEmails) })
          : null,
        plan.ignoredColumns.length > 0 ? t('summary_ignored_columns', { columns: listed(plan.ignoredColumns) }) : null,
        invalidCells.length > 0
          ? t('summary_invalid_cells', { count: invalidCells.length, cells: listed(invalidCells) })
          : null,
      ]
        .filter(Boolean)
        .join('\n\n')
    : '';

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
        data-testid="attendance-csv-input"
      />
      <Button onClick={() => inputRef.current?.click()} disabled={busy || days.length === 0} inverted>
        {t('button')}
      </Button>
      <QuestionConfirmationDialog
        open={plan !== null}
        title={t('dialog_title')}
        question={summary}
        confirmationText={t('confirm')}
        confirmDisabled={plan?.changes.length === 0}
        onClose={() => setPlan(null)}
        onConfirm={handleConfirm}
      />
      <ErrorMessageDialog open={errorMessage !== ''} errorMessage={errorMessage} onClose={() => setErrorMessage('')} />
    </>
  );
};

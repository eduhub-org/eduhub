import { FC, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Popover } from '@mui/material';
import { MdEdit } from 'react-icons/md';

import { UPDATE_SESSION_END_TIME, UPDATE_SESSION_START_TIME } from '../../../../queries/course';
import OptimisticDatePicker from '../../../inputs/OptimisticDatePicker';
import TimePicker from '../../../inputs/TimePicker';
import { useDisplayDate, useFormatTimeString } from '../../../../helpers/dateTimeHelpers';
import { useAppSettings } from '../../../../contexts/AppSettingsContext';

interface TimedSession {
  id: number;
  startDateTime: Date;
  endDateTime: Date;
}

interface SessionTimeEditorProps {
  session: TimedSession;
  onSetDate: (event: Date | null) => void;
  onTimeChanged: () => void;
  minDate?: Date;
  maxDate?: Date;
}

/** Date plus start and end time of a session, each saved on its own like the former table cells. */
export const SessionTimeEditor: FC<SessionTimeEditorProps> = ({ session, onSetDate, onTimeChanged, minDate, maxDate }) => {
  const tCoursePage = useTranslations('coursePage');
  const fieldLabel = 'flex flex-col gap-1 text-xs font-semibold text-label-secondary';

  return (
    <div className="flex flex-col gap-3">
      <div className={fieldLabel}>
        {tCoursePage('date')}
        <OptimisticDatePicker
          minDate={minDate}
          maxDate={maxDate}
          className="w-full !bg-fill-primary !text-label-primary border border-border-primary rounded px-2 py-1.5 h-9 text-sm font-medium"
          value={session.startDateTime}
          onChange={onSetDate}
          showLoading={true}
          showWeekends={true}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={fieldLabel}>
          {tCoursePage('start_time')}
          <TimePicker
            variant="eduhub"
            compact
            className="!text-label-primary text-sm font-medium"
            currentValue={session.startDateTime}
            updateValueMutation={UPDATE_SESSION_START_TIME}
            identifierVariables={{ sessionId: session.id }}
            refetchQueries={['ManagedCourse']}
            saveAsDateTime={true}
            onValueUpdated={onTimeChanged}
          />
        </div>
        <div className={fieldLabel}>
          {tCoursePage('end_time')}
          <TimePicker
            variant="eduhub"
            compact
            className="!text-label-primary text-sm font-medium"
            currentValue={session.endDateTime}
            updateValueMutation={UPDATE_SESSION_END_TIME}
            identifierVariables={{ sessionId: session.id }}
            refetchQueries={['ManagedCourse']}
            saveAsDateTime={true}
            onValueUpdated={onTimeChanged}
          />
        </div>
      </div>
    </div>
  );
};

/** "Sa, 16.11.2024" in the app's time zone. */
export const useSessionDateLabel = () => {
  const locale = useLocale();
  const { timeZone } = useAppSettings();
  const displayDate = useDisplayDate();
  return (date: Date) => {
    const weekday = date.toLocaleDateString(locale, { weekday: 'short', timeZone }).replace(/\.$/, '');
    return `${weekday}, ${displayDate(date)}`;
  };
};

interface SessionDateTimeCellProps extends Omit<SessionTimeEditorProps, 'onSetDate'> {
  onSetDate?: (event: Date | null) => void;
  /** Program sessions are shown, but managed on the program. */
  readOnly?: boolean;
}

/**
 * Date and time as two compact lines. Clicking opens the editor in a popover, which keeps the
 * row scannable instead of showing three input fields per session.
 */
export const SessionDateTimeCell: FC<SessionDateTimeCellProps> = ({ readOnly = false, onSetDate, ...editorProps }) => {
  const t = useTranslations('manageCourse.SessionsTab');
  const dateLabel = useSessionDateLabel();
  const formatTimeString = useFormatTimeString();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { session } = editorProps;

  const summary = (
    <span className="flex flex-col items-start min-w-0">
      <span className={`font-semibold whitespace-nowrap ${readOnly ? 'text-label-secondary' : ''}`}>
        {dateLabel(session.startDateTime)}
      </span>
      <span className="text-xs text-label-secondary tabular-nums whitespace-nowrap">
        {formatTimeString(session.startDateTime)} – {formatTimeString(session.endDateTime)}
      </span>
    </span>
  );

  if (readOnly || !onSetDate) {
    return <div className="px-2">{summary}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="dialog"
        aria-label={t('edit_date_time')}
        className="group flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-bg-secondary focus-visible:bg-bg-secondary"
      >
        {summary}
        <MdEdit className="flex-shrink-0 text-label-disabled opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
      </button>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <div className="light bg-fill-primary text-label-primary p-4 w-80">
          <SessionTimeEditor {...editorProps} onSetDate={onSetDate} />
        </div>
      </Popover>
    </>
  );
};

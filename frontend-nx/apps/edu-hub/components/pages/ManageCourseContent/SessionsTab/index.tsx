import { QueryResult } from '@apollo/client';
import { ProgramType } from '../../../../types/enums';
import { nextSessionTimes } from './sessionDefaults';
import { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  identityEventMapper,
  useRoleMutation,
  useDeleteCallback,
} from '../../../../hooks/authedMutation';
import {
  DELETE_SESSION,
  DELETE_SESSION_SPEAKER,
  INSERT_NEW_SESSION_SPEAKER,
  INSERT_SESSION_ADDRESS,
  INSERT_SESSION_WITH_ADDRESSES,
  UPDATE_SESSION_DESCRIPTION,
  UPDATE_SESSION_END_TIME,
  UPDATE_SESSION_IS_MANDATORY,
  UPDATE_SESSION_START_TIME,
  UPDATE_SESSION_TITLE,
} from '../../../../queries/course';
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseLocations,
  ManagedCourse_Course_by_pk_Program_Sessions,
  ManagedCourse_Course_by_pk_Sessions,
} from '../../../../queries/__generated__/ManagedCourse';
import {
  InsertSessionWithAddresses,
  InsertSessionWithAddressesVariables,
} from '../../../../queries/__generated__/InsertSessionWithAddresses';
import {
  InsertSessionAddress,
  InsertSessionAddressVariables,
} from '../../../../queries/__generated__/InsertSessionAddress';
import {
  DeleteSessionSpeaker,
  DeleteSessionSpeakerVariables,
} from '../../../../queries/__generated__/DeleteSessionSpeaker';
import {
  InsertNewSessionSpeaker,
  InsertNewSessionSpeakerVariables,
} from '../../../../queries/__generated__/InsertNewSessionSpeaker';
import {
  UserSelectionWithFilter,
  UserSelectionWithFilterVariables,
  UserSelectionWithFilter_User,
} from '../../../../queries/__generated__/UserSelectionWithFilter';
import { useTranslations } from 'next-intl';
import { order_by, SessionAddress_insert_input } from '../../../../__generated__/globalTypes';
import { useLazyRoleQuery } from '../../../../hooks/authedQuery';
import { useCurrentRole, useIsAdmin } from '../../../../hooks/authentication';
import { useManagementRoleContext } from '../../../../hooks/managementRole';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';
import { USER_SELECTION_WITH_FILTER, buildUserSelectionFilter } from '../../../../queries/user';

import TableGrid from '../../../common/TableGrid';
import { formatTruncatedList, makeFullName } from '../../../../helpers/util';
import InputField from '../../../inputs/InputField';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import { Tooltip } from '@mui/material';
import { MdLock, MdVisibility } from 'react-icons/md';
import { isProgramSession, mergeSessions } from '../../../../helpers/programSessions';
import { isMandatorySession } from '../../../../helpers/courseParticipationAttendance';
import SessionAddresses from './SessionAddresses';
import { LocationIcon, SessionLocationChips, SessionLocationEntry, sessionLocationEntries } from './SessionLocations';
import { SessionDateTimeCell, SessionTimeEditor, useSessionDateLabel } from './SessionTimeEditor';
import ManagedItemList from '../../../common/ManagedItemList';
import { SelectUserDialog } from '../../../common/dialogs/SelectUserDialog';
import { CreateUserDialog } from '../../../common/dialogs/CreateUserDialog';
import AttendanceDataDialog from './AttendanceDataDialog';
import useNotifyParticipantsPrompt from './useNotifyParticipantsPrompt';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import { useFormatTimeString } from '../../../../helpers/dateTimeHelpers';

/** Course sessions are editable; program sessions are shown read-only. */
type SessionRow = ManagedCourse_Course_by_pk_Sessions | ManagedCourse_Course_by_pk_Program_Sessions;

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<ManagedCourse, ManagedCourseVariables>;
}

const copyDateTime = (target: Date, source: Date) => {
  const result = new Date(target);
  result.setHours(source.getHours());
  result.setMinutes(source.getMinutes());
  result.setSeconds(source.getSeconds());
  result.setMilliseconds(source.getMilliseconds());
  return result;
};

const parseSearchValue = (searchValue: string) => {
  const trimmed = searchValue.trim();
  const parts = trimmed.split(' ');
  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(' '), email: '' };
  }
  if (trimmed.includes('@')) {
    return { firstName: '', lastName: '', email: trimmed };
  }
  return { firstName: trimmed, lastName: '', email: '' };
};

/** Small uppercase label above a session title (KURSÜBERGREIFEND). */
const Eyebrow: FC<{ children: ReactNode; icon?: ReactNode }> = ({ children, icon }) => (
  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-label-secondary whitespace-nowrap">
    {icon}
    {children}
  </span>
);

/** Section heading inside the expanded row. */
const SectionLabel: FC<{ children: ReactNode }> = ({ children }) => (
  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-label-secondary">{children}</h4>
);

export const SessionsTab: FC<IProps> = ({ course, qResult }) => {
  const t = useTranslations('manageCourse');
  const tCoursePage = useTranslations('coursePage');
  const isAdmin = useIsAdmin();
  const dateLabel = useSessionDateLabel();
  const formatTimeString = useFormatTimeString();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const isEventCourse = course.Program?.type === ProgramType.EVENTS;

  const [searchFilter, setSearchFilter] = useState('');

  // Counts CONFIRMED + REGISTERED enrollees, i.e. exactly the people the
  // reschedule mail would reach. Already selected via AdminCourseFragment.
  const participantCount = Number(course.publicParticipantCount ?? 0);
  const {
    registerChange,
    promptOpen,
    pendingCount,
    sending,
    confirm: confirmNotification,
    cancel: cancelNotification,
    errorMessage: notificationError,
    clearError: clearNotificationError,
    savedMessage: notificationSaved,
    clearSaved: clearNotificationSaved,
  } = useNotifyParticipantsPrompt(participantCount);

  const courseSessions = useMemo(() => {
    const result = [...course.Sessions];
    result.sort((a, b) => {
      const aValue = a.startDateTime.getTime();
      const bValue = b.startDateTime.getTime();
      return aValue - bValue;
    });
    return result;
  }, [course]);

  const courseLocationIds = useMemo(() => {
    return course.CourseLocations.map((location) => location.id);
  }, [course.CourseLocations]);

  const sessionAddresses: SessionAddress_insert_input[] = useMemo(
    () => courseLocationIds.map((courseLocationId) => ({ courseLocationId })),
    [courseLocationIds]
  );

  // Program-wide sessions are listed alongside for context, but are managed on
  // the program; course-only logic (defaults, delete guard) ignores them.
  const tableSessions = useMemo<SessionRow[]>(
    () => mergeSessions<SessionRow>(courseSessions, course.Program?.Sessions),
    [courseSessions, course.Program?.Sessions]
  );

  const filteredSessions = useMemo(() => {
    if (!searchFilter.trim()) return tableSessions;
    const searchLower = searchFilter.toLowerCase();
    return tableSessions.filter((session) => {
      const titleMatch = session.title?.toLowerCase().includes(searchLower);
      const speakerMatch = (session.SessionSpeakers || []).some(
        (s) =>
          s.User.firstName?.toLowerCase().includes(searchLower) ||
          s.User.lastName?.toLowerCase().includes(searchLower)
      );
      return titleMatch || speakerMatch;
    });
  }, [tableSessions, searchFilter]);

  const [insertSessionMutation] = useRoleMutation<InsertSessionWithAddresses, InsertSessionWithAddressesVariables>(
    INSERT_SESSION_WITH_ADDRESSES
  );

  const insertSession = useCallback(async () => {
    const { startTime, endTime } = nextSessionTimes(
      course,
      courseSessions[courseSessions.length - 1],
      isEventCourse
    );

    await insertSessionMutation({
      variables: {
        courseId: course.id,
        startTime,
        endTime,
        sessionAddresses,
      },
    });
    qResult.refetch();
  }, [sessionAddresses, courseSessions, insertSessionMutation, course, isEventCourse, qResult]);

  const [updateSessionStartTime] = useRoleMutation(UPDATE_SESSION_START_TIME);
  const [updateSessionEndTime] = useRoleMutation(UPDATE_SESSION_END_TIME);

  const handleSetDate = useCallback(
    async (session: SessionRow, event: Date | null) => {
      if (event) {
        const newStartDate = copyDateTime(event, session.startDateTime);
        const newEndDate = copyDateTime(event, session.endDateTime);
        // The two writes are not one transaction. Once the start time lands the
        // session's timing has changed, so the prompt is owed even if the end
        // time or the refetch then fails.
        let timingChanged = false;
        try {
          await updateSessionStartTime({
            variables: { sessionId: session.id, value: newStartDate.toISOString() },
          });
          timingChanged = true;
          await updateSessionEndTime({
            variables: { sessionId: session.id, value: newEndDate.toISOString() },
          });
          await qResult.refetch();
        } finally {
          // Both writes are one edit to the user, so this only queues one prompt.
          if (timingChanged) registerChange(session.id);
        }
      }
    },
    [updateSessionStartTime, updateSessionEndTime, qResult, registerChange]
  );

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
  }, []);

  const handleSearchFilterChange = useCallback((value: string) => {
    setSearchFilter(value);
    setPageIndex(0);
  }, []);

  // The lecture window is a semester concept. An event may sit anywhere in the
  // year, so its date picker is not restricted to the program's window.
  const lectureStart = isEventCourse ? undefined : course.Program?.lectureStart ?? undefined;
  const lectureEnd = isEventCourse ? undefined : course.Program?.lectureEnd ?? undefined;

  // Show delete button only when user is admin or course is not in the past (instructor guard)
  const canDeleteSessions = useMemo(() => {
    if (isAdmin) return true;
    const lastSession = courseSessions[courseSessions.length - 1];
    return !lastSession || lastSession.endDateTime >= new Date();
  }, [isAdmin, courseSessions]);

  const programSessionTooltip = t('SessionsTab.program_session_locked');

  // Mandatory only matters for passing, so the column is shown only when a
  // certificate can be earned. At least one course session must stay
  // mandatory: the last mandatory one cannot be unticked (which also locks the
  // only session of a single-session offering). Program sessions do not count
  // here, since the program admin can change or remove them at any time.
  const showMandatoryColumn = Boolean(course.attendanceCertificatePossible || course.achievementCertificatePossible);
  const mandatoryCount = useMemo(() => courseSessions.filter(isMandatorySession).length, [courseSessions]);

  // Location chips show their label only where there is room for it.
  const belowXl = useMediaQuery('(max-width: 1279px)');

  const locationsOf = useCallback(
    (session: SessionRow) => sessionLocationEntries(session, course.CourseLocations),
    [course.CourseLocations]
  );

  const eyebrowOf = useCallback(
    (session: SessionRow) => {
      // Optional sessions need no label: the Pflicht switch in the same row already says so.
      if (isProgramSession(session)) {
        return <Eyebrow icon={<MdLock aria-hidden />}>{tCoursePage('program_session')}</Eyebrow>;
      }
      return null;
    },
    [tCoursePage]
  );

  const mandatoryControl = useCallback(
    (session: SessionRow, label?: string) => {
      if (isProgramSession(session)) {
        return (
          <span className="text-xs text-label-secondary">
            {isMandatorySession(session) ? tCoursePage('mandatory') : t('SessionsTab.optional')}
          </span>
        );
      }
      const isLastMandatory = isMandatorySession(session) && mandatoryCount <= 1;
      return (
        <Tooltip title={isLastMandatory ? tCoursePage('mandatory_last_session') : ''}>
          <span>
            <CheckboxSelector
              variant="switch"
              label={label}
              ariaLabel={tCoursePage('mandatory')}
              checked={session.isMandatory}
              disabled={isLastMandatory}
              updateValueMutation={UPDATE_SESSION_IS_MANDATORY}
              identifierVariables={{ sessionId: session.id }}
              refetchQueries={['ManagedCourse']}
            />
          </span>
        </Tooltip>
      );
    },
    [mandatoryCount, t, tCoursePage]
  );

  // TableGrid renders each cell function as a component, so a new function identity remounts the
  // cell. Every save refetches the course, which used to rebuild these columns: the title input
  // lost focus mid-typing and the "saved" snackbar vanished with the unmounted cell. The columns
  // therefore only depend on layout inputs and read everything else through this ref.
  const cellContext = useRef({
    handleSetDate,
    registerChange,
    lectureStart,
    lectureEnd,
    locationsOf,
    eyebrowOf,
    mandatoryControl,
  });
  cellContext.current = {
    handleSetDate,
    registerChange,
    lectureStart,
    lectureEnd,
    locationsOf,
    eyebrowOf,
    mandatoryControl,
  };

  const columns = useMemo<ColumnDef<SessionRow>[]>(() => {
    const allColumns: ColumnDef<SessionRow>[] = [
      {
        id: 'date',
        header: t('SessionsTab.date_time'),
        accessorKey: 'startDateTime',
        size: 160,
        enableSorting: true,
        cell: ({ row }) => (
          <SessionDateTimeCell
            session={row.original}
            readOnly={isProgramSession(row.original)}
            onSetDate={(event) => cellContext.current.handleSetDate(row.original, event)}
            onTimeChanged={() => cellContext.current.registerChange(row.original.id)}
            minDate={cellContext.current.lectureStart}
            maxDate={cellContext.current.lectureEnd}
          />
        ),
      },
      {
        header: tCoursePage('title'),
        accessorKey: 'title',
        size: 240,
        enableSorting: true,
        cell: ({ row }) => {
          const eyebrow = cellContext.current.eyebrowOf(row.original);
          // Below lg the location column is gone, so its icons move under the title.
          const inlineLocations = (
            <div className="lg:hidden">
              <SessionLocationChips entries={cellContext.current.locationsOf(row.original)} iconsOnly />
            </div>
          );
          return isProgramSession(row.original) ? (
            <Tooltip title={programSessionTooltip}>
              <div className="w-full min-w-0 flex flex-col gap-0.5 px-2">
                {eyebrow}
                <span className="truncate text-label-secondary">{row.original.title || tCoursePage('session_title')}</span>
                {inlineLocations}
              </div>
            </Tooltip>
          ) : (
            <div className="w-full min-w-0 flex flex-col gap-0.5">
              {eyebrow && <div className="px-2">{eyebrow}</div>}
              <InputField
                variant="material"
                type="input"
                compact
                placeholder={tCoursePage('session_title')}
                itemId={row.original.id}
                value={row.original.title || ''}
                updateValueMutation={UPDATE_SESSION_TITLE}
                refetchQueries={['ManagedCourse']}
                fullWidth
              />
              <div className="px-2">{inlineLocations}</div>
            </div>
          );
        },
      },
      {
        id: 'location',
        header: t('SessionsTab.location'),
        size: belowXl ? 90 : 160,
        enableSorting: false,
        meta: { hideBelow: 'lg' },
        cell: ({ row }) => <SessionLocationChips entries={cellContext.current.locationsOf(row.original)} iconsOnly={belowXl} />,
      },
      {
        id: 'speakers',
        header: tCoursePage('external_speakers'),
        accessorKey: 'SessionSpeakers',
        size: 170,
        enableSorting: false,
        meta: { hideBelow: 'xl' },
        cell: ({ row }) => (
          <span className="flex items-center text-label-secondary">
            {formatTruncatedList(
              row.original.SessionSpeakers,
              (s) => makeFullName(s.User.firstName, s.User.lastName ?? '')
            )}
          </span>
        ),
      },
      {
        id: 'isMandatory',
        header: () => (
          <Tooltip title={tCoursePage('mandatory_help')}>
            <span>{tCoursePage('mandatory')}</span>
          </Tooltip>
        ),
        accessorKey: 'isMandatory',
        size: 80,
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => <div className="w-full flex items-center justify-center">{cellContext.current.mandatoryControl(row.original)}</div>,
      },
    ];
    return showMandatoryColumn ? allColumns : allColumns.filter((column) => column.id !== 'isMandatory');
  }, [t, tCoursePage, programSessionTooltip, showMandatoryColumn, belowXl]);

  // Phones get one card per session instead of the table.
  const renderMobileRow = useCallback(
    (session: SessionRow) => (
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-semibold text-label-secondary tabular-nums">
          {dateLabel(session.startDateTime)} · {formatTimeString(session.startDateTime)} –{' '}
          {formatTimeString(session.endDateTime)}
        </span>
        {eyebrowOf(session)}
        <span className={`font-semibold ${isProgramSession(session) ? 'text-label-secondary' : ''}`}>
          {session.title || tCoursePage('session_title')}
        </span>
        <div className="flex items-center justify-between gap-2">
          <SessionLocationChips entries={locationsOf(session)} />
          {showMandatoryColumn && mandatoryControl(session, tCoursePage('mandatory'))}
        </div>
      </div>
    ),
    [dateLabel, formatTimeString, eyebrowOf, tCoursePage, locationsOf, showMandatoryColumn, mandatoryControl]
  );

  return (
    <div>
      <TableGrid<SessionRow>
        data={filteredSessions}
        columns={columns}
        compactRows
        loading={false}
        error={null}
        expandableRowComponent={(props) =>
          isProgramSession(props.row) ? null : (
            <ExpandableSessionRowContent
              session={props.row as ManagedCourse_Course_by_pk_Sessions}
              courseLocations={course.CourseLocations}
              qResult={qResult}
              onSetDate={(event) => handleSetDate(props.row, event)}
              onTimeChanged={() => registerChange(props.row.id)}
              minDate={lectureStart}
              maxDate={lectureEnd}
            />
          )
        }
        canExpandRow={(row) => !isProgramSession(row)}
        showDeleteForRow={(row) => !isProgramSession(row)}
        renderMobileRow={renderMobileRow}
        deleteMutation={canDeleteSessions ? DELETE_SESSION : undefined}
        deleteIdType="number"
        generateDeletionConfirmationQuestion={(row) =>
          tCoursePage('confirmDeleteSession') +
          (row.title ? ` (${row.title})` : '')
        }
        enablePagination={true}
        totalCount={filteredSessions.length}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        searchFilter={searchFilter}
        onSearchFilterChange={handleSearchFilterChange}
        refetchQueries={['ManagedCourse']}
        onAddButtonClick={insertSession}
        addButtonText={t('add_session')}
        showGlobalSearchField={true}
      />

      <QuestionConfirmationDialog
        open={promptOpen}
        title={t('SessionsTab.notify_participants.title')}
        question={t('SessionsTab.notify_participants.question', {
          participants: participantCount,
          sessions: pendingCount,
        })}
        confirmationText={t('SessionsTab.notify_participants.confirm')}
        cancelText={t('SessionsTab.notify_participants.cancel')}
        confirmDisabled={sending}
        onClose={cancelNotification}
        onConfirm={confirmNotification}
      />

      {notificationError && (
        <ErrorMessageDialog
          errorMessage={notificationError}
          open={!!notificationError}
          onClose={clearNotificationError}
        />
      )}

      <NotificationSnackbar
        open={!!notificationSaved}
        onClose={clearNotificationSaved}
        message={notificationSaved ?? ''}
      />
    </div>
  );
};

/**
 * A course location the session has no address row for. The row is normally created with the
 * session (or with the location), so this only shows up for older or imported data - and without
 * it the address could not be set at all.
 */
const MissingSessionAddress: FC<{
  entry: SessionLocationEntry;
  sessionId: number;
  qResult: QueryResult<ManagedCourse, ManagedCourseVariables>;
}> = ({ entry, sessionId, qResult }) => {
  const t = useTranslations('manageCourse.SessionsTab');
  const tCommon = useTranslations('common');
  const [insertSessionAddress, { loading, error }] = useRoleMutation<InsertSessionAddress, InsertSessionAddressVariables>(
    INSERT_SESSION_ADDRESS
  );
  const [showError, setShowError] = useState(true);
  const [refreshError, setRefreshError] = useState('');

  const createAddress = async () => {
    if (entry.courseLocationId == null) return;
    setShowError(true);
    setRefreshError('');
    try {
      await insertSessionAddress({
        variables: { sessionId, address: '', courseLocationId: entry.courseLocationId },
      });
    } catch {
      // The mutation's error state drives the dialog below.
      return;
    }
    try {
      await qResult.refetch();
    } catch (refetchError) {
      setRefreshError(refetchError instanceof Error ? refetchError.message : String(refetchError));
    }
  };

  return (
    <>
      <span className="flex items-center gap-2 font-semibold text-label-primary">
        <LocationIcon option={entry.option} className="text-label-secondary" />
        {tCommon(`location.${entry.option}`)}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-amber-700">{t('no_address')}</span>
        <button
          type="button"
          onClick={createAddress}
          disabled={loading}
          className="inline-flex items-center rounded-full border-[1.5px] border-label-primary px-3 py-1 text-sm font-semibold text-label-primary hover:bg-bg-secondary disabled:opacity-50"
        >
          {t('create_address')}
        </button>
      </div>
      <ErrorMessageDialog
        errorMessage={error?.message || refreshError}
        open={(!!error || !!refreshError) && showError}
        onClose={() => {
          setShowError(false);
          setRefreshError('');
        }}
      />
    </>
  );
};

interface ExpandableSessionRowContentProps {
  session: ManagedCourse_Course_by_pk_Sessions;
  courseLocations: ManagedCourse_Course_by_pk_CourseLocations[];
  qResult: QueryResult<ManagedCourse, ManagedCourseVariables>;
  onSetDate: (event: Date | null) => void;
  onTimeChanged: () => void;
  minDate?: Date;
  maxDate?: Date;
}

const ExpandableSessionRowContent: FC<ExpandableSessionRowContentProps> = ({
  session,
  courseLocations,
  qResult,
  onSetDate,
  onTimeChanged,
  minDate,
  maxDate,
}) => {
  const t = useTranslations('manageCourse');
  const tCoursePage = useTranslations('coursePage');
  const managementRole = useManagementRoleContext();
  const currentRole = useCurrentRole();
  const queryRole = managementRole ?? currentRole;
  // On phones the row cells are not shown, so date, time and title are edited here.
  const isPhone = useMediaQuery('(max-width: 767px)');

  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [searchValueForNewUser, setSearchValueForNewUser] = useState('');
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  const hasAttendanceData =
    Boolean(session.attendanceData) && session.attendanceData !== 'true';

  const locations = useMemo(() => sessionLocationEntries(session, courseLocations), [session, courseLocations]);

  const [insertSessionSpeaker] = useRoleMutation<InsertNewSessionSpeaker, InsertNewSessionSpeakerVariables>(
    INSERT_NEW_SESSION_SPEAKER
  );
  const [fetchUserByEmail] = useLazyRoleQuery<UserSelectionWithFilter, UserSelectionWithFilterVariables>(
    USER_SELECTION_WITH_FILTER
  );

  const handleNewSpeaker = useCallback(
    async (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      if (confirmed && user != null) {
        await insertSessionSpeaker({
          variables: {
            userId: user.id,
            sessionId: session.id,
          },
        });
        qResult.refetch();
      }
    },
    [session.id, insertSessionSpeaker, qResult]
  );

  const handleAddNewUser = useCallback((searchValue: string) => {
    setSearchValueForNewUser(searchValue);
    setCreateUserDialogOpen(true);
  }, []);

  const deleteSessionSpeaker = useDeleteCallback<DeleteSessionSpeaker, DeleteSessionSpeakerVariables>(
    DELETE_SESSION_SPEAKER,
    'speakerId',
    identityEventMapper,
    qResult
  );

  const deleteSpeakerHandler = useCallback(
    async (speaker: (typeof session.SessionSpeakers)[0]) => {
      await deleteSessionSpeaker(speaker.id);
      qResult.refetch();
    },
    [deleteSessionSpeaker, qResult, session]
  );

  const handleUserCreated = useCallback(
    async (userId: string, _firstName: string, _lastName: string, email: string) => {
      setCreateUserDialogOpen(false);

      try {
        const { data } = await fetchUserByEmail({
          variables: {
            limit: 100,
            filter: buildUserSelectionFilter(
              {
                _or: [{ id: { _eq: userId } }, { email: { _ilike: `%${email}%` } }],
              },
              queryRole
            ),
            order_by: [{ lastName: order_by.asc }, { firstName: order_by.asc }],
          },
        });

        const newUser = data?.User?.find((u) => u.id === userId);
        if (newUser) {
          await handleNewSpeaker(true, newUser);
        }
      } catch (error) {
        console.error('Error fetching new user:', error);
      }
    },
    [fetchUserByEmail, handleNewSpeaker, queryRole]
  );

  const parsedSearchValues = parseSearchValue(searchValueForNewUser);

  return (
    <div className="w-full flex-1 min-w-0">
      {/* One column on phones, two on laptops (description below), three on wide screens. */}
      <div className="bg-bg-secondary/40 text-label-primary p-4 md:p-6 w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_18rem] gap-x-8 gap-y-6">
        {isPhone && (
          <section>
            <SectionLabel>{t('SessionsTab.schedule')}</SectionLabel>
            <div className="flex flex-col gap-3">
              <SessionTimeEditor
                session={session}
                onSetDate={onSetDate}
                onTimeChanged={onTimeChanged}
                minDate={minDate}
                maxDate={maxDate}
              />
              <InputField
                variant="material"
                type="input"
                compact
                placeholder={tCoursePage('session_title')}
                itemId={session.id}
                value={session.title || ''}
                updateValueMutation={UPDATE_SESSION_TITLE}
                refetchQueries={['ManagedCourse']}
                fullWidth
              />
            </div>
          </section>
        )}

        <section className="order-1 min-w-0">
          <SectionLabel>{t('SessionsTab.location')}</SectionLabel>
          <div className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-x-4 gap-y-3 items-center">
            {locations.map((entry) =>
              entry.address ? (
                <SessionAddresses key={entry.key} address={entry.address} refetchQueries={['ManagedCourse']} />
              ) : (
                <MissingSessionAddress key={entry.key} entry={entry} sessionId={session.id} qResult={qResult} />
              )
            )}
          </div>
        </section>

        <section className="order-3 lg:col-span-2 xl:col-span-1 xl:order-2 min-w-0">
          <SectionLabel>{t('SessionsTab.session_description.label')}</SectionLabel>
          <InputField
            variant="eduhub"
            type="textarea"
            value={session.description || ''}
            label=""
            updateValueMutation={UPDATE_SESSION_DESCRIPTION}
            refetchQueries={['ManagedCourse']}
            itemId={session.id}
            placeholder={t('SessionsTab.session_description.placeholder')}
            helpText=""
            className="h-32 border border-border-primary rounded-md"
            maxLength={500}
          />
        </section>

        <div className="order-2 xl:order-3 min-w-0 flex flex-col gap-5">
          <ManagedItemList
            title={tCoursePage('external_speakers')}
            items={session.SessionSpeakers}
            renderItem={(speaker) => ({
              label: makeFullName(speaker.User.firstName, speaker.User.lastName ?? ''),
              sublabel: speaker.User.email ?? undefined,
            })}
            getItemKey={(speaker) => speaker.id}
            onDelete={deleteSpeakerHandler}
            onAdd={handleNewSpeaker}
            addButtonLabel={tCoursePage('add_external_speaker')}
            removeAriaLabel={tCoursePage('remove_external_speaker')}
            SelectionDialog={SelectUserDialog}
            dialogTitle={tCoursePage('add_external_speaker')}
            checkDuplicate={(speaker, user) => speaker.User.id === user.id}
            additionalDialogProps={{
              onAddNewUser: handleAddNewUser,
              showAddNewUserOption: true,
            }}
          />

          <section className="border-t border-table-divider pt-4">
            <SectionLabel>{t('SessionsTab.attendance_data.label')}</SectionLabel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {!hasAttendanceData && (
                <output className="text-sm text-label-secondary">{t('SessionsTab.attendance_data.no_data')}</output>
              )}
              <button
                type="button"
                disabled={!hasAttendanceData}
                onClick={hasAttendanceData ? () => setAttendanceOpen(true) : undefined}
                // `onTouchStart` ensures the dialog opens on the initial tap on
                // touch devices that delay the synthetic `click` event.
                onTouchStart={hasAttendanceData ? () => setAttendanceOpen(true) : undefined}
                aria-label={t('SessionsTab.attendance_data.review_button')}
                // 44px minimum height meets WCAG 2.5.5 / iOS HIG touch-target guidance.
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-[1.5px] border-label-primary px-4 text-sm font-semibold text-label-primary hover:bg-bg-secondary disabled:border-border-primary disabled:text-label-disabled disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <MdVisibility aria-hidden />
                {t('SessionsTab.attendance_data.review_short')}
              </button>
            </div>
          </section>
        </div>
      </div>

      <AttendanceDataDialog
        open={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
        attendanceData={session.attendanceData}
        sessionTitle={session.title ?? undefined}
      />

      <CreateUserDialog
        open={createUserDialogOpen}
        onClose={() => {
          setCreateUserDialogOpen(false);
          setSearchValueForNewUser('');
        }}
        onSuccess={() => {
          /* Refetch handled in handleUserCreated */
        }}
        onUserCreated={handleUserCreated}
        initialFirstName={parsedSearchValues.firstName}
        initialLastName={parsedSearchValues.lastName}
        initialEmail={parsedSearchValues.email}
      />
    </div>
  );
};

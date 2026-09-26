import { QueryResult } from '@apollo/client';
import { ProgramType } from '../../../../types/enums';
import { nextSessionTimes } from './sessionDefaults';
import { FC, useCallback, useMemo, useState } from 'react';
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
  ManagedCourse_Course_by_pk_Program_Sessions,
  ManagedCourse_Course_by_pk_Sessions,
} from '../../../../queries/__generated__/ManagedCourse';
import {
  InsertSessionWithAddresses,
  InsertSessionWithAddressesVariables,
} from '../../../../queries/__generated__/InsertSessionWithAddresses';
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
import { LocationOption_enum, order_by, SessionAddress_insert_input } from '../../../../__generated__/globalTypes';
import { useLazyRoleQuery } from '../../../../hooks/authedQuery';
import { useCurrentRole, useIsAdmin } from '../../../../hooks/authentication';
import { useManagementRoleContext } from '../../../../hooks/managementRole';
import { USER_SELECTION_WITH_FILTER, buildUserSelectionFilter } from '../../../../queries/user';

import TableGrid from '../../../common/TableGrid';
import { formatTruncatedList, makeFullName } from '../../../../helpers/util';
import OptimisticDatePicker from '../../../inputs/OptimisticDatePicker';
import TimePicker from '../../../inputs/TimePicker';
import InputField from '../../../inputs/InputField';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import { Tooltip } from '@mui/material';
import { MdLock } from 'react-icons/md';
import { isProgramSession, mergeSessions } from '../../../../helpers/programSessions';
import { isMandatorySession } from '../../../../helpers/courseParticipationAttendance';
import { useDisplayDate, useFormatTimeString } from '../../../../helpers/dateTimeHelpers';
import SessionAddresses from './SessionAddresses';
import ManagedItemList from '../../../common/ManagedItemList';
import { Card } from '../../../common/Card';
import { SelectUserDialog } from '../../../common/dialogs/SelectUserDialog';
import { CreateUserDialog } from '../../../common/dialogs/CreateUserDialog';
import AttendanceDataDialog from './AttendanceDataDialog';
import useNotifyParticipantsPrompt from './useNotifyParticipantsPrompt';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';

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

export const SessionsTab: FC<IProps> = ({ course, qResult }) => {
  const t = useTranslations('manageCourse');
  const tCoursePage = useTranslations('coursePage');
  const isAdmin = useIsAdmin();
  const displayDate = useDisplayDate();
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
  // certificate can be earned. At least one session must stay mandatory: the
  // last mandatory course session cannot be unticked (which also locks the
  // only session of a single-session offering).
  const showMandatoryColumn = Boolean(course.attendanceCertificatePossible || course.achievementCertificatePossible);
  const mandatoryCount = useMemo(() => tableSessions.filter(isMandatorySession).length, [tableSessions]);

  const columns = useMemo<ColumnDef<SessionRow>[]>(() => {
    const allColumns: ColumnDef<SessionRow>[] = [
      {
        id: 'date',
        header: tCoursePage('date'),
        accessorKey: 'startDateTime',
        size: 130,
        enableSorting: true,
        cell: ({ row }) =>
          isProgramSession(row.original) ? (
            <span className="px-2">{displayDate(row.original.startDateTime)}</span>
          ) : (
          <div className="w-full light flex items-center">
            <OptimisticDatePicker
              minDate={lectureStart}
              maxDate={lectureEnd}
              className="w-full !bg-fill-primary !text-label-primary border border-border-primary rounded px-2 py-1.5 h-9"
              value={row.original.startDateTime}
              onChange={(event) => handleSetDate(row.original, event)}
              showLoading={true}
              showWeekends={true}
            />
          </div>
          ),
      },
      {
        id: 'startTime',
        header: tCoursePage('start_time'),
        accessorKey: 'startDateTime',
        size: 100,
        enableSorting: false,
        cell: ({ row }) =>
          isProgramSession(row.original) ? (
            <span className="px-2 tabular-nums">{formatTimeString(row.original.startDateTime)}</span>
          ) : (
          <TimePicker
            variant="eduhub"
            compact
            className="!text-label-primary"
            currentValue={row.original.startDateTime}
            updateValueMutation={UPDATE_SESSION_START_TIME}
            identifierVariables={{ sessionId: row.original.id }}
            refetchQueries={['ManagedCourse']}
            saveAsDateTime={true}
            onValueUpdated={() => registerChange(row.original.id)}
          />
          ),
      },
      {
        header: tCoursePage('end_time'),
        accessorKey: 'endDateTime',
        size: 100,
        enableSorting: false,
        cell: ({ row }) =>
          isProgramSession(row.original) ? (
            <span className="px-2 tabular-nums">{formatTimeString(row.original.endDateTime)}</span>
          ) : (
          <TimePicker
            variant="eduhub"
            compact
            className="!text-label-primary"
            currentValue={row.original.endDateTime}
            updateValueMutation={UPDATE_SESSION_END_TIME}
            identifierVariables={{ sessionId: row.original.id }}
            refetchQueries={['ManagedCourse']}
            saveAsDateTime={true}
            onValueUpdated={() => registerChange(row.original.id)}
          />
          ),
      },
      {
        header: tCoursePage('title'),
        accessorKey: 'title',
        size: 300,
        enableSorting: true,
        cell: ({ row }) =>
          isProgramSession(row.original) ? (
            <Tooltip title={programSessionTooltip}>
              <div className="w-full min-w-0 flex items-center gap-2 px-2">
                <MdLock className="flex-shrink-0 text-label-secondary" aria-label={programSessionTooltip} />
                <span className="truncate">{row.original.title || tCoursePage('session_title')}</span>
                <span className="flex-shrink-0 rounded-full border border-brand px-2 py-0.5 text-xs text-brand whitespace-nowrap">
                  ◆ {tCoursePage('program_session')}
                </span>
              </div>
            </Tooltip>
          ) : (
          <div className="w-full min-w-0 flex items-center">
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
          </div>
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
        size: 90,
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => {
          const isProgram = isProgramSession(row.original);
          const isLastMandatory = !isProgram && isMandatorySession(row.original) && mandatoryCount <= 1;
          return (
            <Tooltip title={isLastMandatory ? tCoursePage('mandatory_last_session') : ''}>
              <div className="w-full flex items-center justify-center">
                <CheckboxSelector
                  variant="eduhub"
                  className="[&_input]:mr-0"
                  checked={row.original.isMandatory}
                  disabled={isProgram || isLastMandatory}
                  updateValueMutation={isProgram ? undefined : UPDATE_SESSION_IS_MANDATORY}
                  identifierVariables={{ sessionId: row.original.id }}
                  refetchQueries={['ManagedCourse']}
                />
              </div>
            </Tooltip>
          );
        },
      },
      {
        header: tCoursePage('external_speakers'),
        accessorKey: 'SessionSpeakers',
        size: 250,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex items-center">
            {formatTruncatedList(
              row.original.SessionSpeakers,
              (s) => makeFullName(s.User.firstName, s.User.lastName ?? '')
            )}
          </span>
        ),
      },
    ];
    return showMandatoryColumn ? allColumns : allColumns.filter((column) => column.id !== 'isMandatory');
  }, [
    tCoursePage,
    lectureStart,
    lectureEnd,
    handleSetDate,
    registerChange,
    displayDate,
    formatTimeString,
    programSessionTooltip,
    showMandatoryColumn,
    mandatoryCount,
  ]);

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
            <ExpandableSessionRowContent session={props.row as ManagedCourse_Course_by_pk_Sessions} qResult={qResult} />
          )
        }
        canExpandRow={(row) => !isProgramSession(row)}
        showDeleteForRow={(row) => !isProgramSession(row)}
        rowClassName={(row) => (isProgramSession(row) ? 'opacity-70' : '')}
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

interface ExpandableSessionRowContentProps {
  session: ManagedCourse_Course_by_pk_Sessions;
  qResult: QueryResult<ManagedCourse, ManagedCourseVariables>;
}

const ExpandableSessionRowContent: FC<ExpandableSessionRowContentProps> = ({ session, qResult }) => {
  const t = useTranslations('manageCourse');
  const tCoursePage = useTranslations('coursePage');
  const tCommon = useTranslations('common');
  const managementRole = useManagementRoleContext();
  const currentRole = useCurrentRole();
  const queryRole = managementRole ?? currentRole;

  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [searchValueForNewUser, setSearchValueForNewUser] = useState('');
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  const hasAttendanceData =
    Boolean(session.attendanceData) && session.attendanceData !== 'true';

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
      <div className="bg-fill-primary text-label-primary light p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-4 w-full min-w-0">
            <Card title={tCommon('addresses')}>
              <div className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-x-4 gap-y-2 items-center">
                {[...(session.SessionAddresses || [])]
                  .sort((a, b) => {
                    const locationOptions = Object.values(LocationOption_enum);
                    return (
                      locationOptions.indexOf(a.CourseLocation?.locationOption ?? LocationOption_enum.ONLINE) -
                      locationOptions.indexOf(b.CourseLocation?.locationOption ?? LocationOption_enum.ONLINE)
                    );
                  })
                  .map((address) => (
                    <SessionAddresses key={address.id} address={address} refetchQueries={['ManagedCourse']} />
                  ))}
              </div>
            </Card>

            <Card
              title={t('SessionsTab.session_description.label')}
              helpText={t('SessionsTab.session_description.help_text')}
            >
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
                className="h-64 border-2 border-border-primary"
                maxLength={500}
              />
            </Card>
          </div>

          <div className="space-y-4 w-full min-w-0">
            <ManagedItemList
              title={tCoursePage('external_speakers')}
              items={session.SessionSpeakers}
              renderItem={(speaker) => ({
                label: makeFullName(speaker.User.firstName, speaker.User.lastName ?? ''),
                sublabel: speaker.User.email ? `(${speaker.User.email})` : undefined,
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

            <Card title={t('SessionsTab.attendance_data.label')}>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!hasAttendanceData}
                  onClick={hasAttendanceData ? () => setAttendanceOpen(true) : undefined}
                  // `onTouchStart` ensures the dialog opens on the initial tap on
                  // touch devices that delay the synthetic `click` event.
                  onTouchStart={hasAttendanceData ? () => setAttendanceOpen(true) : undefined}
                  aria-label={t('SessionsTab.attendance_data.review_button')}
                  // 44px minimum height meets WCAG 2.5.5 / iOS HIG touch-target guidance.
                  className="self-start inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded bg-brand hover:bg-brand-dark text-fill-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand"
                >
                  {t('SessionsTab.attendance_data.review_button')}
                </button>
                {!hasAttendanceData && (
                  <output className="text-sm text-label-secondary">
                    {t('SessionsTab.attendance_data.no_data')}
                  </output>
                )}
              </div>
            </Card>
          </div>
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

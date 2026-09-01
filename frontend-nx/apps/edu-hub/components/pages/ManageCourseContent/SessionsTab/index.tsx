import { QueryResult } from '@apollo/client';
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
  UPDATE_SESSION_START_TIME,
  UPDATE_SESSION_TITLE,
  UPDATE_SESSION_IS_PUBLIC_EVENT,
} from '../../../../queries/course';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk,
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
import SessionAddresses from './SessionAddresses';
import ManagedItemList from '../../../common/ManagedItemList';
import { Card } from '../../../common/Card';
import { SelectUserDialog } from '../../../common/dialogs/SelectUserDialog';
import { CreateUserDialog } from '../../../common/dialogs/CreateUserDialog';
import AttendanceDataDialog from './AttendanceDataDialog';

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

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [searchFilter, setSearchFilter] = useState('');

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

  const filteredSessions = useMemo(() => {
    if (!searchFilter.trim()) return courseSessions;
    const searchLower = searchFilter.toLowerCase();
    return courseSessions.filter((session) => {
      const titleMatch = session.title?.toLowerCase().includes(searchLower);
      const speakerMatch = (session.SessionSpeakers || []).some(
        (s) =>
          s.User.firstName?.toLowerCase().includes(searchLower) ||
          s.User.lastName?.toLowerCase().includes(searchLower)
      );
      return titleMatch || speakerMatch;
    });
  }, [courseSessions, searchFilter]);

  const [insertSessionMutation] = useRoleMutation<InsertSessionWithAddresses, InsertSessionWithAddressesVariables>(
    INSERT_SESSION_WITH_ADDRESSES
  );

  const insertSession = useCallback(async () => {
    let startTime: Date;
    let endTime: Date;

    if (courseSessions.length > 0) {
      const lastSession = courseSessions[courseSessions.length - 1];
      startTime = new Date(lastSession.startDateTime);
      endTime = new Date(lastSession.endDateTime);
      startTime.setDate(startTime.getDate() + 7);
      endTime.setDate(endTime.getDate() + 7);
    } else {
      const today = new Date();
      startTime = new Date(today);
      endTime = new Date(today);
      if (course.startTime) {
        const [startHours, startMinutes] = course.startTime.split(':').map(Number);
        startTime.setHours(startHours, startMinutes, 0, 0);
      } else {
        startTime.setHours(0, 0, 0, 0);
      }
      if (course.endTime) {
        const [endHours, endMinutes] = course.endTime.split(':').map(Number);
        endTime.setHours(endHours, endMinutes, 0, 0);
      } else {
        endTime.setHours(0, 0, 0, 0);
      }
    }

    await insertSessionMutation({
      variables: {
        courseId: course.id,
        startTime,
        endTime,
        sessionAddresses,
      },
    });
    qResult.refetch();
  }, [sessionAddresses, courseSessions, insertSessionMutation, course.id, course.startTime, course.endTime, qResult]);

  const [updateSessionStartTime] = useRoleMutation(UPDATE_SESSION_START_TIME);
  const [updateSessionEndTime] = useRoleMutation(UPDATE_SESSION_END_TIME);

  const handleSetDate = useCallback(
    async (session: ManagedCourse_Course_by_pk_Sessions, event: Date | null) => {
      if (event) {
        const newStartDate = copyDateTime(event, session.startDateTime);
        const newEndDate = copyDateTime(event, session.endDateTime);
        await updateSessionStartTime({
          variables: { sessionId: session.id, value: newStartDate.toISOString() },
        });
        await updateSessionEndTime({
          variables: { sessionId: session.id, value: newEndDate.toISOString() },
        });
        await qResult.refetch();
      }
    },
    [updateSessionStartTime, updateSessionEndTime, qResult]
  );

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
  }, []);

  const handleSearchFilterChange = useCallback((value: string) => {
    setSearchFilter(value);
    setPageIndex(0);
  }, []);

  const lectureStart = course.Program?.lectureStart;
  const lectureEnd = course.Program?.lectureEnd;

  // Show delete button only when user is admin or course is not in the past (instructor guard)
  const canDeleteSessions = useMemo(() => {
    if (isAdmin) return true;
    const lastSession = courseSessions[courseSessions.length - 1];
    return !lastSession || lastSession.endDateTime >= new Date();
  }, [isAdmin, courseSessions]);

  const columns = useMemo<ColumnDef<ManagedCourse_Course_by_pk_Sessions>[]>(
    () => [
      {
        id: 'date',
        header: tCoursePage('date'),
        accessorKey: 'startDateTime',
        size: 130,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="w-full light flex items-center">
            <OptimisticDatePicker
              minDate={lectureStart ?? undefined}
              maxDate={lectureEnd ?? undefined}
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
        cell: ({ row }) => (
          <TimePicker
            variant="eduhub"
            compact
            className="!text-label-primary"
            currentValue={row.original.startDateTime}
            updateValueMutation={UPDATE_SESSION_START_TIME}
            identifierVariables={{ sessionId: row.original.id }}
            refetchQueries={['ManagedCourse']}
            saveAsDateTime={true}
          />
        ),
      },
      {
        header: tCoursePage('end_time'),
        accessorKey: 'endDateTime',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <TimePicker
            variant="eduhub"
            compact
            className="!text-label-primary"
            currentValue={row.original.endDateTime}
            updateValueMutation={UPDATE_SESSION_END_TIME}
            identifierVariables={{ sessionId: row.original.id }}
            refetchQueries={['ManagedCourse']}
            saveAsDateTime={true}
          />
        ),
      },
      {
        header: tCoursePage('title'),
        accessorKey: 'title',
        size: 380,
        enableSorting: true,
        cell: ({ row }) => (
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
      {
        id: 'publicEvent',
        header: t('SessionsTab.public_event.label'),
        accessorKey: 'isPublicEvent',
        size: 160,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="light flex items-center min-w-[140px]">
            <CheckboxSelector
              variant="eduhub"
              label=""
              checked={Boolean(row.original.isPublicEvent)}
              updateValueMutation={isAdmin ? UPDATE_SESSION_IS_PUBLIC_EVENT : undefined}
              identifierVariables={{ sessionId: row.original.id }}
              refetchQueries={['ManagedCourse']}
              disabled={!isAdmin}
            />
          </div>
        ),
      },
    ],
    [t, tCoursePage, lectureStart, lectureEnd, handleSetDate, isAdmin]
  );

  return (
    <div>
      <TableGrid<ManagedCourse_Course_by_pk_Sessions>
        data={filteredSessions}
        columns={columns}
        compactRows
        loading={false}
        error={null}
        expandableRowComponent={(props) => (
          <ExpandableSessionRowContent session={props.row} qResult={qResult} />
        )}
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

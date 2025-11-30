import { FC, useCallback, useState } from 'react';
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk_Sessions,
} from '../../../../queries/__generated__/ManagedCourse';
import OptimisticDatePicker from '../../../../components/inputs/OptimisticDatePicker';
import { DebounceInput } from 'react-debounce-input';
import { eventTargetValueMapper, useRoleMutation } from '../../../../hooks/authedMutation';

import {
  INSERT_NEW_SESSION_SPEAKER,
  UPDATE_SESSION_END_TIME,
  UPDATE_SESSION_START_TIME,
} from '../../../../queries/course';
import { QueryResult } from '@apollo/client';
import { SelectUserDialog } from '../../../common/dialogs/SelectUserDialog';
import { CreateUserDialog } from '../../../common/dialogs/CreateUserDialog';
import { UserForSelection1_User } from '../../../../queries/__generated__/UserForSelection1';
import { InsertExpert, InsertExpertVariables } from '../../../../queries/__generated__/InsertExpert';
import { INSERT_EXPERT, USER_SELECTION_ONE_PARAM } from '../../../../queries/user';
import {
  InsertNewSessionSpeaker,
  InsertNewSessionSpeakerVariables,
} from '../../../../queries/__generated__/InsertNewSessionSpeaker';
import {
  UserForSelection1,
  UserForSelection1Variables,
} from '../../../../queries/__generated__/UserForSelection1';
import EhMultipleTag from '../../../common/EhMultipleTag';
import useTranslation from 'next-translate/useTranslation';
import DeleteButton from '../../../../components/common/DeleteButton';
import SessionAddresses from './SessionAddresses';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { useIsAdmin, useIsInstructor } from '../../../../hooks/authentication';
import { useLazyRoleQuery } from '../../../../hooks/authedQuery';
import TimePicker from '../../../../components/inputs/TimePicker';

const copyDateTime = (target: Date, source: Date) => {
  target = new Date(target);
  target.setHours(source.getHours());
  target.setMinutes(source.getMinutes());
  target.setSeconds(source.getSeconds());
  target.setMilliseconds(source.getMilliseconds());
  return target;
};

interface IProps {
  session: ManagedCourse_Course_by_pk_Sessions | null;
  lectureStart: Date;
  lectureEnd: Date;
  qResult: QueryResult<ManagedCourse, ManagedCourseVariables>;
  onDelete: (pk: number) => any;
  onSetTitle: (session: ManagedCourse_Course_by_pk_Sessions, title: string) => any;
  onDeleteSpeaker: (id: number) => any;
}

export const SessionRow: FC<IProps> = ({
  session,
  lectureStart,
  lectureEnd,
  qResult,
  onDelete,
  onSetTitle,
  onDeleteSpeaker,
}) => {
  const { t } = useTranslation('course-page');
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const handleDelete = useCallback(() => {
    if (session != null) {
      const now = new Date();
      const isSessionInThePast = session.startDateTime < now;

      if (isAdmin) {
        // Admins can delete any session
        setIsConfirmDialogOpen(true);
      } else if (isInstructor) {
        if (isSessionInThePast) {
          // Instructors cannot delete past sessions
          setIsErrorDialogOpen(true);
        } else {
          // Instructors can delete future sessions
          setIsConfirmDialogOpen(true);
        }
      }
    }
  }, [session, isAdmin, isInstructor]);

  const handleConfirmDelete = useCallback(
    (confirmed: boolean) => {
      setIsConfirmDialogOpen(false);
      if (confirmed && session) {
        onDelete(session.id);
      }
    },
    [onDelete, session]
  );

  const handleCloseErrorDialog = useCallback(() => {
    setIsErrorDialogOpen(false);
  }, []);

  const handleDeleteSpeaker = useCallback(
    (id: number) => {
      onDeleteSpeaker(id);
    },
    [onDeleteSpeaker]
  );

  const handleSetTitle = useCallback(
    (event: any) => {
      if (session != null) {
        onSetTitle(session, eventTargetValueMapper(event));
      }
    },
    [session, onSetTitle]
  );

  const [updateSessionStartTime] = useRoleMutation(UPDATE_SESSION_START_TIME);
  const [updateSessionEndTime] = useRoleMutation(UPDATE_SESSION_END_TIME);

  const handleSetDate = useCallback(
    async (event: Date | null) => {
      if (session != null && event) {
        // Update both start and end datetime with the new date but keep original times
        const newStartDate = copyDateTime(event, session.startDateTime);
        const newEndDate = copyDateTime(event, session.endDateTime);

        // Update start time directly
        await updateSessionStartTime({
          variables: {
            sessionId: session.id,
            value: newStartDate.toISOString(),
          },
        });

        // Update end time directly
        await updateSessionEndTime({
          variables: {
            sessionId: session.id,
            value: newEndDate.toISOString(),
          },
        });

        // Refresh data after both mutations complete
        await qResult.refetch();
      }
    },
    [session, updateSessionStartTime, updateSessionEndTime, qResult]
  );

  const speakerTags = (session?.SessionSpeakers || []).map((x) => ({
    id: x.id,
    display: [x.Expert.User.firstName, x.Expert.User.lastName].join(' '),
  }));

  const [addSpeakerOpen, setAddSpeakerOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [searchValueForNewUser, setSearchValueForNewUser] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const openAddSpeaker = useCallback(() => {
    setAddSpeakerOpen(true);
  }, [setAddSpeakerOpen]);

  const [insertExpertMutation] = useRoleMutation<InsertExpert, InsertExpertVariables>(INSERT_EXPERT);
  const [insertSessionSpeaker] = useRoleMutation<InsertNewSessionSpeaker, InsertNewSessionSpeakerVariables>(
    INSERT_NEW_SESSION_SPEAKER
  );
  const [fetchUserByEmail] = useLazyRoleQuery<UserForSelection1, UserForSelection1Variables>(
    USER_SELECTION_ONE_PARAM
  );

  const handleNewSpeaker = useCallback(
    async (confirmed: boolean, user: UserForSelection1_User | null) => {
      if (confirmed && user != null && session != null) {
        let expertId = -1;

        if (user.Experts.length === 0) {
          const newExpert = await insertExpertMutation({
            variables: {
              userId: user.id,
            },
          });
          expertId = newExpert.data?.insert_Expert?.returning[0]?.id || -1;
        } else {
          expertId = user.Experts[0].id;
        }

        if (expertId !== -1) {
          await insertSessionSpeaker({
            variables: {
              expertId,
              sessionId: session.id,
            },
          });
        }

        qResult.refetch();
      }
      setAddSpeakerOpen(false);
    },
    [session, insertExpertMutation, insertSessionSpeaker, qResult]
  );

  const handleAddNewUser = useCallback(
    (searchValue: string) => {
      setSearchValueForNewUser(searchValue);
      setAddSpeakerOpen(false);
      setCreateUserDialogOpen(true);
    },
    []
  );

  const parseSearchValue = useCallback((searchValue: string) => {
    const trimmed = searchValue.trim();
    const parts = trimmed.split(' ');
    if (parts.length >= 2) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
        email: '',
      };
    } else if (trimmed.includes('@')) {
      return {
        firstName: '',
        lastName: '',
        email: trimmed,
      };
    } else {
      return {
        firstName: trimmed,
        lastName: '',
        email: '',
      };
    }
  }, []);

  const handleUserCreated = useCallback(
    async (userId: string, firstName: string, lastName: string, email: string) => {
      setPendingUserId(userId);
      setCreateUserDialogOpen(false);

      // Fetch the newly created user to get the full UserForSelection1_User structure
      try {
        const { data } = await fetchUserByEmail({
          variables: {
            searchValue: `%${email}%`,
          },
        });

        const newUser = data?.User?.find((u) => u.id === userId);
        if (newUser && session) {
          // Auto-select the new user as speaker
          await handleNewSpeaker(true, newUser);
        }
      } catch (error) {
        console.error('Error fetching new user:', error);
      } finally {
        setPendingUserId(null);
      }
    },
    [fetchUserByEmail, handleNewSpeaker, session]
  );

  return (
    <div>
      <div className={`grid grid-cols-24 gap-3 mb-1 ${session != null ? 'bg-edu-light-gray' : ''}`}>
        {!session && (
          <div className="p-3 col-span-3">
            {t('date')}
            <br />
          </div>
        )}
        {session && (
          <div className="p-3 col-span-3">
            <OptimisticDatePicker
              minDate={lectureStart}
              maxDate={lectureEnd}
              className="w-full bg-edu-light-gray"
              value={session.startDateTime}
              onChange={handleSetDate}
              showLoading={true}
              showWeekends={true}
            />
          </div>
        )}
        <div className="col-span-2">
          {!session && <div className="p-3">{t('start_time')}</div>}
          {session && (
            <TimePicker
              variant="eduhub"
              className="!text-gray-800"
              currentValue={session.startDateTime}
              updateValueMutation={UPDATE_SESSION_START_TIME}
              identifierVariables={{ sessionId: session.id }}
              refetchQueries={['ManagedCourse']}
              saveAsDateTime={true}
            />
          )}
        </div>
        <div className="col-span-2">
          {!session && <div className="p-3">{t('end_time')}</div>}
          {session && (
            <TimePicker
              variant="eduhub"
              className="!text-gray-800"
              currentValue={session.endDateTime}
              updateValueMutation={UPDATE_SESSION_END_TIME}
              identifierVariables={{ sessionId: session.id }}
              refetchQueries={['ManagedCourse']}
              saveAsDateTime={true}
            />
          )}
        </div>
        <div className="p-3 col-span-8">
          {!session && <>{t('title')}</>}
          {session && (
            <DebounceInput
              className="w-full bg-edu-light-gray"
              value={session.title}
              onChange={handleSetTitle}
              debounceTimeout={1000}
              placeholder={t('session_title')}
            />
          )}
        </div>
        <div className="pt-3 col-span-7">
          {!session && <>{t('external_speakers')}</>}
          {session && (
            <div className="">
              <EhMultipleTag requestAddTag={openAddSpeaker} requestDeleteTag={handleDeleteSpeaker} tags={speakerTags} />
            </div>
          )}
        </div>
        <div className="p-3 col-span-2">
          {session && (
            <div>
              <div>{location && <DeleteButton handleDelete={handleDelete} />}</div>
            </div>
          )}
        </div>
        {session?.SessionAddresses && (
          <div className="col-span-full pl-3 pb-3 pr-3">
            {[...(session?.SessionAddresses || [])]
              .sort((a, b) => {
                const locationOptions = Object.values(LocationOption_enum);
                return (
                  locationOptions.indexOf(a.CourseLocation.locationOption) -
                  locationOptions.indexOf(b.CourseLocation.locationOption)
                );
              })
              .map((address) => (
                <SessionAddresses key={address.id} address={address} refetchQueries={['ManagedCourse']} />
              ))}
          </div>
        )}
      </div>

      <SelectUserDialog
        onClose={handleNewSpeaker}
        open={addSpeakerOpen}
        title={t('add_external_speaker')}
        onAddNewUser={handleAddNewUser}
        showAddNewUserOption={true}
      />

      <CreateUserDialog
        open={createUserDialogOpen}
        onClose={() => {
          setCreateUserDialogOpen(false);
          setSearchValueForNewUser('');
        }}
        onSuccess={() => {
          // Refetch handled in handleUserCreated
        }}
        onUserCreated={handleUserCreated}
        {...parseSearchValue(searchValueForNewUser)}
      />

      {/* Confirmation Dialog for Deletion */}
      <QuestionConfirmationDialog
        open={isConfirmDialogOpen}
        onClose={() => handleConfirmDelete(false)}
        onConfirm={() => handleConfirmDelete(true)}
        question={t('confirmDeleteSession')}
        confirmationText={t('delete')}
      />

      {/* Error Dialog for Past Session Deletion Attempt */}
      <ErrorMessageDialog
        open={isErrorDialogOpen}
        onClose={handleCloseErrorDialog}
        errorMessage={t('cannotDeletePastSession')}
      />
    </div>
  );
};

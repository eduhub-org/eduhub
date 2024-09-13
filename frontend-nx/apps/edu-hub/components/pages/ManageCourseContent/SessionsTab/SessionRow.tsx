import { FC, useCallback, useState } from 'react';
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk_Sessions,
} from '../../../../graphql/__generated__/ManagedCourse';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import EhTimeSelect from '../../../common/EhTimeSelect';
import { useFormatTime } from '../../../../helpers/dateTimeHelpers';
import { DebounceInput } from 'react-debounce-input';
import { eventTargetValueMapper, useRoleMutation } from '../../../../hooks/authedMutation';

import { INSERT_NEW_SESSION_SPEAKER } from '../../../../graphql/queries/course/course';
import { QueryResult } from '@apollo/client';
import { SelectUserDialog } from '../../../common/dialogs/SelectUserDialog';
import { UserForSelection1_User } from '../../../../graphql/__generated__/UserForSelection1';
import { InsertExpert, InsertExpertVariables } from '../../../../graphql/__generated__/InsertExpert';
import { INSERT_EXPERT } from '../../../../graphql/queries/user/user';
import {
  InsertNewSessionSpeaker,
  InsertNewSessionSpeakerVariables,
} from '../../../../graphql/__generated__/InsertNewSessionSpeaker';
import EhMultipleTag from '../../../common/EhMultipleTag';
import useTranslation from 'next-translate/useTranslation';
import DeleteButton from '../../../../components/common/DeleteButton';
import SessionAddresses from './SessionAddresses';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { useIsAdmin, useIsInstructor } from '../../../../hooks/authentication';

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
  onSetStartDate: (session: ManagedCourse_Course_by_pk_Sessions, date: Date) => any;
  onSetEndDate: (session: ManagedCourse_Course_by_pk_Sessions, date: Date) => any;
  onSetTitle: (session: ManagedCourse_Course_by_pk_Sessions, title: string) => any;
  onDeleteSpeaker: (id: number) => any;
}

export const SessionRow: FC<IProps> = ({
  session,
  lectureStart,
  lectureEnd,
  qResult,
  onDelete,
  onSetStartDate,
  onSetEndDate,
  onSetTitle,
  onDeleteSpeaker,
}) => {
  const { t, lang } = useTranslation('course-page');
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const formatTime = useFormatTime();

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

  const handleSetDate = useCallback(
    (event: Date | null) => {
      if (session != null) {
        onSetStartDate(session, copyDateTime(event || new Date(), session.startDateTime));
        onSetEndDate(session, copyDateTime(event || new Date(), session.endDateTime));
      }
    },
    [session, onSetStartDate, onSetEndDate]
  );

  const handleSetStartTime = useCallback(
    (event: string) => {
      if (session != null) {
        const [hoursStr, minutesStr] = event.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        const newDate = new Date(session.startDateTime);
        newDate.setHours(hours, minutes, 0, 0);
        onSetStartDate(session, newDate);
      }
    },
    [session, onSetStartDate]
  );

  const handleSetEndTime = useCallback(
    (event: string) => {
      if (session != null) {
        const [hoursStr, minutesStr] = event.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        const newDate = new Date(session.endDateTime);
        newDate.setHours(hours, minutes, 0, 0);
        onSetEndDate(session, newDate);
      }
    },
    [session, onSetEndDate]
  );

  const speakerTags = (session?.SessionSpeakers || []).map((x) => ({
    id: x.id,
    display: [x.Expert.User.firstName, x.Expert.User.lastName].join(' '),
  }));

  const [addSpeakerOpen, setAddSpeakerOpen] = useState(false);
  const openAddSpeaker = useCallback(() => {
    setAddSpeakerOpen(true);
  }, [setAddSpeakerOpen]);

  const [insertExpertMutation] = useRoleMutation<InsertExpert, InsertExpertVariables>(INSERT_EXPERT);
  const [insertSessionSpeaker] = useRoleMutation<InsertNewSessionSpeaker, InsertNewSessionSpeakerVariables>(
    INSERT_NEW_SESSION_SPEAKER
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
            <DatePicker
              minDate={lectureStart}
              maxDate={lectureEnd}
              dateFormat={lang === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
              className="w-full bg-edu-light-gray"
              selected={session.startDateTime}
              onChange={handleSetDate}
              locale={lang}
            />
          </div>
        )}
        <div className="p-3 col-span-2">
          {!session && <>{t('start_time')}</>}
          {session && (
            <EhTimeSelect
              className="bg-edu-light-gray"
              onChange={handleSetStartTime}
              value={formatTime(session.startDateTime)}
            />
          )}
        </div>
        <div className="p-3 col-span-2">
          {!session && <>{t('end_time')}</>}
          {session && (
            <EhTimeSelect
              className="bg-edu-light-gray"
              onChange={handleSetEndTime}
              value={formatTime(session.endDateTime)}
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
        <div className="p-3 col-span-7">
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
                <SessionAddresses key={address.id} address={address} refetchQuery={qResult} />
              ))}
          </div>
        )}
      </div>

      <SelectUserDialog onClose={handleNewSpeaker} open={addSpeakerOpen} title={t('add_external_speaker')} />

      {/* Confirmation Dialog for Deletion */}
      <QuestionConfirmationDialog
        open={isConfirmDialogOpen}
        onClose={handleConfirmDelete}
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

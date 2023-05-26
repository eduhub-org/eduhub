import { FC, useCallback, useState } from 'react';
import { ManagedCourse_Course_by_pk_Sessions } from '../../../queries/__generated__/ManagedCourse';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import EhTimeSelect, { formatTime } from '../../common/EhTimeSelect';
import { DebounceInput } from 'react-debounce-input';
import { IconButton } from '@material-ui/core';
import { MdDelete } from 'react-icons/md';
import {
  eventTargetValueMapper,
  useRoleMutation,
} from '../../../hooks/authedMutation';
import { InputDialog } from '../../common/dialogs/InputDialog';
import {
  InsertSessionLocation,
  InsertSessionLocationVariables,
} from '../../../queries/__generated__/InsertSessionLocation';
import {
  INSERT_NEW_SESSION_LOCATION,
  INSERT_NEW_SESSION_SPEAKER,
} from '../../../queries/course';
import { QueryResult } from '@apollo/client';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import { UserForSelection1_User } from '../../../queries/__generated__/UserForSelection1';
import {
  InsertExpert,
  InsertExpertVariables,
} from '../../../queries/__generated__/InsertExpert';
import { INSERT_EXPERT } from '../../../queries/user';
import {
  InsertNewSessionSpeaker,
  InsertNewSessionSpeakerVariables,
} from '../../../queries/__generated__/InsertNewSessionSpeaker';
import EhMultipleTag from '../../common/EhMultipleTag';
import useTranslation from 'next-translate/useTranslation';

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
  qResult: QueryResult<any, any>;
  onDelete: (pk: number) => any;
  onSetStartDate: (
    session: ManagedCourse_Course_by_pk_Sessions,
    date: Date
  ) => any;
  onSetEndDate: (
    session: ManagedCourse_Course_by_pk_Sessions,
    date: Date
  ) => any;
  onSetTitle: (
    session: ManagedCourse_Course_by_pk_Sessions,
    title: string
  ) => any;
  onDeleteLocation: (id: number) => any;
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
  onDeleteLocation,
  onDeleteSpeaker,
}) => {
  const { t, lang } = useTranslation();

  const handleDelete = useCallback(() => {
    if (session != null) {
      onDelete(session.id);
    }
  }, [session, onDelete]);

  const handleDeleteLocation = useCallback(
    (id: number) => {
      onDeleteLocation(id);
    },
    [onDeleteLocation]
  );

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
        onSetStartDate(
          session,
          copyDateTime(event || new Date(), session.startDateTime)
        );
        onSetEndDate(
          session,
          copyDateTime(event || new Date(), session.endDateTime)
        );
      }
    },
    [session, onSetStartDate, onSetEndDate]
  );

  const handleSetStartTime = useCallback(
    (event: string) => {
      if (session != null) {
        const copyDate = new Date(session.startDateTime);
        const [hoursStr, minutesStr] = event.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        copyDate.setHours(hours);
        copyDate.setMinutes(minutes);
        copyDate.setSeconds(0);
        copyDate.setMilliseconds(0);
        onSetStartDate(session, copyDate);
      }
    },
    [session, onSetStartDate]
  );

  const handleSetEndTime = useCallback(
    (event: string) => {
      if (session != null) {
        const copyDate = new Date(session.endDateTime);
        const [hoursStr, minutesStr] = event.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        copyDate.setHours(hours);
        copyDate.setMinutes(minutes);
        copyDate.setSeconds(0);
        copyDate.setMilliseconds(0);
        onSetEndDate(session, copyDate);
      }
    },
    [session, onSetEndDate]
  );

  const addressTags = (session?.SessionAddresses || []).map((x) => ({
    id: x.id,
    display: x.address || '',
  }));

  const speakerTags = (session?.SessionSpeakers || []).map((x) => ({
    id: x.id,
    display: [x.Expert.User.firstName, x.Expert.User.lastName].join(' '),
  }));

  const [addressAddOpen, setAddressAddOpen] = useState(false);
  const openAddressAdd = useCallback(() => {
    setAddressAddOpen(true);
  }, [setAddressAddOpen]);

  const [insertSessionLocationMutation] = useRoleMutation<
    InsertSessionLocation,
    InsertSessionLocationVariables
  >(INSERT_NEW_SESSION_LOCATION);

  const handleAddNewAddress = useCallback(
    async (confirmed: boolean, inputValue: string) => {
      if (session != null && confirmed) {
        await insertSessionLocationMutation({
          variables: {
            sessionId: session.id,
            address: inputValue,
          },
        });
        qResult.refetch();
      }

      setAddressAddOpen(false);
    },
    [session, setAddressAddOpen, insertSessionLocationMutation, qResult]
  );

  const [addSpeakerOpen, setAddSpeakerOpen] = useState(false);
  const openAddSpeaker = useCallback(() => {
    setAddSpeakerOpen(true);
  }, [setAddSpeakerOpen]);

  const [insertExpertMutation] = useRoleMutation<
    InsertExpert,
    InsertExpertVariables
  >(INSERT_EXPERT);
  const [insertSessionSpeaker] = useRoleMutation<
    InsertNewSessionSpeaker,
    InsertNewSessionSpeakerVariables
  >(INSERT_NEW_SESSION_SPEAKER);

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
      <div
        className={`grid grid-cols-32 mb-1 ${
          session != null ? 'bg-edu-light-gray' : ''
        }`}
      >
        {!session && (
          <div className="mr-3 ml-3 col-span-4">
            {t('date')}
            <br />
          </div>
        )}

        {session && (
          <div className="col-span-4 m-2">
            <DatePicker
              minDate={lectureStart}
              maxDate={lectureEnd}
              dateFormat={lang === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
              className="w-full bg-edu-light-gray"
              selected={session.startDateTime}
              onChange={handleSetDate}
              locale={lang}
            />{' '}
          </div>
        )}

        <div className="mr-3 ml-3 col-span-3">
          {!session && <>{t('start-time')}</>}
          {session && (
            <EhTimeSelect
              className="bg-edu-light-gray m-2"
              onChange={handleSetStartTime}
              value={formatTime(session.startDateTime)}
            />
          )}
        </div>
        <div className="mr-3 ml-3 col-span-3">
          {!session && <>{t('end-time')}</>}
          {session && (
            <EhTimeSelect
              className="bg-edu-light-gray m-2"
              onChange={handleSetEndTime}
              value={formatTime(session.endDateTime)}
            />
          )}
        </div>
        <div className="mr-3 ml-3 col-span-10">
          {!session && <>{t('title')}</>}
          {session && (
            <DebounceInput
              className="w-full bg-edu-light-gray m-2"
              value={session.title}
              onChange={handleSetTitle}
              debounceTimeout={1000}
              placeholder={t('new-title')}
            />
          )}
        </div>
        <div className="mr-3 ml-3 col-span-5">
          {!session && <>{t('addresses')}</>}
          {session && (
            <div className="m-2">
              <EhMultipleTag
                requestAddTag={openAddressAdd}
                requestDeleteTag={handleDeleteLocation}
                tags={addressTags}
              />
            </div>
          )}
        </div>
        <div className="mr-3 ml-3 col-span-5">
          {!session && <>{t('speakers')}</>}
          {session && (
            <div className="m-2">
              <EhMultipleTag
                requestAddTag={openAddSpeaker}
                requestDeleteTag={handleDeleteSpeaker}
                tags={speakerTags}
              />
            </div>
          )}
        </div>
        <div className="ml-3 col-span-2">
          {session && (
            <div onClick={handleDelete} className="mt-2 ml-2">
              <IconButton size="small">
                <MdDelete size="1.25em" />
              </IconButton>
            </div>
          )}
        </div>
      </div>
      <InputDialog
        open={addressAddOpen}
        onClose={handleAddNewAddress}
        inputLabel={t('course-page:add-session-address')}
      />
      <SelectUserDialog
        onClose={handleNewSpeaker}
        open={addSpeakerOpen}
        title={t('select-something', { something: t('speaker') })}
      />
    </div>
  );
};

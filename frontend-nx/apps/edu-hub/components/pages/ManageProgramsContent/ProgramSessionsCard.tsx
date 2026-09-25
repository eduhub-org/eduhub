import { FC, useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

import { useManageQuery } from '../../../hooks/authedQuery';
import { useManageMutation } from '../../../hooks/authedMutation';
import { useManageRole } from '../../../hooks/authentication';
import { LocationOption_enum } from '../../../__generated__/globalTypes';
import { ProgramList_Program } from '../../../queries/__generated__/ProgramList';
import {
  ProgramSessions,
  ProgramSessionsVariables,
  ProgramSessions_Session,
  ProgramSessions_Session_SessionAddresses,
} from '../../../queries/__generated__/ProgramSessions';
import {
  InsertProgramSession,
  InsertProgramSessionVariables,
} from '../../../queries/__generated__/InsertProgramSession';
import {
  LocationAddressByLocationOption,
  LocationAddressByLocationOptionVariables,
} from '../../../queries/__generated__/LocationAddressByLocationOption';
import {
  INSERT_PROGRAM_SESSION,
  PROGRAM_SESSIONS,
  UPDATE_PROGRAM_SESSION_LOCATION_OPTION,
  UPDATE_PROGRAM_SESSION_ONLINE_LINK,
} from '../../../queries/programSession';
import {
  DELETE_SESSION,
  UPDATE_SESSION_ADDRESS,
  UPDATE_SESSION_END_TIME,
  UPDATE_SESSION_IS_MANDATORY,
  UPDATE_SESSION_START_TIME,
  UPDATE_SESSION_TITLE,
} from '../../../queries/course';
import { LOCATION_ADDRESS_BY_LOCATION_OPTION } from '../../../queries/locationAddress';
import TableGrid from '../../common/TableGrid';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import DropDownSelector from '../../inputs/DropDownSelector';
import InputField from '../../inputs/InputField';
import OptimisticDatePicker from '../../inputs/OptimisticDatePicker';
import TimePicker from '../../inputs/TimePicker';

const REFETCH = ['ProgramSessions'];

/** Keeps the time of day of `source` on the calendar day of `target`. */
const onDayOf = (target: Date, source: Date) => {
  const result = new Date(target);
  result.setHours(source.getHours(), source.getMinutes(), 0, 0);
  return result;
};

/** The next session starts a week after the last one, or at 18:00 on the first lecture day. */
const nextProgramSessionTimes = (lastSession: ProgramSessions_Session | undefined, lectureStart: string | null) => {
  if (lastSession) {
    const week = 7 * 24 * 60 * 60 * 1000;
    return {
      startTime: new Date(new Date(lastSession.startDateTime).getTime() + week),
      endTime: new Date(new Date(lastSession.endDateTime).getTime() + week),
    };
  }
  const start = lectureStart ? new Date(lectureStart) : new Date();
  start.setHours(18, 0, 0, 0);
  return { startTime: start, endTime: new Date(start.getTime() + 90 * 60 * 1000) };
};

/** The single place of a program session: an online link or an address of the chosen location. */
const ProgramSessionLocation: FC<{ address: ProgramSessions_Session_SessionAddresses | undefined }> = ({ address }) => {
  const t = useTranslations('managePrograms.program_sessions');
  const tCommon = useTranslations('common');
  const locationOption = address?.locationOption ?? LocationOption_enum.ONLINE;
  const isOnline = locationOption === LocationOption_enum.ONLINE;

  const { data: addressData } = useManageQuery<LocationAddressByLocationOption, LocationAddressByLocationOptionVariables>(
    LOCATION_ADDRESS_BY_LOCATION_OPTION,
    { variables: { locationOption, searchFilter: '%' }, skip: !address || isOnline }
  );

  const locationOptions = useMemo(
    () =>
      Object.values(LocationOption_enum).map((option) => ({ value: option, label: tCommon(`location.${option}`) })),
    [tCommon]
  );
  const addressOptions = useMemo(
    () =>
      (addressData?.LocationAddress ?? []).map((addr) => ({
        value: addr.id.toString(),
        label: addr.address ? `${addr.shortLabel} (${addr.address})` : addr.shortLabel,
        aliases: addr.aliases || [],
      })),
    [addressData]
  );

  if (!address) return null;

  return (
    <div className="w-full min-w-0 flex items-center gap-2">
      <div className="w-32 flex-shrink-0">
        <DropDownSelector
          variant="material"
          value={locationOption}
          options={locationOptions}
          updateValueMutation={UPDATE_PROGRAM_SESSION_LOCATION_OPTION}
          identifierVariables={{ itemId: address.id }}
          refetchQueries={REFETCH}
        />
      </div>
      <div className="flex-1 min-w-0">
        {isOnline ? (
          <InputField
            variant="material"
            type="input"
            compact
            placeholder={t('online_link_placeholder')}
            itemId={address.id}
            value={address.address ?? ''}
            updateValueMutation={UPDATE_PROGRAM_SESSION_ONLINE_LINK}
            refetchQueries={REFETCH}
            fullWidth
          />
        ) : (
          <DropDownSelector
            variant="material"
            placeholder={t('location_address_placeholder')}
            value={address.locationAddressId?.toString() ?? ''}
            options={addressOptions}
            updateValueMutation={UPDATE_SESSION_ADDRESS}
            identifierVariables={{ itemId: address.id }}
            refetchQueries={REFETCH}
            nullable
            searchable
          />
        )}
      </div>
    </div>
  );
};

interface ProgramSessionsCardProps {
  program: ProgramList_Program;
}

/**
 * Program-wide sessions: shown in the schedule of every course of the program,
 * marked as program sessions. Optional by default; a mandatory one counts
 * toward passing in each course like a course session does.
 */
const ProgramSessionsCard: FC<ProgramSessionsCardProps> = ({ program }) => {
  const t = useTranslations('managePrograms.program_sessions');
  const tCoursePage = useTranslations('coursePage');
  const manageRole = useManageRole();
  const [pageIndex, setPageIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');

  const { data, loading, error, refetch } = useManageQuery<ProgramSessions, ProgramSessionsVariables>(
    PROGRAM_SESSIONS,
    { variables: { programId: program.id } }
  );
  const sessions = useMemo(() => data?.Session ?? [], [data]);

  const filteredSessions = useMemo(() => {
    const needle = searchFilter.trim().toLowerCase();
    return needle ? sessions.filter((s) => s.title?.toLowerCase().includes(needle)) : sessions;
  }, [sessions, searchFilter]);

  const [insertProgramSession] = useManageMutation<InsertProgramSession, InsertProgramSessionVariables>(
    INSERT_PROGRAM_SESSION
  );
  const [updateStartTime] = useManageMutation(UPDATE_SESSION_START_TIME);
  const [updateEndTime] = useManageMutation(UPDATE_SESSION_END_TIME);

  const handleAdd = useCallback(async () => {
    const { startTime, endTime } = nextProgramSessionTimes(sessions[sessions.length - 1], program.lectureStart);
    await insertProgramSession({
      variables: { programId: program.id, startTime: startTime.toISOString(), endTime: endTime.toISOString() },
    });
    await refetch();
  }, [sessions, program.id, program.lectureStart, insertProgramSession, refetch]);

  const handleSetDate = useCallback(
    async (session: ProgramSessions_Session, date: Date | null) => {
      if (!date) return;
      await updateStartTime({
        variables: { sessionId: session.id, value: onDayOf(date, new Date(session.startDateTime)).toISOString() },
      });
      await updateEndTime({
        variables: { sessionId: session.id, value: onDayOf(date, new Date(session.endDateTime)).toISOString() },
      });
      await refetch();
    },
    [updateStartTime, updateEndTime, refetch]
  );

  const columns = useMemo<ColumnDef<ProgramSessions_Session>[]>(
    () => [
      {
        id: 'date',
        header: tCoursePage('date'),
        size: 130,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="w-full light flex items-center">
            <OptimisticDatePicker
              className="w-full !bg-fill-primary !text-label-primary border border-border-primary rounded px-2 py-1.5 h-9"
              value={new Date(row.original.startDateTime)}
              onChange={(date) => handleSetDate(row.original, date)}
              showLoading={true}
              showWeekends={true}
            />
          </div>
        ),
      },
      {
        id: 'startTime',
        header: tCoursePage('start_time'),
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
            refetchQueries={REFETCH}
            saveAsDateTime={true}
          />
        ),
      },
      {
        id: 'endTime',
        header: tCoursePage('end_time'),
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
            refetchQueries={REFETCH}
            saveAsDateTime={true}
          />
        ),
      },
      {
        id: 'title',
        header: tCoursePage('title'),
        size: 220,
        enableSorting: false,
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
              refetchQueries={REFETCH}
              fullWidth
            />
          </div>
        ),
      },
      {
        id: 'isMandatory',
        header: tCoursePage('mandatory'),
        size: 90,
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <CheckboxSelector
            variant="eduhub"
            className="[&_input]:mr-0"
            checked={row.original.isMandatory}
            updateValueMutation={UPDATE_SESSION_IS_MANDATORY}
            identifierVariables={{ sessionId: row.original.id }}
            refetchQueries={REFETCH}
          />
        ),
      },
      {
        id: 'location',
        header: t('location'),
        size: 300,
        enableSorting: false,
        cell: ({ row }) => <ProgramSessionLocation address={row.original.SessionAddresses[0]} />,
      },
    ],
    [t, tCoursePage, handleSetDate]
  );

  return (
    <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-3 md:col-span-2 min-w-0">
      <div>
        <h4 className="text-sm font-medium text-label-primary">{t('title')}</h4>
        <p className="text-xs text-label-secondary mt-1">{t('help_text')}</p>
      </div>
      <TableGrid<ProgramSessions_Session>
        data={filteredSessions}
        columns={columns}
        loading={loading}
        error={error}
        deleteMutation={DELETE_SESSION}
        deleteIdType="number"
        role={manageRole}
        generateDeletionConfirmationQuestion={(row) => t('confirm_delete') + (row.title ? ` (${row.title})` : '')}
        refetchQueries={REFETCH}
        onAddButtonClick={handleAdd}
        addButtonText={t('add')}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={10}
        totalCount={filteredSessions.length}
        searchFilter={searchFilter}
        onSearchFilterChange={(value) => {
          setSearchFilter(value);
          setPageIndex(0);
        }}
        showGlobalSearchField={false}
        compactRows
      />
    </div>
  );
};

export default ProgramSessionsCard;

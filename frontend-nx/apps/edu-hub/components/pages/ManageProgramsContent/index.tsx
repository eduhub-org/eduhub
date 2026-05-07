import { FC, useCallback, useMemo, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';

import { ProgramList_Program } from '../../../queries/__generated__/ProgramList';
import { PROGRAM_LIST } from '../../../queries/programList';
import { order_by } from '../../../__generated__/globalTypes';
import {
  UpdateProgramPublished,
  UpdateProgramPublishedVariables,
} from '../../../queries/__generated__/UpdateProgramPublished';
import {
  INSERT_PROGRAM,
  UPDATE_PROGRAM_PUBLISHED,
  DELETE_PROGRAM,
  UPDATE_PROGRAM_APPLICATION_START,
  UPDATE_PROGRAM_APPLICATION_END,
  UPDATE_PROGRAM_LECTURE_START,
  UPDATE_PROGRAM_LECTURE_END,
  UPDATE_PROGRAM_DEFAULT_PROJECT_SUBMISSION_DEADLINE,
  UPDATE_PROGRAM_TITLE,
} from '../../../queries/updateProgram';
import { InsertProgram, InsertProgramVariables } from '../../../queries/__generated__/InsertProgram';

import TableGrid from '../../common/TableGrid';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import InputField from '../../inputs/InputField';
import DatePicker from '../../inputs/DatePicker';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import CommonPageHeader from '../../common/CommonPageHeader';
import ExpandableProgramRow from './ExpandableProgramRow';
import { useTranslations } from 'next-intl';

const QUERY_LIMIT = 100;

export const ManageProgramsContent: FC = () => {
  const t = useTranslations('managePrograms');

  // Filter state management
  const [filter] = useState({
    limit: QUERY_LIMIT,
    order_by: [{ id: order_by.desc }],
  });

  // Use TableGrid hook with server-side sorting
  const { data, loading, error, searchFilter, pageIndex, sorting, setSearchFilter, setPageIndex, setSorting } = useTableGrid({
    queryHook: useAdminQuery,
    query: PROGRAM_LIST,
    queryVariables: filter,
    pageSize: filter.limit || QUERY_LIMIT,
    debounceMs: 1000,
    defaultSort: [{ id: order_by.desc }],
    sortColumnMapper: (columnId) => {
      // Map table column IDs to GraphQL field names
      const mapping: Record<string, string> = {
        'title': 'title',
        'applicationStart': 'applicationStart',
        'applicationEnd': 'defaultApplicationEnd',
        'lectureStart': 'lectureStart',
        'lectureEnd': 'lectureEnd',
        'defaultProjectSubmissionDeadline': 'defaultProjectSubmissionDeadline',
        'published': 'published'
      };
      return mapping[columnId] || null;
    },
    refetchFilter: useCallback(
      (searchTerm: string) => {
        const searchCondition = createMultiWordSearchCondition(searchTerm, ['title']);
        return {
          where: {
            ...searchCondition,
          },
        };
      },
      []
    ),
  });

  const programs: ProgramList_Program[] = useMemo(() => data?.Program || [], [data?.Program]);
  const totalCount = data?.Program_aggregate?.aggregate?.count || 0;

  // Notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Mutations
  const [insertProgram] = useAdminMutation<InsertProgram, InsertProgramVariables>(INSERT_PROGRAM, {
    refetchQueries: ['ProgramList'],
  });

  const [updatePublished] = useAdminMutation<UpdateProgramPublished, UpdateProgramPublishedVariables>(
    UPDATE_PROGRAM_PUBLISHED,
    {
      refetchQueries: ['ProgramList'],
    }
  );

  // Add program handler
  const handleAddProgram = useCallback(async () => {
    try {
      await insertProgram({
        variables: {
          title: t('title.placeholder'),
          today: new Date(),
        },
      });

      setSuccessMessage(t('notifications.programs_published_success_singular'));
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error adding program:', error);
      setErrorMessage(t('notifications.bulk_action_failed', { action: 'add' }));
      setShowErrorNotification(true);
    }
  }, [insertProgram, t]);

  // Bulk action handlers
  const handleBulkAction = useCallback(
    async (action: string, selectedPrograms: ProgramList_Program[]) => {
      const programIds = selectedPrograms.map((program) => program.id);

      try {
        if (action === 'publish') {
          await Promise.all(
            programIds.map((id) =>
              updatePublished({
                variables: { programId: id, published: true },
              })
            )
          );
          setSuccessMessage(
            t(
              selectedPrograms.length === 1
                ? 'notifications.programs_published_success_singular'
                : 'notifications.programs_published_success_plural',
              {
                count: selectedPrograms.length,
              }
            )
          );
          setShowSuccessNotification(true);
        } else if (action === 'unpublish') {
          await Promise.all(
            programIds.map((id) =>
              updatePublished({
                variables: { programId: id, published: false },
              })
            )
          );
          setSuccessMessage(
            t(
              selectedPrograms.length === 1
                ? 'notifications.programs_unpublished_success_singular'
                : 'notifications.programs_unpublished_success_plural',
              {
                count: selectedPrograms.length,
              }
            )
          );
          setShowSuccessNotification(true);
        }
      } catch (error) {
        console.error(`Error during bulk ${action} action:`, error);
        setErrorMessage(t('notifications.bulk_action_failed', { action }));
        setShowErrorNotification(true);
      }
    },
    [updatePublished, t]
  );

  const bulkActions = [
    { value: 'publish', label: t('bulk_action.publish') },
    { value: 'unpublish', label: t('bulk_action.unpublish') },
  ];

  // Define columns with sizes that fit within screen width
  // Total column width: 70 + 280 + 130*5 = 1000px (plus gaps and action buttons ≈ 1150px)
  const columns = useMemo<ColumnDef<ProgramList_Program>[]>(
    () => [
      {
        header: t('table_header.published'),
        accessorKey: 'published',
        size: 70,
        enableSorting: false,
        meta: { className: 'text-center' },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <div
              className={`w-3 h-3 rounded-full ${row.original.published ? 'bg-green-500' : 'bg-red-500'}`}
              title={row.original.published ? t('table_header.published') : t('table_header.not_published')}
            />
          </div>
        ),
      },
      {
        header: t('title.label'),
        accessorKey: 'title',
        size: 280,
        minSize: 200,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="w-full">
            <InputField
              variant="material"
              type="input"
              placeholder={t('title.placeholder')}
              helpText={t('title.help_text')}
              itemId={row.original.id}
              value={row.original.title || ''}
              updateValueMutation={UPDATE_PROGRAM_TITLE}
              refetchQueries={['ProgramList']}
            />
          </div>
        ),
      },
      {
        header: t('table_header.application_start'),
        accessorKey: 'applicationStart',
        size: 130,
        enableSorting: true,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const startDate = row.original.applicationStart ? new Date(row.original.applicationStart) : null;
          return (
            <div className="text-center w-full">
              <DatePicker
                variant="material"
                itemId={row.original.id}
                value={startDate}
                updateValueMutation={UPDATE_PROGRAM_APPLICATION_START}
                refetchQueries={['ProgramList']}
                dateFieldName="applicationStart"
                identifierVariables={{ programId: row.original.id }}
              />
            </div>
          );
        },
      },
      {
        header: t('table_header.application_end'),
        accessorKey: 'applicationEnd',
        size: 130,
        enableSorting: true,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const endDate = row.original.defaultApplicationEnd ? new Date(row.original.defaultApplicationEnd) : null;
          return (
            <div className="text-center w-full">
              <DatePicker
                variant="material"
                itemId={row.original.id}
                value={endDate}
                updateValueMutation={UPDATE_PROGRAM_APPLICATION_END}
                refetchQueries={['ProgramList']}
                dateFieldName="applicationEnd"
                identifierVariables={{ programId: row.original.id }}
              />
            </div>
          );
        },
      },
      {
        header: t('table_header.course_start'),
        accessorKey: 'lectureStart',
        size: 130,
        enableSorting: true,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const startDate = row.original.lectureStart ? new Date(row.original.lectureStart) : null;
          return (
            <div className="text-center w-full">
              <DatePicker
                variant="material"
                itemId={row.original.id}
                value={startDate}
                updateValueMutation={UPDATE_PROGRAM_LECTURE_START}
                refetchQueries={['ProgramList']}
                dateFieldName="lectureStart"
                identifierVariables={{ programId: row.original.id }}
              />
            </div>
          );
        },
      },
      {
        header: t('table_header.course_end'),
        accessorKey: 'lectureEnd',
        size: 130,
        enableSorting: true,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const endDate = row.original.lectureEnd ? new Date(row.original.lectureEnd) : null;
          return (
            <div className="text-center w-full">
              <DatePicker
                variant="material"
                itemId={row.original.id}
                value={endDate}
                updateValueMutation={UPDATE_PROGRAM_LECTURE_END}
                refetchQueries={['ProgramList']}
                dateFieldName="lectureEnd"
                identifierVariables={{ programId: row.original.id }}
              />
            </div>
          );
        },
      },
      {
        header: t('table_header.project_submission_deadline'),
        accessorKey: 'defaultProjectSubmissionDeadline',
        size: 130,
        minSize: 130,
        enableSorting: true,
        meta: { className: 'text-center' },
        cell: ({ row }) => {
          const deadline = row.original.defaultProjectSubmissionDeadline
            ? new Date(row.original.defaultProjectSubmissionDeadline)
            : null;
          return (
            <div className="text-center w-full">
              <DatePicker
                variant="material"
                itemId={row.original.id}
                value={deadline}
                updateValueMutation={UPDATE_PROGRAM_DEFAULT_PROJECT_SUBMISSION_DEADLINE}
                refetchQueries={['ProgramList']}
                dateFieldName="value"
                identifierVariables={{ itemId: row.original.id }}
              />
            </div>
          );
        },
      },
    ],
    [t]
  );

  const handlePageSizeChange = useCallback(
    () => {
      // Page size change handled by useTableGrid
      setPageIndex(0);
    },
    [setPageIndex]
  );

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <CommonPageHeader headline={t('headline')} />
      
      <TableGrid<ProgramList_Program>
        columns={columns}
        data={programs}
        loading={loading}
        error={error}
        enablePagination={true}
        totalCount={totalCount}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={filter.limit || QUERY_LIMIT}
        onPageSizeChange={handlePageSizeChange}
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        refetchQueries={['ProgramList']}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        onAddButtonClick={handleAddProgram}
        addButtonText={t('add_program_button')}
        expandableRowComponent={(props) => <ExpandableProgramRow program={props.row} />}
        deleteMutation={DELETE_PROGRAM}
        deleteIdType="number"
        generateDeletionConfirmationQuestion={(row) =>
          t('delete_button.delete_program_confirmation', {
            title: row.title || t('delete_button.untitled_program'),
          })
        }
      />

      <NotificationSnackbar
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message={successMessage}
        duration={4000}
      />

      <NotificationSnackbar
        open={showErrorNotification}
        onClose={() => setShowErrorNotification(false)}
        message={errorMessage}
        duration={6000}
        />
    </div>
  );
};

import { FC, useCallback, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import CommonPageHeader from '../../common/CommonPageHeader';
import { PageBlock } from '../../common/PageBlock';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import { ISSUE_REPORT_LIST, UPDATE_ISSUE_REPORT_PRIORITY, UPDATE_ISSUE_REPORT_STATUS } from '../../../queries/issueReports';
import { IssueReportList, IssueReportList_IssueReport } from '../../../queries/__generated__/IssueReportList';
import { ReportDetails } from './ReportDetails';
import { WeeklySummaries } from './WeeklySummaries';
import { OPEN_STATUSES, peopleAffected, PRIORITIES, REPORT_STATUSES, REPORT_TYPES } from './reportUtils';


/**
 * Bug reports and feature ideas sent through the Assistant (issue #2234), for admins to
 * prioritise: weekly summaries on top, the reports below.
 */
const ManageReportsContent: FC = () => {
  const t = useTranslations('manageReports');
  const locale = useLocale();
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>(OPEN_STATUSES);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, initialLoading, error: queryError, pageIndex, setPageIndex, searchFilter, setSearchFilter, sorting, setSorting } =
    useTableGrid({
      queryHook: useAdminQuery,
      query: ISSUE_REPORT_LIST,
      pageSize: 20,
      refetchFilter: (term: string) => ({
        filter: {
          _and: [
            createMultiWordSearchCondition(term, ['title', 'description', 'publicNote']),
            ...(typeFilter.length ? [{ type: { _in: typeFilter } }] : []),
            ...(statusFilter.length ? [{ status: { _in: statusFilter } }] : []),
          ],
        },
      }),
      sortColumnMapper: (columnId: string) => (columnId === 'people' ? { Votes_aggregate: { count: null } } : columnId),
      defaultSort: [{ created_at: 'desc' }],
    });
  const rows = (data as IssueReportList | undefined)?.IssueReport ?? [];

  const onFilter = useCallback(
    (set: (value: string[]) => void) => (selected: string[]) => {
      set(selected);
      setPageIndex(0);
    },
    [setPageIndex]
  );

  const statusOptions = useMemo(() => REPORT_STATUSES.map((value) => ({ value, label: t(`status.${value}`) })), [t]);
  const priorityOptions = useMemo(() => PRIORITIES.map((value) => ({ value, label: t(`priority.${value}`) })), [t]);

  const columns = useMemo<ColumnDef<IssueReportList_IssueReport>[]>(
    () => [
      {
        accessorKey: 'type',
        header: t('columns.type'),
        size: 90,
        cell: ({ row }) => <span className="px-2">{t(`type.${row.original.type}`)}</span>,
      },
      {
        accessorKey: 'title',
        header: t('columns.title'),
        size: 360,
        minSize: 200,
        enableSorting: true,
        cell: ({ row }) => <span className="px-2 font-medium">{row.original.title}</span>,
      },
      {
        id: 'people',
        header: t('columns.people'),
        size: 90,
        enableSorting: true,
        cell: ({ row }) => <span className="px-2">{peopleAffected(row.original)}</span>,
      },
      {
        accessorKey: 'status',
        header: t('columns.status'),
        size: 170,
        cell: ({ row }) => (
          <DropDownSelector
            variant="material"
            identifierVariables={{ id: row.original.id }}
            value={row.original.status}
            options={statusOptions}
            updateValueMutation={UPDATE_ISSUE_REPORT_STATUS}
            refetchQueries={['IssueReportList']}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('columns.priority'),
        size: 150,
        enableSorting: true,
        cell: ({ row }) => (
          <DropDownSelector
            variant="material"
            identifierVariables={{ id: row.original.id }}
            value={row.original.priority ?? ''}
            options={priorityOptions}
            nullable
            nullableLabel={t('priority.none')}
            updateValueMutation={UPDATE_ISSUE_REPORT_PRIORITY}
            refetchQueries={['IssueReportList']}
          />
        ),
      },
      {
        accessorKey: 'created_at',
        header: t('columns.created'),
        size: 120,
        enableSorting: true,
        cell: ({ row }) => <span className="px-2">{new Date(row.original.created_at).toLocaleDateString(locale)}</span>,
      },
    ],
    [t, locale, statusOptions, priorityOptions]
  );

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        <CommonPageHeader headline={t('headline')} />
        <p className="mb-6 max-w-3xl text-white">{t('intro')}</p>
        <WeeklySummaries />
        {initialLoading ? (
          <Loading />
        ) : (
          <TableGrid<IssueReportList_IssueReport>
            columns={columns}
            data={rows}
            totalCount={(data as IssueReportList | undefined)?.IssueReport_aggregate.aggregate?.count ?? 0}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            searchFilter={searchFilter}
            onSearchFilterChange={setSearchFilter}
            sorting={sorting}
            onSortingChange={setSorting}
            error={queryError}
            loading={loading}
            refetchQueries={['IssueReportList']}
            filters={[
              {
                id: 'type',
                label: t('columns.type'),
                options: REPORT_TYPES.map((value) => ({ value, label: t(`type.${value}`) })),
                selected: typeFilter,
                onChange: onFilter(setTypeFilter),
              },
              {
                id: 'status',
                label: t('columns.status'),
                options: statusOptions,
                selected: statusFilter,
                onChange: onFilter(setStatusFilter),
              },
            ]}
            expandableRowComponent={({ row }) => <ReportDetails row={row} onError={setError} />}
          />
        )}
        <ErrorMessageDialog errorMessage={error ?? ''} open={!!error} onClose={() => setError(null)} />
      </div>
    </PageBlock>
  );
};

export default ManageReportsContent;

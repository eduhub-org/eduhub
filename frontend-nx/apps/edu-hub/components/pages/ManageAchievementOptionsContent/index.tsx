import { FC, useCallback, useMemo, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useIsAdmin } from '../../../hooks/authentication';
import { IUserProfile } from '../../../hooks/user';
import { AchievementOptionList_AchievementOption } from '../../../queries/__generated__/AchievementOptionList';
import { ACHIEVEMENT_OPTIONS, ACHIEVEMENT_RECORD_TYPES } from '../../../queries/achievementOption';
import {
  INSERT_AN_ACHIEVEMENT_OPTION,
  DELETE_AN_ACHIEVEMENT_OPTION,
  UPDATE_ACHIEVEMENT_OPTION_TITLE,
  UPDATE_ACHIEVEMENT_OPTION_RECORD_TYPE,
} from '../../../queries/mutateAchievement';
import { InsertAnAchievementOption, InsertAnAchievementOptionVariables } from '../../../queries/__generated__/InsertAnAchievementOption';
import { AchievementRecordTypes } from '../../../queries/__generated__/AchievementRecordTypes';
import { order_by, AchievementRecordType_enum } from '../../../__generated__/globalTypes';

import TableGrid from '../../common/TableGrid';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import NavigationButton from '../../common/NavigationButton';
import ExpandableAchievementOptionRow from './ExpandableAchievementOptionRow';
import { makeFullName } from '../../../helpers/util';

const QUERY_LIMIT = 100;

// Helper function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number = 15): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength) + '...';
};

// Helper function to format mentors list with truncated names and count indicator
const formatMentorsList = (
  mentors: AchievementOptionList_AchievementOption['AchievementOptionMentors']
): string => {
  if (!mentors || mentors.length === 0) return '-';

  const maxVisible = 2;
  const visibleNames = mentors
    .slice(0, maxVisible)
    .map((m) => truncateText(makeFullName(m.User.firstName, m.User.lastName ?? '')))
    .join(', ');

  const remaining = mentors.length - maxVisible;
  return remaining > 0 ? `${visibleNames} (+${remaining})` : visibleNames;
};

// Helper function to format courses list with truncated titles and count indicator
const formatCoursesList = (
  courses: AchievementOptionList_AchievementOption['AchievementOptionCourses']
): string => {
  if (!courses || courses.length === 0) return '-';

  const maxVisible = 2;
  const visibleTitles = courses
    .slice(0, maxVisible)
    .map((c) => truncateText(c.Course.title))
    .join(', ');

  const remaining = courses.length - maxVisible;
  return remaining > 0 ? `${visibleTitles} (+${remaining})` : visibleTitles;
};

const ManageAchievementOptionsContent: FC<{
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
  achievementRecordTypes: string[];
}> = (props) => {
  const t = useTranslations('manageAchievementOptions');
  const tCommon = useTranslations('common');
  const tAchievementsPage = useTranslations('achievementsPage');
  const isAdmin = useIsAdmin();

  // Load achievement record types for dropdown
  const { data: recordTypesData } = useAdminQuery<AchievementRecordTypes>(ACHIEVEMENT_RECORD_TYPES);
  const recordTypeOptions = useMemo(() => {
    const types = recordTypesData?.AchievementRecordType.map((rt) => rt.value) || props.achievementRecordTypes;
    // Filter out deprecated DOCUMENTATION_AND_CSV enum value
    const validTypes = types.filter((type) => type !== 'DOCUMENTATION_AND_CSV');
    return validTypes.map((type) => ({
      value: type,
      label: t(`record_type.${type}`),
    }));
  }, [recordTypesData, props.achievementRecordTypes, t]);

  // Use TableGrid hook with server-side pagination, search, and sorting
  const { data, loading, error, searchFilter, pageIndex, sorting, setSearchFilter, setPageIndex, setSorting } = useTableGrid({
    queryHook: useAdminQuery,
    query: ACHIEVEMENT_OPTIONS,
    pageSize: QUERY_LIMIT,
    debounceMs: 1000,
    defaultSort: [{ id: order_by.desc }],
    sortColumnMapper: (columnId) => {
      switch (columnId) {
        case 'title':
          return 'title';
        case 'recordType':
          return 'recordType';
        default:
          return null;
      }
    },
    refetchFilter: useCallback(
      (searchTerm: string) => {
        const searchCondition = createMultiWordSearchCondition(searchTerm, ['title', 'description']);
        return { where: searchCondition };
      },
      []
    ),
  });

  const achievementOptions: AchievementOptionList_AchievementOption[] = useMemo(
    () => data?.AchievementOption || [],
    [data?.AchievementOption]
  );
  const totalCount = data?.AchievementOption_aggregate?.aggregate?.count || 0;

  // Notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Mutations
  const [insertAchievementOption] = useAdminMutation<InsertAnAchievementOption, InsertAnAchievementOptionVariables>(
    INSERT_AN_ACHIEVEMENT_OPTION,
    {
      refetchQueries: ['AchievementOptionList'],
    }
  );

  // Add achievement option handler
  const handleAddAchievementOption = useCallback(async () => {
    try {
      await insertAchievementOption({
        variables: {
          data: {
            title: t('title.placeholder'),
            recordType: (recordTypeOptions[0]?.value || 'DOCUMENTATION') as AchievementRecordType_enum,
          },
        },
      });

      setSuccessMessage(t('notifications.achievement_option_added'));
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error adding achievement option:', error);
      setErrorMessage(t('notifications.add_failed'));
      setShowErrorNotification(true);
    }
  }, [insertAchievementOption, t, recordTypeOptions]);

  // Column definitions with auto-save inputs
  const columns = useMemo<ColumnDef<AchievementOptionList_AchievementOption>[]>(
    () => [
      {
        header: t('table_header.title'),
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
              itemId={row.original.id}
              value={row.original.title || ''}
              updateValueMutation={UPDATE_ACHIEVEMENT_OPTION_TITLE}
              refetchQueries={['AchievementOptionList']}
            />
          </div>
        ),
      },
      {
        header: t('table_header.record_type'),
        accessorKey: 'recordType',
        size: 200,
        enableSorting: true,
        cell: ({ row }) => (
          <DropDownSelector
            variant="material"
            value={row.original.recordType || ''}
            options={recordTypeOptions}
            updateValueMutation={UPDATE_ACHIEVEMENT_OPTION_RECORD_TYPE}
            identifierVariables={{ itemId: row.original.id }}
            refetchQueries={['AchievementOptionList']}
          />
        ),
      },
      {
        header: t('table_header.mentors'),
        accessorKey: 'mentorCount',
        size: 250,
        enableSorting: false,
        cell: ({ row }) => <span>{formatMentorsList(row.original.AchievementOptionMentors)}</span>,
      },
      {
        header: t('table_header.courses'),
        accessorKey: 'courseCount',
        size: 250,
        enableSorting: false,
        cell: ({ row }) => <span>{formatCoursesList(row.original.AchievementOptionCourses)}</span>,
      },
    ],
    [t, recordTypeOptions]
  );

  const handlePageSizeChange = useCallback(() => {
    setPageIndex(0);
  }, [setPageIndex]);

  if (loading && !data) {
    return <CircularProgress />;
  }

  const header = tAchievementsPage('achievement-record');

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="py-10">
        <div className="flex justify-between items-center mt-10">
          <p className="text-base sm:text-lg lg:text-3xl leading-normal text-white">
            {header}
          </p>
          <NavigationButton href="/manage/achievement-templates" filled inverted>
            {t('manage_templates_button')}
          </NavigationButton>
        </div>
      </div>
      <TableGrid<AchievementOptionList_AchievementOption>
        columns={columns}
        data={achievementOptions}
        loading={loading}
        error={error}
        enablePagination={true}
        totalCount={totalCount}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={QUERY_LIMIT}
        onPageSizeChange={handlePageSizeChange}
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        refetchQueries={['AchievementOptionList']}
        onAddButtonClick={handleAddAchievementOption}
        addButtonText={tCommon('project-new-button')}
        expandableRowComponent={(props) => <ExpandableAchievementOptionRow achievementOption={props.row} />}
        deleteMutation={DELETE_AN_ACHIEVEMENT_OPTION}
        deleteIdType="number"
        generateDeletionConfirmationQuestion={(row: AchievementOptionList_AchievementOption) => {
          const title = row.title?.trim() || t('delete_button.untitled_achievement_option');
          return t('delete_button.delete_achievement_option_confirmation', {
            title: title,
          });
        }}
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

export default ManageAchievementOptionsContent;

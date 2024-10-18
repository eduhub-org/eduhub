import React, { FC, useMemo, useState, useEffect, useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';
import { useDebouncedCallback } from 'use-debounce';
import { ApolloError } from '@apollo/client';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import TextFieldEditor from '../../forms/TextFieldEditor';
import DropDownSelector from '../../forms/DropDownSelector';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { PageBlock } from '../../common/PageBlock';

import { OrganizationList, OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';
import { InsertOrganization, InsertOrganizationVariables } from '../../../queries/__generated__/InsertOrganization';
import {
  ORGANIZATION_LIST,
  INSERT_ORGANIZATION,
  UPDATE_ORGANIZATION_NAME,
  UPDATE_ORGANIZATION_TYPE,
  UPDATE_ORGANIZATION_DESCRIPTION,
  DELETE_ORGANIZATION,
  UPDATE_ORGANIZATION_ALIASES,
} from '../../../queries/organization';
import CreatableTagSelector from '../../forms/CreatableTagSelector';
import EhAddButton from '../../common/EhAddButton';

import { useBulkActions } from '../../../hooks/bulkActions';

const PAGE_SIZE = 15;

type ExpandableRowProps = {
  row: OrganizationList_Organization;
};

const ExpandableOrganizationRow: React.FC<ExpandableRowProps> = ({ row }): React.ReactElement => {
  const { t } = useTranslation('manageOrganizations');

  const currentTags = Array.isArray(row.aliases)
    ? row.aliases
        .filter((alias) => alias != null)
        .map((alias) => {
          if (typeof alias === 'string') return alias;
          if (typeof alias === 'object' && alias !== null && 'name' in alias) return alias.name;
          return null;
        })
        .filter((alias) => alias !== null)
    : [];

  return (
    <div className="font-medium bg-edu-course-list p-4">
      <CreatableTagSelector
        label={t('organization.aliases')}
        placeholder={t('input.enter_alias')}
        itemId={row.id}
        currentTags={currentTags}
        tagOptions={[]}
        updateTagsMutation={UPDATE_ORGANIZATION_ALIASES}
        refetchQueries={['OrganizationList']}
        translationNamespace="manageOrganizations"
      />
      <TextFieldEditor
        label={t('organization.description')}
        placeholder={t('input.enter_description')}
        itemId={row.id}
        currentText={row.description || ''}
        updateTextMutation={UPDATE_ORGANIZATION_DESCRIPTION}
        refetchQueries={['OrganizationList']}
        translationNamespace="manageOrganizations"
      />
    </div>
  );
};

const ManageOrganizationsContent: FC = () => {
  const [searchFilter, setSearchFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const { t } = useTranslation('manageOrganizations');
  const [error, setError] = useState<string | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedRowsForBulkAction, setSelectedRowsForBulkAction] = useState<OrganizationList_Organization[]>([]);

  const {
    data,
    loading,
    error: queryError,
    refetch,
  } = useAdminQuery<OrganizationList>(ORGANIZATION_LIST, {
    variables: {
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
      filter: searchFilter
        ? {
            _or: [{ name: { _ilike: `%${searchFilter}%` } }, { type: { _ilike: `%${searchFilter}%` } }],
          }
        : {},
      order_by: { name: 'asc' },
    },
  });
  const [insertOrganization] = useAdminMutation<InsertOrganization, InsertOrganizationVariables>(INSERT_ORGANIZATION);
  const [deleteOrganization] = useAdminMutation(DELETE_ORGANIZATION);

  const debouncedRefetch = useDebouncedCallback(refetch, 300);

  useEffect(() => {
    debouncedRefetch({
      offset: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
      filter: {
        _or: [{ name: { _ilike: `%${searchFilter}%` } }, { type: { _ilike: `%${searchFilter}%` } }],
      },
    });
  }, [pageIndex, debouncedRefetch, searchFilter]);

  const organizationTypes = data?.OrganizationType?.map((type) => type.value) || [];

  const columns = useMemo<ColumnDef<OrganizationList_Organization>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'organization.name',
        meta: { width: 3 },
        cell: ({ getValue, row }) => (
          <TextFieldEditor
            placeholder={t('input.enter_name')}
            itemId={row.original.id}
            currentText={getValue<string>()}
            updateTextMutation={UPDATE_ORGANIZATION_NAME}
            refetchQueries={['OrganizationList']}
            translationNamespace="manageOrganizations"
          />
        ),
      },
      {
        accessorKey: 'type',
        header: t('organization.type'),
        meta: { width: 3 },
        cell: ({ getValue, row }) => (
          <DropDownSelector
            itemId={row.original.id}
            currentValue={getValue<string>()}
            options={organizationTypes}
            updateValueMutation={UPDATE_ORGANIZATION_TYPE}
            refetchQueries={['OrganizationList']}
            translationNamespace="manageOrganizations"
            translationPrefix="type_selection."
          />
        ),
      },
    ],
    [t, organizationTypes]
  );

  const onAddOrganizationClick = useCallback(async () => {
    try {
      await insertOrganization({
        variables: {
          insertInput: {
            name: t('organization.new_organization'),
            type: organizationTypes[0],
            description: t('organization.default_description'),
          },
        },
      });
      refetch();
    } catch (error) {
      let errorMessage = '';
      if (error instanceof ApolloError) {
        const rawErrorMessage = error.message;
        if (rawErrorMessage.includes('duplicate key value violates unique constraint "Organization_name_key"')) {
          errorMessage = t('error.duplicate_organization_name');
        } else {
          errorMessage = rawErrorMessage;
        }
      } else {
        errorMessage = t('error.unexpected');
      }
      setError(errorMessage);
      console.error('Error adding organization:', error);
    }
  }, [insertOrganization, t, organizationTypes, refetch]);

  const generateDeletionConfirmation = useCallback(
    (row: OrganizationList_Organization) => {
      return t('action.delete_confirmation', { name: row.name });
    },
    [t]
  );

  const bulkActions = useMemo(() => [{ value: 'delete', label: t('action.bulk_delete') }], [t]);

  const handleBulkAction = useCallback((action: string, selectedRows: OrganizationList_Organization[]) => {
    if (action === 'delete' && selectedRows.length > 0) {
      setBulkActionDialogOpen(true);
      setSelectedRowsForBulkAction(selectedRows);
    }
  }, []);

  const handleBulkActionConfirmation = useCallback(
    async (confirmed: boolean) => {
      setBulkActionDialogOpen(false);
      if (confirmed) {
        try {
          await Promise.all(selectedRowsForBulkAction.map((row) => deleteOrganization({ variables: { id: row.id } })));
          refetch();
        } catch (error) {
          console.error('Error deleting organizations:', error);
          setError(t('error.bulk_delete'));
        }
      }
      setSelectedRowsForBulkAction([]);
    },
    [selectedRowsForBulkAction, deleteOrganization, refetch, t]
  );

  const handleCloseErrorDialog = () => {
    setError(null);
  };

  if (loading) return <Loading />;
  if (queryError) {
    console.error('Error loading organizations:', queryError);
    return <div>{t('error.loading')}</div>;
  }

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        <TableGrid
          columns={columns}
          data={data.Organization}
          deleteMutation={DELETE_ORGANIZATION}
          error={queryError}
          loading={loading}
          refetchQueries={['OrganizationList']}
          showDelete
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          translationNamespace="manageOrganizations"
          enablePagination
          pageIndex={pageIndex}
          searchFilter={searchFilter}
          setPageIndex={setPageIndex}
          setSearchFilter={setSearchFilter}
          pages={Math.ceil(data.Organization_aggregate.aggregate.count / PAGE_SIZE)}
          generateDeletionConfirmationQuestion={generateDeletionConfirmation}
          expandableRowComponent={({ row }) => <ExpandableOrganizationRow row={row} />}
          onAddButtonClick={onAddOrganizationClick}
          addButtonText={t('action.add')}
        />
        <ErrorMessageDialog errorMessage={error || ''} open={!!error} onClose={handleCloseErrorDialog} />
        <QuestionConfirmationDialog
          open={bulkActionDialogOpen}
          question={t('action.bulk_delete_confirmation', {
            count: selectedRowsForBulkAction.length,
          })}
          confirmationText={t('confirm')}
          onClose={handleBulkActionConfirmation}
        />
      </div>
    </PageBlock>
  );
};

export default ManageOrganizationsContent;

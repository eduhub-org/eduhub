import React, { FC, useMemo, useState, useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';
import { ApolloError } from '@apollo/client';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import ImageUploader from '../../inputs/ImageUploader';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { PageBlock } from '../../common/PageBlock';

import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';
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
import { UPDATE_ORGANIZATION_LOGO } from '../../../queries/updateOrganization';
import { UPDATE_USER_ORGANIZATION_ID } from '../../../queries/updateUser';
import CreatableTagSelector from '../../inputs/CreatableTagSelector';
import { OrganizationType_enum } from '../../../__generated__/globalTypes';
import { MergeOrganizationsDialog } from './MergeOrganizationsDialog';
import { ApiKeyManager } from './ApiKeyManager';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useTableGrid } from '../../common/TableGrid/hooks';

type ExpandableRowProps = {
  row: OrganizationList_Organization;
  onError: (errorMessage: string) => void;
};

const ExpandableOrganizationRow: React.FC<ExpandableRowProps> = ({ row, onError }): React.ReactElement => {
  const { t } = useTranslation('manageOrganizations');
  const { refetch } = useRoleQuery(ORGANIZATION_LIST);

  // Handle organization alias errors specifically
  const handleAliasError = useCallback(
    (error: ApolloError) => {
      // Check for duplicate alias constraint error
      if (error.message.includes('already exists in organization')) {
        // Extract the alias name and existing organization from the error message
        const match = error.message.match(/Alias "([^"]+)" already exists in organization "([^"]+)"/);
        if (match) {
          const [, aliasName, orgName] = match;
          onError(
            t('error.alias_already_exists', {
              alias: aliasName,
              organization: orgName,
            })
          );
          return;
        }
        onError(t('error.alias_duplicate_error'));
        return;
      }

      // Default error message
      onError(t('error.alias_update_failed'));
    },
    [onError, t]
  );

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
        variant="material"
        label={t('organization.aliases')}
        placeholder={t('input.enter_alias')}
        itemId={row.id}
        values={currentTags}
        options={[]}
        updateValuesMutation={UPDATE_ORGANIZATION_ALIASES}
        onError={handleAliasError}
        refetchQueries={['OrganizationList']}
      />
      <InputField
        variant="material"
        type="input"
        label={t('organization.description')}
        placeholder={t('input.enter_description')}
        itemId={row.id}
        value={row.description || ''}
        updateValueMutation={UPDATE_ORGANIZATION_DESCRIPTION}
        refetchQueries={['OrganizationList']}
      />
      <div className="mt-6">
        <ImageUploader
          variant="material"
          element="organizationLogo"
          label={t('organization.logo')}
          identifierVariables={{ organizationId: row.id }}
          currentFile={row.logo}
          updateFileMutation={UPDATE_ORGANIZATION_LOGO}
          onFileUpdated={() => {
            // Refetch the organization list to show updated logo
            refetch();
          }}
          acceptedFileTypes="image/*"
          maxFileSize={2 * 1024 * 1024} // 2MB for logos
        />
      </div>
      <ApiKeyManager organization={row} onError={onError} />
    </div>
  );
};

const ManageOrganizationsContent: FC = () => {
  const { t } = useTranslation('manageOrganizations');
  const [error, setError] = useState<string | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedRowsForBulkAction, setSelectedRowsForBulkAction] = useState<OrganizationList_Organization[]>([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when page size changes
  };

  const {
    data,
    loading,
    error: queryError,
    pageIndex,
    setPageIndex,
    searchFilter,
    setSearchFilter,
    refetch: debouncedRefetch,
  } = useTableGrid({
    queryHook: useRoleQuery,
    query: ORGANIZATION_LIST,
    pageSize: pageSize,
    refetchFilter: (searchFilter) => ({
      filter: {
        _or: [
          { name: { _ilike: `%${searchFilter}%` } },
          { description: { _ilike: `%${searchFilter}%` } },
          { aliases: { _contains: searchFilter } },
        ],
      },
    }),
  });

  const [insertOrganization] = useRoleMutation<InsertOrganization, InsertOrganizationVariables>(INSERT_ORGANIZATION);
  const [deleteOrganization] = useRoleMutation(DELETE_ORGANIZATION);
  const [updateOrganizationAliases] = useRoleMutation(UPDATE_ORGANIZATION_ALIASES);
  const [updateOrganizationType] = useRoleMutation(UPDATE_ORGANIZATION_TYPE);
  const [updateUserOrganizationId] = useRoleMutation(UPDATE_USER_ORGANIZATION_ID);

  const organizationTypes = useMemo(
    () =>
      data?.OrganizationType?.map((type) => ({ value: type.value, label: t(`type_selection.${type.value}`) })) || [],
    [data, t]
  );

  const columns = useMemo<ColumnDef<OrganizationList_Organization>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('organization.name'),
        enableSorting: true,
        meta: { width: 3 },
        cell: ({ getValue, row }) => (
          <InputField
            variant="material"
            type="input"
            placeholder={t('input.enter_name')}
            itemId={row.original.id}
            value={getValue<string>()}
            updateValueMutation={UPDATE_ORGANIZATION_NAME}
            refetchQueries={['OrganizationList']}
          />
        ),
      },
      {
        accessorKey: 'type',
        header: t('organization.type'),
        meta: { width: 3 },
        cell: ({ getValue, row }) => (
          <DropDownSelector
            variant="material"
            identifierVariables={{ id: row.original.id }}
            value={getValue<string>()}
            options={organizationTypes}
            updateValueMutation={UPDATE_ORGANIZATION_TYPE}
            refetchQueries={['OrganizationList']}
          />
        ),
      },
      {
        id: 'userCount',
        accessorFn: (row) => row.Users?.length ?? 0,
        header: t('organization.user_count'),
        enableSorting: true,
        meta: { width: 2 },
        cell: ({ getValue }) => <div className="px-4 py-2">{getValue<number>()}</div>,
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
            type: organizationTypes[0].value as OrganizationType_enum,
            description: t('organization.default_description'),
          },
        },
      });
      debouncedRefetch();
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
  }, [insertOrganization, t, organizationTypes, debouncedRefetch]);

  const generateDeletionConfirmation = useCallback(
    (row: OrganizationList_Organization) => {
      return t('action.delete_confirmation', { name: row.name });
    },
    [t]
  );

  const bulkActions = useMemo(
    () => [
      { value: 'delete', label: t('bulk_action.delete.label') },
      { value: 'merge', label: t('bulk_action.merge.label') },
    ],
    [t]
  );

  const handleBulkAction = useCallback((action: string, selectedRows: OrganizationList_Organization[]) => {
    if (selectedRows.length === 0) return;

    if (action === 'delete') {
      setBulkActionDialogOpen(true);
      setSelectedRowsForBulkAction(selectedRows);
    } else if (action === 'merge') {
      setMergeDialogOpen(true);
      setSelectedRowsForBulkAction(selectedRows);
    }
  }, []);

  const handleMergeConfirmation = useCallback(
    async (targetOrgId: string, targetOrg: OrganizationList_Organization) => {
      setMergeDialogOpen(false);
      try {
        const targetOrgExistingAliases = targetOrg?.aliases || [];
        const orgsToMerge = selectedRowsForBulkAction.filter((org) => org.id !== parseInt(targetOrgId, 10));

        // Check if any organization being merged is a university
        const hasUniversityType =
          orgsToMerge.some((org) => org.type === 'UNIVERSITY') || targetOrg.type === 'UNIVERSITY';

        // Get all aliases from selected organizations and their names
        const aliasesToMerge = orgsToMerge.flatMap((org) => {
          const orgAliases = Array.isArray(org.aliases)
            ? org.aliases
                .filter((alias) => alias != null)
                .map((alias) => {
                  if (typeof alias === 'string') return alias;
                  if (typeof alias === 'object' && alias !== null && 'name' in alias) return alias.name;
                  return null;
                })
                .filter((alias): alias is string => alias !== null)
            : [];

          return [...orgAliases, org.name];
        });

        // Combine existing target aliases with new aliases, removing duplicates
        const combinedAliases = Array.from(new Set([...targetOrgExistingAliases, ...aliasesToMerge]));

        // Prepare updates - aliases first
        await updateOrganizationAliases({
          variables: {
            id: parseInt(targetOrgId, 10),
            tags: combinedAliases,
          },
        });

        // Update organization type to UNIVERSITY if any merged org is a university and target isn't already
        if (hasUniversityType && targetOrg.type !== 'UNIVERSITY') {
          await updateOrganizationType({
            variables: {
              id: parseInt(targetOrgId, 10),
              value: 'UNIVERSITY',
            },
          });
        }

        // Update all users to the new organization
        await Promise.all(
          orgsToMerge.flatMap((org) =>
            (org.Users || []).map((user) =>
              updateUserOrganizationId({
                variables: {
                  userId: user.id,
                  value: parseInt(targetOrgId, 10),
                },
              })
            )
          )
        );

        // Delete all selected organizations except the target one
        await Promise.all(orgsToMerge.map((org) => deleteOrganization({ variables: { id: org.id } })));

        // Show success notification
        setError(null);
        debouncedRefetch();

        // Optional: Show success message
        console.log(`Successfully merged ${orgsToMerge.length} organizations into ${targetOrg.name}`);
      } catch (error) {
        console.error('Error merging organizations:', error);
        if (error instanceof ApolloError) {
          setError(t('error.merge_failed') + ': ' + error.message);
        } else {
          setError(t('error.merge_failed'));
        }
      }
      setSelectedRowsForBulkAction([]);
    },
    [
      selectedRowsForBulkAction,
      deleteOrganization,
      updateOrganizationAliases,
      updateOrganizationType,
      updateUserOrganizationId,
      debouncedRefetch,
      t,
    ]
  );

  const handleCloseErrorDialog = () => {
    setError(null);
  };

  const handleBulkActionConfirmation = useCallback(async () => {
    setBulkActionDialogOpen(false);
    try {
      await Promise.all(selectedRowsForBulkAction.map((org) => deleteOrganization({ variables: { id: org.id } })));
      debouncedRefetch();
    } catch (error) {
      console.error('Error deleting organizations:', error);
      if (error instanceof ApolloError) {
        setError(t('error.bulk_delete_failed') + ': ' + error.message);
      } else {
        setError(t('error.bulk_delete_failed'));
      }
    }
    setSelectedRowsForBulkAction([]);
  }, [selectedRowsForBulkAction, deleteOrganization, debouncedRefetch, t]);

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        {loading && <Loading />}
        {!loading && (
          <div>
            <CommonPageHeader headline={t('headline')} />
            <TableGrid
              columns={columns}
              data={data?.Organization || []}
              totalCount={data?.Organization_aggregate?.aggregate?.count || 0}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              deleteMutation={DELETE_ORGANIZATION}
              error={queryError}
              loading={loading}
              refetchQueries={['OrganizationList']}
              bulkActions={bulkActions}
              onBulkAction={handleBulkAction}
              generateDeletionConfirmationQuestion={generateDeletionConfirmation}
              expandableRowComponent={({ row }) => <ExpandableOrganizationRow row={row} onError={setError} />}
              onAddButtonClick={onAddOrganizationClick}
              addButtonText={t('action.add')}
            />
            <ErrorMessageDialog errorMessage={error || ''} open={!!error} onClose={handleCloseErrorDialog} />
            <QuestionConfirmationDialog
              open={bulkActionDialogOpen}
              question={t('bulk_action.delete.description', {
                count: selectedRowsForBulkAction.length,
              })}
              onConfirm={handleBulkActionConfirmation}
              onClose={() => {
                setBulkActionDialogOpen(false);
                setSelectedRowsForBulkAction([]);
              }}
            />
            <MergeOrganizationsDialog
              open={mergeDialogOpen}
              onClose={() => {
                setMergeDialogOpen(false);
                setSelectedRowsForBulkAction([]);
              }}
              onConfirm={handleMergeConfirmation}
              selectedOrganizations={selectedRowsForBulkAction}
            />
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default React.memo(ManageOrganizationsContent);

import React, { FC, useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { ApolloError } from '@apollo/client';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import ImageUploader from '../../inputs/ImageUploader';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import { useRoleQuery, useLazyRoleQuery } from '../../../hooks/authedQuery';
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
  UPDATE_ORGANIZATION_API_KEY_HASH,
  UPDATE_ORGANIZATION_GHOST_NEWSLETTER_API_URL,
  UPDATE_ORGANIZATION_GHOST_NEWSLETTER_LIST_ID,
  UPDATE_ORGANIZATION_GHOST_NEWSLETTER_SLUG,
  UPDATE_ORGANIZATION_GHOST_NEWSLETTER_LABEL,
  UPDATE_ORGANIZATION_GHOST_NEWSLETTER_DOUBLE_OPT_IN_ENABLED,
  UPDATE_ORGANIZATION_NEWSLETTER_DESCRIPTION,
  UPDATE_ORGANIZATION_NEWSLETTER_PROVIDER,
} from '../../../queries/organization';
import { UPDATE_ORGANIZATION_LOGO } from '../../../queries/updateOrganization';
import { UPDATE_USER_ORGANIZATION_ID } from '../../../queries/updateUser';
import {
  UPDATE_ORGANIZATION_ADMIN_ORGANIZATION_ID,
  DELETE_ORGANIZATION_ADMIN,
  ORGANIZATION_ADMINS_BY_ORGANIZATION_ID,
} from '../../../queries/organizationAdmin';
import {
  buildExistingAliasesSet,
  normalizeAndFilterAliases,
  combineAliases,
} from '../../../helpers/aliasUtils';
import CreatableTagSelector from '../../inputs/CreatableTagSelector';
import { OrganizationType_enum } from '../../../__generated__/globalTypes';
import { MergeOrganizationsDialog } from './MergeOrganizationsDialog';
import { ApiKeyManager } from './ApiKeyManager';
import { GhostNewsletterCredentialManager } from './GhostNewsletterCredentialManager';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';

type ExpandableRowProps = {
  row: OrganizationList_Organization;
  onError: (errorMessage: string) => void;
};

const ExpandableOrganizationRow: React.FC<ExpandableRowProps> = ({ row, onError }): React.ReactElement<any> => {
  const t = useTranslations('manageOrganizations');
  const { refetch } = useRoleQuery(ORGANIZATION_LIST);
  const [updateOrganizationNewsletterProvider] = useRoleMutation(UPDATE_ORGANIZATION_NEWSLETTER_PROVIDER, {
    refetchQueries: ['OrganizationList'],
  });

  const syncGhostNewsletterProvider = useCallback(async () => {
    await updateOrganizationNewsletterProvider({
      variables: { id: row.id, value: 'GHOST' },
    });
  }, [row.id, updateOrganizationNewsletterProvider]);

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
    <div className="font-medium bg-fill-primary text-label-primary light p-4">
      <CreatableTagSelector
        variant="material"
        label={t('organization.aliases')}
        placeholder={t('input.enter_alias')}
        itemId={row.id}
        values={currentTags}
        options={[]}
        helpText={t('help.aliases')}
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
        helpText={t('help.description')}
        updateValueMutation={UPDATE_ORGANIZATION_DESCRIPTION}
        refetchQueries={['OrganizationList']}
      />
      <div className="mt-4 rounded-lg border border-border-primary/30 p-3">
        <p className="text-sm font-semibold mb-2">{t('organization.newsletter_title')}</p>
        <InputField
          variant="material"
          type="input"
          label={t('organization.newsletter_description')}
          placeholder={t('organization.newsletter_description_placeholder')}
          itemId={row.id}
          value={row.newsletterDescription || ''}
          helpText={t('help.newsletter_description')}
          updateValueMutation={UPDATE_ORGANIZATION_NEWSLETTER_DESCRIPTION}
          refetchQueries={['OrganizationList']}
          showCharacterCount={false}
        />
        <InputField
          variant="material"
          type="input"
          label={t('organization.newsletter_api_url')}
          placeholder={t('organization.newsletter_api_url_placeholder')}
          itemId={row.id}
          value={row.ghostNewsletterApiUrl || ''}
          helpText={t('help.newsletter_api_url')}
          updateValueMutation={UPDATE_ORGANIZATION_GHOST_NEWSLETTER_API_URL}
          refetchQueries={['OrganizationList']}
          showCharacterCount={false}
          onValueUpdated={() => {
            void syncGhostNewsletterProvider();
          }}
        />
        <GhostNewsletterCredentialManager
          organizationId={row.id}
          initiallyConfigured={Boolean(row.Settings?.ghostNewsletterApiKeyConfigured)}
          onCredentialSaved={() => {
            void syncGhostNewsletterProvider();
          }}
        />
        <InputField
          variant="material"
          type="input"
          label={t('organization.newsletter_list_id')}
          placeholder={t('organization.newsletter_list_id_placeholder')}
          itemId={row.id}
          value={row.ghostNewsletterListId || ''}
          helpText={t('help.newsletter_list_id')}
          updateValueMutation={UPDATE_ORGANIZATION_GHOST_NEWSLETTER_LIST_ID}
          refetchQueries={['OrganizationList']}
          showCharacterCount={false}
          onValueUpdated={() => {
            void syncGhostNewsletterProvider();
          }}
        />
        <InputField
          variant="material"
          type="input"
          label={t('organization.newsletter_slug')}
          placeholder={t('organization.newsletter_slug_placeholder')}
          itemId={row.id}
          value={row.ghostNewsletterSlug || ''}
          helpText={t('help.newsletter_slug')}
          updateValueMutation={UPDATE_ORGANIZATION_GHOST_NEWSLETTER_SLUG}
          refetchQueries={['OrganizationList']}
          showCharacterCount={false}
          onValueUpdated={() => {
            void syncGhostNewsletterProvider();
          }}
        />
        <InputField
          variant="material"
          type="input"
          label={t('organization.newsletter_label')}
          placeholder={t('organization.newsletter_label_placeholder')}
          itemId={row.id}
          value={row.ghostNewsletterLabel || ''}
          helpText={t('help.newsletter_label')}
          updateValueMutation={UPDATE_ORGANIZATION_GHOST_NEWSLETTER_LABEL}
          refetchQueries={['OrganizationList']}
          showCharacterCount={false}
          onValueUpdated={() => {
            void syncGhostNewsletterProvider();
          }}
        />
        <CheckboxSelector
          variant="material"
          label={t('organization.newsletter_double_opt_in')}
          helpText={t('help.newsletter_double_opt_in')}
          checked={Boolean(row.ghostNewsletterDoubleOptInEnabled)}
          updateValueMutation={UPDATE_ORGANIZATION_GHOST_NEWSLETTER_DOUBLE_OPT_IN_ENABLED}
          identifierVariables={{ id: row.id }}
          refetchQueries={['OrganizationList']}
          className="mt-2"
          onValueUpdated={() => {
            void syncGhostNewsletterProvider();
          }}
        />
      </div>
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

type ManageOrganizationsContentProps = {
  /** When true, rendered inside SettingsLayout (no PageBlock / page header). */
  inSettingsLayout?: boolean;
};

const ManageOrganizationsContent: FC<ManageOrganizationsContentProps> = ({
  inSettingsLayout = false,
}) => {
  const t = useTranslations('manageOrganizations');
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
    sorting,
    setSorting,
  } = useTableGrid({
    queryHook: useRoleQuery,
    query: ORGANIZATION_LIST,
    pageSize: pageSize,
    refetchFilter: (searchFilter) => {
      const searchCondition = createMultiWordSearchCondition(searchFilter, ['name', 'description', 'aliases'], {
        arrayFields: ['aliases'],
      });
      return {
        filter: searchCondition,
      };
    },
    sortColumnMapper: (columnId) => {
      // Map column accessorKey to GraphQL field names
      switch (columnId) {
        case 'name':
          return 'name';
        case 'type':
          return 'type';
        case 'userCount':
          // Return nested structure for aggregate field sorting
          // The null placeholder will be replaced with 'asc' or 'desc' by convertSortingToOrderBy
          return { Users_aggregate: { count: null } };
        default:
          return columnId;
      }
    },
  });

  const [insertOrganization] = useRoleMutation<InsertOrganization, InsertOrganizationVariables>(INSERT_ORGANIZATION);
  const [deleteOrganization] = useRoleMutation(DELETE_ORGANIZATION);
  const [updateOrganizationAliases] = useRoleMutation(UPDATE_ORGANIZATION_ALIASES);
  const [updateOrganizationType] = useRoleMutation(UPDATE_ORGANIZATION_TYPE);
  const [updateUserOrganizationId] = useRoleMutation(UPDATE_USER_ORGANIZATION_ID);
  const [updateOrganizationApiKeyHash] = useRoleMutation(UPDATE_ORGANIZATION_API_KEY_HASH);
  const [updateOrganizationAdminOrganizationId] = useRoleMutation(UPDATE_ORGANIZATION_ADMIN_ORGANIZATION_ID);
  const [deleteOrganizationAdmin] = useRoleMutation(DELETE_ORGANIZATION_ADMIN);
  const [fetchOrganizationAdmins] = useLazyRoleQuery(ORGANIZATION_ADMINS_BY_ORGANIZATION_ID);

  const organizationTypes = useMemo(
    () =>
      data?.OrganizationType?.map((type: { value: string }) => ({ value: type.value, label: t(`type_selection.${type.value}`) })) || [],
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
            helpText={t('help.name')}
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
            helpText={t('help.type')}
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
        const orgsToMerge = selectedRowsForBulkAction.filter((org) => org.id !== parseInt(targetOrgId, 10));

        // Build set of organization IDs being merged (for conflict checking)
        const orgIdsBeingMerged = new Set([parseInt(targetOrgId, 10), ...orgsToMerge.map((org) => org.id)]);
        
        // Build set of aliases that already exist in other organizations (not being merged)
        const allOrgs = data?.Organization || [];
        const existingAliasesInOtherOrgs = buildExistingAliasesSet(allOrgs, orgIdsBeingMerged);

        // Normalize target organization aliases (excluding conflicts)
        const targetOrgExistingAliases = normalizeAndFilterAliases(targetOrg, existingAliasesInOtherOrgs);

        // Check if any organization being merged is a university
        const hasUniversityType =
          orgsToMerge.some((org) => org.type === 'UNIVERSITY') || targetOrg.type === 'UNIVERSITY';

        // Normalize aliases from organizations being merged (including their names, excluding conflicts)
        const aliasesToMerge = orgsToMerge.flatMap((org) =>
          normalizeAndFilterAliases(org, existingAliasesInOtherOrgs, [org.name])
        );

        // Combine normalized target aliases with new aliases, removing duplicates
        const safeAliases = combineAliases(targetOrgExistingAliases, aliasesToMerge, existingAliasesInOtherOrgs);

        // Before updating target aliases, clear aliases from organizations being merged
        // This frees up the aliases so they can be assigned to the target without conflicts
        try {
          await Promise.all(
            orgsToMerge.map(async (org) => {
              // Clear aliases from this organization to free them up
              await updateOrganizationAliases({
                variables: {
                  id: org.id,
                  tags: [],
                },
              });
            })
          );
        } catch (clearError) {
          console.error('Error clearing aliases from merged organizations:', clearError);
          // Continue anyway - this is just to free up aliases, not critical
        }

        // Check for API keys - if target doesn't have one but a merged org does, transfer it
        // Settings is null for an admin without canManageSettings, who then sees no key to transfer.
        const orgsWithApiKeys = orgsToMerge.filter(
          (org) => org.Settings?.apiKeyHash != null && org.Settings.apiKeyHash !== ''
        );
        const targetHasApiKey = targetOrg.Settings?.apiKeyHash != null && targetOrg.Settings.apiKeyHash !== '';
        const shouldTransferApiKey = !targetHasApiKey && orgsWithApiKeys.length === 1;

        // Prepare updates - aliases first
        try {
          await updateOrganizationAliases({
            variables: {
              id: parseInt(targetOrgId, 10),
              tags: safeAliases,
            },
          });
        } catch (aliasError) {
          console.error('Error updating aliases:', aliasError);
          throw new Error(`Failed to update aliases: ${aliasError instanceof Error ? aliasError.message : String(aliasError)}`);
        }

        // Transfer API key if needed (target doesn't have one, exactly one merged org has one)
        if (shouldTransferApiKey) {
          try {
            await updateOrganizationApiKeyHash({
              variables: {
                id: parseInt(targetOrgId, 10),
                apiKeyHash: orgsWithApiKeys[0].Settings?.apiKeyHash,
              },
            });
          } catch (apiKeyError) {
            console.error('Error transferring API key:', apiKeyError);
            throw new Error(`Failed to transfer API key: ${apiKeyError instanceof Error ? apiKeyError.message : String(apiKeyError)}`);
          }
        }

        // Update organization type to UNIVERSITY if any merged org is a university and target isn't already
        if (hasUniversityType && targetOrg.type !== 'UNIVERSITY') {
          try {
            await updateOrganizationType({
              variables: {
                id: parseInt(targetOrgId, 10),
                value: 'UNIVERSITY',
              },
            });
          } catch (typeError) {
            console.error('Error updating organization type:', typeError);
            throw new Error(`Failed to update organization type: ${typeError instanceof Error ? typeError.message : String(typeError)}`);
          }
        }

        // Update all users to the new organization
        try {
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
        } catch (userError) {
          console.error('Error updating users:', userError);
          throw new Error(`Failed to update users: ${userError instanceof Error ? userError.message : String(userError)}`);
        }

        // Get IDs of organizations being merged
        const orgsToMergeIds = orgsToMerge.map((org) => org.id);

        // Query OrganizationAdmins that reference organizations being merged
        if (orgsToMergeIds.length > 0) {
          const organizationAdminsResult = await fetchOrganizationAdmins({
            variables: {
              organizationIds: orgsToMergeIds,
            },
          });

          // Check for query errors
          if (organizationAdminsResult.error) {
            throw new Error(`Failed to fetch OrganizationAdmins: ${organizationAdminsResult.error.message}`);
          }

          // Query target organization's admins to check for duplicates
          const targetOrgAdminsResult = await fetchOrganizationAdmins({
            variables: {
              organizationIds: [parseInt(targetOrgId, 10)],
            },
          });

          // Check for query errors
          if (targetOrgAdminsResult.error) {
            throw new Error(`Failed to fetch target organization admins: ${targetOrgAdminsResult.error.message}`);
          }

          const targetOrgAdminUserIds = new Set(
            targetOrgAdminsResult.data?.OrganizationAdmin?.map((admin: any) => admin.userId) || []
          );

          // Track userIds we've already processed to avoid duplicates within the merge set
          const processedUserIds = new Set<string>();

          // Update or delete OrganizationAdmins
          // Process sequentially to avoid unique constraint violations when multiple admins have the same userId
          if (organizationAdminsResult.data?.OrganizationAdmin && organizationAdminsResult.data.OrganizationAdmin.length > 0) {
            try {
              for (const admin of organizationAdminsResult.data.OrganizationAdmin) {
                try {
                  // If user is already admin of target org OR we've already processed this userId, delete the duplicate
                  // Otherwise, update to point to target organization
                  if (targetOrgAdminUserIds.has(admin.userId) || processedUserIds.has(admin.userId)) {
                    await deleteOrganizationAdmin({
                      variables: {
                        id: admin.id,
                      },
                    });
                  } else {
                    processedUserIds.add(admin.userId);
                    await updateOrganizationAdminOrganizationId({
                      variables: {
                        id: admin.id,
                        organizationId: parseInt(targetOrgId, 10),
                      },
                    });
                  }
                } catch (adminOpError) {
                  console.error(`Error processing OrganizationAdmin ${admin.id}:`, adminOpError);
                  throw adminOpError;
                }
              }
            } catch (adminError) {
              console.error('Error updating OrganizationAdmins:', adminError);
              throw new Error(`Failed to update OrganizationAdmins: ${adminError instanceof Error ? adminError.message : String(adminError)}`);
            }
          }
        }

        // Delete all selected organizations except the target one
        try {
          await Promise.all(orgsToMerge.map((org) => deleteOrganization({ variables: { id: org.id } })));
        } catch (deleteError) {
          console.error('Error deleting organizations:', deleteError);
          throw new Error(`Failed to delete organizations: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
        }

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
      data?.Organization,
      updateOrganizationAdminOrganizationId,
      deleteOrganizationAdmin,
      fetchOrganizationAdmins,
      updateOrganizationApiKeyHash,
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

  const table = (
    <>
      {loading && <Loading />}
      {!loading && (
        <div>
          {!inSettingsLayout && <CommonPageHeader headline={t('headline')} />}
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
            sorting={sorting}
            onSortingChange={setSorting}
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
    </>
  );

  if (inSettingsLayout) {
    return table;
  }

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">{table}</div>
    </PageBlock>
  );
};

export default React.memo(ManageOrganizationsContent);

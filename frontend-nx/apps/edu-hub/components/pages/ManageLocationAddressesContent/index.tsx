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
import { useAdminQuery, useAdminLazyQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { PageBlock } from '../../common/PageBlock';

import {
  LOCATION_ADDRESS_LIST,
  INSERT_LOCATION_ADDRESS,
  UPDATE_LOCATION_ADDRESS_SHORT_LABEL,
  UPDATE_LOCATION_ADDRESS_ADDRESS,
  UPDATE_LOCATION_ADDRESS_DESCRIPTION,
  UPDATE_LOCATION_ADDRESS_ALIASES,
  UPDATE_LOCATION_ADDRESS_LOCATION_OPTION,
  DELETE_LOCATION_ADDRESS,
  SESSION_ADDRESSES_BY_LOCATION_ADDRESS_ID,
  COURSE_LOCATIONS_BY_DEFAULT_SESSION_ADDRESS_ID,
} from '../../../queries/locationAddress';
import { UPDATE_SESSION_ADDRESS_LOCATION, UPDATE_COURSE_DEFAULT_SESSION_ADDRESS_ID } from '../../../queries/course';
import { MergeLocationAddressesDialog } from './MergeLocationAddressesDialog';
import CreatableTagSelector from '../../inputs/CreatableTagSelector';
import CommonPageHeader from '../../common/CommonPageHeader';
import {
  buildExistingAliasesSet,
  normalizeAndFilterAliases,
  combineAliases,
} from '../../../helpers/aliasUtils';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import { LocationOption_enum } from '../../../__generated__/globalTypes';
import {
  LocationAddressList_LocationAddress,
  LocationAddressList_LocationOption,
} from '../../../queries/__generated__/LocationAddressList';

type LocationAddressListLocationAddress = LocationAddressList_LocationAddress;
type LocationOption = LocationAddressList_LocationOption;

type ExpandableRowProps = {
  row: LocationAddressListLocationAddress;
  onError: (errorMessage: string) => void;
};

const ExpandableLocationAddressRow: React.FC<ExpandableRowProps> = ({ row, onError }): React.ReactElement<any> => {
  const t = useTranslations('manageLocationAddresses');

  // Handle location address alias errors specifically
  const handleAliasError = useCallback(
    (error: ApolloError) => {
      // Check for duplicate alias constraint error
      if (error.message.includes('already exists in location address')) {
        const match = error.message.match(/Alias "([^"]+)" already exists in location address "([^"]+)"/);
        if (match) {
          const [, aliasName, addressName] = match;
          onError(
            t('error.alias_already_exists', {
              alias: aliasName,
              address: addressName,
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
          if (typeof alias === 'object' && alias !== null && 'name' in alias) return (alias as any).name;
          return null;
        })
        .filter((alias) => alias !== null)
    : [];

  return (
    <div className="font-medium bg-fill-primary text-label-primary light p-4">
      <CreatableTagSelector
        variant="material"
        label={t('locationAddress.aliases')}
        placeholder={t('input.enter_alias')}
        helpText={t('help.aliases')}
        itemId={row.id}
        values={currentTags}
        options={[]}
        updateValuesMutation={UPDATE_LOCATION_ADDRESS_ALIASES}
        onError={handleAliasError}
        refetchQueries={['LocationAddressList']}
      />
      <InputField
        variant="material"
        type="input"
        label={t('locationAddress.description')}
        placeholder={t('input.enter_description')}
        helpText={t('help.description')}
        itemId={row.id}
        value={row.description || ''}
        updateValueMutation={UPDATE_LOCATION_ADDRESS_DESCRIPTION}
        refetchQueries={['LocationAddressList']}
      />
    </div>
  );
};

type ManageLocationAddressesContentProps = {
  /** When true, rendered inside SettingsLayout (no PageBlock / page header). */
  inSettingsLayout?: boolean;
};

const ManageLocationAddressesContent: FC<ManageLocationAddressesContentProps> = ({
  inSettingsLayout = false,
}) => {
  const t = useTranslations('manageLocationAddresses');
  const tCommon = useTranslations('common');
  const [error, setError] = useState<string | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedRowsForBulkAction, setSelectedRowsForBulkAction] = useState<LocationAddressListLocationAddress[]>([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);

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
    queryHook: useAdminQuery,
    query: LOCATION_ADDRESS_LIST,
    pageSize: pageSize,
    refetchFilter: (searchFilter) => {
      const searchCondition = createMultiWordSearchCondition(
        searchFilter,
        ['shortLabel', 'address', 'description', 'aliases'],
        {
          arrayFields: ['aliases'],
        }
      );
      return {
        filter: {
          locationOption: { _neq: 'ONLINE' },
          ...searchCondition,
        },
      };
    },
    sortColumnMapper: (columnId) => {
      // Map column accessorKey to GraphQL field names
      switch (columnId) {
        case 'shortLabel':
          return 'shortLabel';
        case 'address':
          return 'address';
        case 'locationOption':
          return 'locationOption';
        case 'usageCount':
          // For usageCount, we can't sort by aggregate directly in Hasura order_by
          // Return null to skip server-side sorting for this column (falls back to client-side if needed)
          return null;
        default:
          return columnId;
      }
    },
  });

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when page size changes
  };

  const [insertLocationAddress] = useAdminMutation(INSERT_LOCATION_ADDRESS);
  const [deleteLocationAddress] = useAdminMutation(DELETE_LOCATION_ADDRESS);
  const [updateLocationAddressAliases] = useAdminMutation(UPDATE_LOCATION_ADDRESS_ALIASES);
  const [updateSessionAddressLocation] = useAdminMutation(UPDATE_SESSION_ADDRESS_LOCATION);
  const [updateCourseDefaultSessionAddressId] = useAdminMutation(UPDATE_COURSE_DEFAULT_SESSION_ADDRESS_ID);
  const [fetchSessionAddresses] = useAdminLazyQuery(SESSION_ADDRESSES_BY_LOCATION_ADDRESS_ID);
  const [fetchCourseLocations] = useAdminLazyQuery(COURSE_LOCATIONS_BY_DEFAULT_SESSION_ADDRESS_ID);

  const locationOptions = useMemo(
    () =>
      data?.LocationOption?.filter((option: LocationOption) => option.value !== 'ONLINE')
        .map((option: LocationOption) => ({
          value: option.value,
          label: tCommon(`location.${option.value}`),
        })) || [],
    [data, tCommon]
  );

  const columns = useMemo<ColumnDef<LocationAddressListLocationAddress>[]>(
    () => [
      {
        accessorKey: 'shortLabel',
        header: t('locationAddress.shortLabel'),
        enableSorting: true,
        meta: { width: 2 },
        cell: ({ getValue, row }) => (
          <InputField
            variant="material"
            type="input"
            placeholder={t('input.enter_short_label')}
            helpText={t('help.short_label')}
            itemId={row.original.id}
            value={getValue<string>()}
            updateValueMutation={UPDATE_LOCATION_ADDRESS_SHORT_LABEL}
            refetchQueries={['LocationAddressList']}
          />
        ),
      },
      {
        accessorKey: 'address',
        header: t('locationAddress.address'),
        enableSorting: true,
        meta: { width: 4 },
        cell: ({ getValue, row }) => (
          <InputField
            variant="material"
            type="textarea"
            placeholder={t('input.enter_address')}
            helpText={t('help.address')}
            itemId={row.original.id}
            value={getValue<string>()}
            updateValueMutation={UPDATE_LOCATION_ADDRESS_ADDRESS}
            refetchQueries={['LocationAddressList']}
          />
        ),
      },
      {
        accessorKey: 'locationOption',
        header: t('locationAddress.locationOption'),
        enableSorting: true,
        meta: { width: 2 },
        cell: ({ getValue, row }) => (
          <DropDownSelector
            variant="material"
            identifierVariables={{ id: row.original.id }}
            value={getValue<string>()}
            options={locationOptions}
            updateValueMutation={UPDATE_LOCATION_ADDRESS_LOCATION_OPTION}
            refetchQueries={['LocationAddressList']}
          />
        ),
      },
      {
        id: 'usageCount',
        accessorFn: (row) => {
          const sessionCount = row.SessionAddresses_aggregate.aggregate?.count || 0;
          const courseLocationCount = row.CourseLocations_aggregate.aggregate?.count || 0;
          return sessionCount + courseLocationCount;
        },
        header: t('locationAddress.usageCount'),
        enableSorting: true,
        meta: { width: 1 },
        cell: ({ getValue }) => <div className="px-4 py-2">{getValue<number>()}</div>,
      },
    ],
    [t, locationOptions]
  );

  const onAddLocationAddressClick = useCallback(async () => {
    try {
      await insertLocationAddress({
        variables: {
          insertInput: {
            shortLabel: t('locationAddress.new_address'),
            address: t('locationAddress.default_address'),
            locationOption: (locationOptions[0]?.value || 'KIEL') as LocationOption_enum,
            description: t('locationAddress.default_description'),
          },
        },
      });
      debouncedRefetch();
    } catch (error) {
      let errorMessage = '';
      if (error instanceof ApolloError) {
        const rawErrorMessage = error.message;
        if (rawErrorMessage.includes('duplicate key value violates unique constraint')) {
          errorMessage = t('error.duplicate_location_address');
        } else {
          errorMessage = rawErrorMessage;
        }
      } else {
        errorMessage = t('error.unexpected');
      }
      setError(errorMessage);
      console.error('Error adding location address:', error);
    }
  }, [insertLocationAddress, t, locationOptions, debouncedRefetch]);

  const generateDeletionConfirmation = useCallback(
    (row: LocationAddressListLocationAddress) => {
      return t('action.delete_confirmation', { name: row.shortLabel });
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

  const handleBulkAction = useCallback((action: string, selectedRows: LocationAddressListLocationAddress[]) => {
    if (selectedRows.length === 0) return;

    if (action === 'delete') {
      setBulkActionDialogOpen(true);
      setSelectedRowsForBulkAction(selectedRows);
    } else if (action === 'merge') {
      setMergeDialogOpen(true);
      setSelectedRowsForBulkAction(selectedRows);
    }
  }, []);

  const handleCloseErrorDialog = () => {
    setError(null);
  };

  const handleMergeConfirmation = useCallback(
    async (targetAddressId: string, targetAddress: LocationAddressListLocationAddress) => {
      setMergeDialogOpen(false);
      try {
        const addressesToMerge = selectedRowsForBulkAction.filter(
          (addr) => addr.id !== parseInt(targetAddressId, 10)
        );

        // Build set of address IDs being merged (for conflict checking)
        const addressIdsBeingMerged = new Set([
          parseInt(targetAddressId, 10),
          ...addressesToMerge.map((addr) => addr.id),
        ]);

        // Build set of aliases that already exist in other addresses (not being merged)
        const allAddresses = data?.LocationAddress || [];
        const existingAliasesInOtherAddresses = buildExistingAliasesSet(
          allAddresses,
          addressIdsBeingMerged
        );

        // Normalize target address aliases (excluding conflicts)
        const targetAddressExistingAliases = normalizeAndFilterAliases(
          targetAddress,
          existingAliasesInOtherAddresses
        );

        // Normalize aliases from addresses being merged (including their shortLabels, excluding conflicts)
        const aliasesToMerge = addressesToMerge.flatMap((addr) =>
          normalizeAndFilterAliases(addr, existingAliasesInOtherAddresses, [addr.shortLabel])
        );

        // Combine normalized target aliases with new aliases, removing duplicates
        const combinedAliases = combineAliases(
          targetAddressExistingAliases,
          aliasesToMerge,
          existingAliasesInOtherAddresses
        );

        // Update aliases first
        try {
          await updateLocationAddressAliases({
            variables: {
              id: parseInt(targetAddressId, 10),
              tags: combinedAliases,
            },
          });
        } catch (aliasError) {
          console.error('Error updating aliases:', aliasError);
          throw new Error(`Failed to update aliases: ${aliasError instanceof Error ? aliasError.message : String(aliasError)}`);
        }

        // Get IDs of addresses being merged
        const addressesToMergeIds = addressesToMerge.map((addr) => addr.id);

        // Query SessionAddresses that reference addresses being merged
        if (addressesToMergeIds.length > 0) {
          const sessionAddressesResult = await fetchSessionAddresses({
            variables: {
              locationAddressIds: addressesToMergeIds,
            },
          });

          // Check for query errors
          if (sessionAddressesResult.error) {
            throw new Error(`Failed to fetch SessionAddresses: ${sessionAddressesResult.error.message}`);
          }

          // Update SessionAddresses to point to target address
          // Only update SessionAddresses where the CourseLocation's locationOption matches the target address's locationOption
          if (sessionAddressesResult.data?.SessionAddress && sessionAddressesResult.data.SessionAddress.length > 0) {
            try {
              const targetLocationOption = targetAddress.locationOption;
              const sessionAddressesToUpdate = sessionAddressesResult.data.SessionAddress.filter(
                (sessionAddr: any) =>
                  sessionAddr.CourseLocation?.locationOption === targetLocationOption
              );

              if (sessionAddressesToUpdate.length > 0) {
                await Promise.all(
                  sessionAddressesToUpdate.map((sessionAddr: any) =>
                    updateSessionAddressLocation({
                      variables: {
                        itemId: sessionAddr.id,
                        locationAddressId: parseInt(targetAddressId, 10),
                      },
                    })
                  )
                );
              }

              // For SessionAddresses with mismatched locationOptions, set locationAddressId to null
              const sessionAddressesToNullify = sessionAddressesResult.data.SessionAddress.filter(
                (sessionAddr: any) =>
                  sessionAddr.CourseLocation?.locationOption !== targetLocationOption
              );

              if (sessionAddressesToNullify.length > 0) {
                await Promise.all(
                  sessionAddressesToNullify.map((sessionAddr: any) =>
                    updateSessionAddressLocation({
                      variables: {
                        itemId: sessionAddr.id,
                        locationAddressId: null,
                      },
                    })
                  )
                );
              }
            } catch (sessionError) {
              console.error('Error updating SessionAddresses:', sessionError);
              throw new Error(`Failed to update SessionAddresses: ${sessionError instanceof Error ? sessionError.message : String(sessionError)}`);
            }
          }

          // Query CourseLocations that reference addresses being merged
          const courseLocationsResult = await fetchCourseLocations({
            variables: {
              locationAddressIds: addressesToMergeIds,
            },
          });

          // Check for query errors
          if (courseLocationsResult.error) {
            throw new Error(`Failed to fetch CourseLocations: ${courseLocationsResult.error.message}`);
          }

          // Update CourseLocations to point to target address
          if (courseLocationsResult.data?.CourseLocation && courseLocationsResult.data.CourseLocation.length > 0) {
            try {
              await Promise.all(
                courseLocationsResult.data.CourseLocation.map((courseLoc: any) =>
                  updateCourseDefaultSessionAddressId({
                    variables: {
                      itemId: courseLoc.id,
                      value: parseInt(targetAddressId, 10),
                    },
                  })
                )
              );
            } catch (courseLocError) {
              console.error('Error updating CourseLocations:', courseLocError);
              throw new Error(`Failed to update CourseLocations: ${courseLocError instanceof Error ? courseLocError.message : String(courseLocError)}`);
            }
          }
        }

        // Delete all selected addresses except the target one
        try {
          await Promise.all(addressesToMerge.map((addr) => deleteLocationAddress({ variables: { id: addr.id } })));
        } catch (deleteError) {
          console.error('Error deleting location addresses:', deleteError);
          throw new Error(`Failed to delete location addresses: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
        }

        // Show success notification
        setError(null);
        debouncedRefetch();

        console.log(`Successfully merged ${addressesToMerge.length} location addresses into ${targetAddress.shortLabel}`);
      } catch (error) {
        console.error('Error merging location addresses:', error);
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
      deleteLocationAddress,
      updateLocationAddressAliases,
      updateSessionAddressLocation,
      updateCourseDefaultSessionAddressId,
      fetchSessionAddresses,
      fetchCourseLocations,
      debouncedRefetch,
      data,
      t,
    ]
  );

  const handleBulkActionConfirmation = useCallback(async () => {
    setBulkActionDialogOpen(false);
    try {
      await Promise.all(
        selectedRowsForBulkAction.map((address) => deleteLocationAddress({ variables: { id: address.id } }))
      );
      debouncedRefetch();
    } catch (error) {
      console.error('Error deleting location addresses:', error);
      if (error instanceof ApolloError) {
        setError(t('error.bulk_delete_failed') + ': ' + error.message);
      } else {
        setError(t('error.bulk_delete_failed'));
      }
    }
    setSelectedRowsForBulkAction([]);
  }, [selectedRowsForBulkAction, deleteLocationAddress, debouncedRefetch, t]);

  const table = (
    <>
      {loading && <Loading />}
      {!loading && (
        <div>
          {!inSettingsLayout && <CommonPageHeader headline={t('headline')} />}
          <TableGrid
            columns={columns}
            data={data?.LocationAddress || []}
            totalCount={data?.LocationAddress_aggregate?.aggregate?.count || 0}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            searchFilter={searchFilter}
            onSearchFilterChange={setSearchFilter}
            sorting={sorting}
            onSortingChange={setSorting}
            deleteMutation={DELETE_LOCATION_ADDRESS}
            error={queryError}
            loading={loading}
            refetchQueries={['LocationAddressList']}
            bulkActions={bulkActions}
            onBulkAction={handleBulkAction}
            generateDeletionConfirmationQuestion={generateDeletionConfirmation}
            expandableRowComponent={({ row }) => <ExpandableLocationAddressRow row={row} onError={setError} />}
            onAddButtonClick={onAddLocationAddressClick}
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
          <MergeLocationAddressesDialog
            open={mergeDialogOpen}
            onClose={() => {
              setMergeDialogOpen(false);
              setSelectedRowsForBulkAction([]);
            }}
            onConfirm={handleMergeConfirmation}
            selectedAddresses={selectedRowsForBulkAction}
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

export default React.memo(ManageLocationAddressesContent);

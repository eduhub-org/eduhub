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
import { useRoleQuery } from '../../../hooks/authedQuery';
import { useRoleMutation } from '../../../hooks/authedMutation';
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
} from '../../../queries/locationAddress';
import CreatableTagSelector from '../../inputs/CreatableTagSelector';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { LocationOption_enum } from '../../../__generated__/globalTypes';

// TODO: Replace with actual generated types once GraphQL schema is deployed
type LocationAddressListLocationAddress = {
  id: number;
  locationOptionId: LocationOption_enum;
  shortLabel: string;
  address: string;
  description?: string;
  aliases?: string[] | null;
  created_at: string;
  updated_at: string;
  LocationOption: {
    value: string;
    comment?: string;
  };
  SessionAddresses_aggregate: {
    aggregate: {
      count: number;
    };
  };
};

type LocationOption = {
  value: string;
  comment?: string;
};

type ExpandableRowProps = {
  row: LocationAddressListLocationAddress;
  onError: (errorMessage: string) => void;
};

const ExpandableLocationAddressRow: React.FC<ExpandableRowProps> = ({ row, onError }): React.ReactElement => {
  const { t } = useTranslation('manageLocationAddresses');
  const { refetch } = useRoleQuery(LOCATION_ADDRESS_LIST);

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
    <div className="font-medium bg-edu-course-list p-4">
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

const ManageLocationAddressesContent: FC = () => {
  const { t } = useTranslation('manageLocationAddresses');
  const [error, setError] = useState<string | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedRowsForBulkAction, setSelectedRowsForBulkAction] = useState<LocationAddressListLocationAddress[]>([]);
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
    query: LOCATION_ADDRESS_LIST,
    pageSize: pageSize,
    refetchFilter: (searchFilter) => ({
      filter: {
        _or: [
          { shortLabel: { _ilike: `%${searchFilter}%` } },
          { address: { _ilike: `%${searchFilter}%` } },
          { description: { _ilike: `%${searchFilter}%` } },
          { aliases: { _contains: searchFilter } },
        ],
      },
    }),
  });

  const [insertLocationAddress] = useRoleMutation(INSERT_LOCATION_ADDRESS);
  const [deleteLocationAddress] = useRoleMutation(DELETE_LOCATION_ADDRESS);

  const locationOptions = useMemo(
    () =>
      data?.LocationOption?.map((option: LocationOption) => ({
        value: option.value,
        label: t(`common:location.${option.value}`),
      })) || [],
    [data, t]
  );

  const columns = useMemo<ColumnDef<LocationAddressListLocationAddress>[]>(
    () => [
      {
        accessorKey: 'shortLabel',
        header: t('locationAddress.shortLabel'),
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
        header: t('locationAddress.address_or_link'),
        meta: { width: 4 },
        cell: ({ getValue, row }) => {
          const isOnline = row.original.locationOptionId === 'ONLINE';
          return (
            <InputField
              variant="material"
              type={isOnline ? "input" : "textarea"}
              placeholder={isOnline ? t('input.enter_link') : t('input.enter_address')}
              helpText={isOnline ? t('help.link') : t('help.address')}
              itemId={row.original.id}
              value={getValue<string>()}
              updateValueMutation={UPDATE_LOCATION_ADDRESS_ADDRESS}
              refetchQueries={['LocationAddressList']}
            />
          );
        },
      },
      {
        accessorKey: 'locationOptionId',
        header: t('locationAddress.locationOption'),
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
        accessorFn: (row) => row.SessionAddresses_aggregate.aggregate.count,
        header: t('locationAddress.usageCount'),
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
            locationOptionId: (locationOptions[0]?.value || 'KIEL') as LocationOption_enum,
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
    () => [{ value: 'delete', label: t('bulk_action.delete.label') }],
    [t]
  );

  const handleBulkAction = useCallback((action: string, selectedRows: LocationAddressListLocationAddress[]) => {
    if (selectedRows.length === 0) return;

    if (action === 'delete') {
      setBulkActionDialogOpen(true);
      setSelectedRowsForBulkAction(selectedRows);
    }
  }, []);

  const handleCloseErrorDialog = () => {
    setError(null);
  };

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

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        {loading && <Loading />}
        {!loading && (
          <div>
            <CommonPageHeader headline={t('headline')} />
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
          </div>
        )}
      </div>
    </PageBlock>
  );
};

export default React.memo(ManageLocationAddressesContent);

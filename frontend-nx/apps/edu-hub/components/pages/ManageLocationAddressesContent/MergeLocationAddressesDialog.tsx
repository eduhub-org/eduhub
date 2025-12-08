import React, { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import DropDownSelector from '../../inputs/DropDownSelector';
import { BaseDialog } from '../../common/dialogs/BaseDialog';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { LOCATION_ADDRESS_LIST } from '../../../queries/locationAddress';
import { LocationAddressList_LocationAddress } from '../../../queries/__generated__/LocationAddressList';

interface MergeLocationAddressesDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (targetAddressId: string, targetAddress: LocationAddressList_LocationAddress) => void;
  selectedAddresses: LocationAddressList_LocationAddress[];
}

export const MergeLocationAddressesDialog: React.FC<MergeLocationAddressesDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedAddresses = [],
}) => {
  const t = useTranslations('manageLocationAddresses');
  const [selectedTargetAddress, setSelectedTargetAddress] = useState<string>('');

  const { data } = useAdminQuery(LOCATION_ADDRESS_LIST, {
    variables: {
      limit: 10000,
      offset: 0,
      filter: {
        locationOption: { _neq: 'ONLINE' },
      },
      order_by: [{ shortLabel: 'asc' }],
    },
  });

  const addressOptions = data?.LocationAddress?.map((addr) => ({
    value: addr.id.toString(),
    label: addr.shortLabel,
  }));

  const handleValueUpdated = (data: any) => {
    setSelectedTargetAddress(data.value || data);
  };

  // Calculate merge details for preview
  const mergePreview = useMemo(() => {
    if (!selectedTargetAddress || selectedAddresses.length === 0) {
      return null;
    }

    const targetAddr = data?.LocationAddress?.find((addr) => addr.id === parseInt(selectedTargetAddress, 10));
    if (!targetAddr) return null;

    const addressesToMerge = selectedAddresses.filter((addr) => addr.id !== parseInt(selectedTargetAddress, 10));

    // Check if all addresses have the same locationOption
    const targetLocationOption = targetAddr.locationOption;
    const addressesWithDifferentLocation = addressesToMerge.filter(
      (addr) => addr.locationOption !== targetLocationOption
    );

    // Calculate total usage affected
    const totalUsageAffected = addressesToMerge.reduce((sum, addr) => {
      const sessionCount = addr.SessionAddresses_aggregate?.aggregate?.count || 0;
      const courseLocationCount = addr.CourseLocations_aggregate?.aggregate?.count || 0;
      return sum + sessionCount + courseLocationCount;
    }, 0);

    // Get all aliases from addresses being merged
    const aliasesToMerge = addressesToMerge.flatMap((addr) => {
      const addrAliases = Array.isArray(addr.aliases)
        ? addr.aliases
            .filter((alias) => alias != null)
            .map((alias) => {
              if (typeof alias === 'string') return alias;
              if (typeof alias === 'object' && alias !== null && 'name' in alias) return alias.name;
              return null;
            })
            .filter((alias): alias is string => alias !== null)
        : [];

      return [...addrAliases, addr.shortLabel];
    });

    // Get existing target aliases
    const targetAliases = Array.isArray(targetAddr.aliases)
      ? targetAddr.aliases
          .filter((alias) => alias != null)
          .map((alias) => {
            if (typeof alias === 'string') return alias;
            if (typeof alias === 'object' && alias !== null && 'name' in alias) return alias.name;
            return null;
          })
          .filter((alias): alias is string => alias !== null)
      : [];

    // Calculate new aliases (remove duplicates)
    const newAliases = Array.from(new Set([...targetAliases, ...aliasesToMerge]));
    const addedAliases = newAliases.filter((alias) => !targetAliases.includes(alias));

    return {
      targetAddr,
      addressesToMerge,
      totalUsageAffected,
      aliasesToMerge,
      addedAliases,
      totalAddressesToDelete: addressesToMerge.length,
      addressesWithDifferentLocation,
      hasLocationMismatch: addressesWithDifferentLocation.length > 0,
    };
  }, [selectedTargetAddress, selectedAddresses, data]);

  const handleConfirm = () => {
    const targetAddr = data?.LocationAddress?.find((addr) => addr.id === parseInt(selectedTargetAddress, 10));
    if (targetAddr && mergePreview && !mergePreview.hasLocationMismatch) {
      onConfirm(selectedTargetAddress, targetAddr);
    }
  };

  const confirmButtonText = t('bulk_action.merge.confirm_merge');
  const confirmDisabled = !selectedTargetAddress || (mergePreview?.hasLocationMismatch ?? false);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmDisabled={confirmDisabled}
      confirmText={confirmButtonText}
    >
      <div className="space-y-4">
        <div className="text-lg font-medium">{t('bulk_action.merge.title')}</div>

        <div>{t('bulk_action.merge.description')}</div>

        <div className="mt-4">
          <DropDownSelector
            variant="eduhub"
            label={t('bulk_action.merge.select_target.label')}
            placeholder={t('bulk_action.merge.select_target.placeholder')}
            value={selectedTargetAddress}
            options={addressOptions}
            onValueUpdated={handleValueUpdated}
          />
        </div>

        {mergePreview && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-3">{t('bulk_action.merge.preview_title')}</div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">{t('bulk_action.merge.target_address')}:</span>{' '}
                <span className="text-blue-600">{mergePreview.targetAddr.shortLabel}</span>
                <span className="ml-2 text-gray-500">(ID: {mergePreview.targetAddr.id})</span>
              </div>

              <div>
                <span className="font-medium">{t('bulk_action.merge.addresses_to_merge')}:</span>
                <ul className="ml-4 mt-1">
                  {mergePreview.addressesToMerge.map((addr) => {
                    const sessionCount = addr.SessionAddresses_aggregate?.aggregate?.count || 0;
                    const courseLocationCount = addr.CourseLocations_aggregate?.aggregate?.count || 0;
                    const usageCount = sessionCount + courseLocationCount;
                    const locationOption = addr.LocationOption?.value || addr.locationOption;
                    return (
                      <li key={addr.id} className="text-gray-700">
                        • {addr.shortLabel}{' '}
                        <span className="text-gray-500">
                          ({t(`common:location.${locationOption}`)}) ({usageCount} {t('locationAddress.usageCount', { count: usageCount })})
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {mergePreview.totalUsageAffected > 0 && (
                <div>
                  <span className="font-medium">{t('bulk_action.merge.total_usage_affected')}:</span>{' '}
                  <span className="text-orange-600">{mergePreview.totalUsageAffected}</span>
                </div>
              )}

              {mergePreview.addedAliases.length > 0 && (
                <div>
                  <span className="font-medium">{t('bulk_action.merge.aliases_to_add')}:</span>
                  <div className="ml-4 mt-1 flex flex-wrap gap-1">
                    {mergePreview.addedAliases.map((alias, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mergePreview.hasLocationMismatch && (
                <div className="pt-2 mt-3 border-t border-gray-200">
                  <span className="font-medium text-red-600">{t('bulk_action.merge.location_mismatch_warning')}:</span>{' '}
                  {mergePreview.addressesWithDifferentLocation.length === 1
                    ? t('bulk_action.merge.location_mismatch_description_one', {
                        targetLocation: t(`common:location.${mergePreview.targetAddr.locationOption}`),
                      })
                    : t('bulk_action.merge.location_mismatch_description_other', {
                        targetLocation: t(`common:location.${mergePreview.targetAddr.locationOption}`),
                        count: mergePreview.addressesWithDifferentLocation.length,
                      })}
                  <ul className="ml-4 mt-1">
                    {mergePreview.addressesWithDifferentLocation.map((addr) => (
                      <li key={addr.id} className="text-red-600">
                        • {addr.shortLabel} ({t(`common:location.${addr.locationOption}`)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 mt-3 border-t border-gray-200">
                <span className="font-medium text-red-600">{t('bulk_action.merge.deletion_warning')}:</span>{' '}
                {mergePreview.totalAddressesToDelete === 1
                  ? t('bulk_action.merge.addresses_will_be_deleted_one')
                  : t('bulk_action.merge.addresses_will_be_deleted_other', {
                      count: mergePreview.totalAddressesToDelete,
                    })}
              </div>
            </div>
          </div>
        )}

        {selectedAddresses.length === 0 && (
          <div className="text-amber-600 text-sm">{t('bulk_action.merge.no_addresses_selected')}</div>
        )}
      </div>
    </BaseDialog>
  );
};


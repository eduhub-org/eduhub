import React, { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import DropDownSelector from '../../inputs/DropDownSelector';
import { BaseDialog } from '../../common/dialogs/BaseDialog';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { ORGANIZATION_LIST } from '../../../queries/organization';
import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';

interface MergeOrganizationsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (targetOrgId: string, targetOrg: OrganizationList_Organization) => void;
  selectedOrganizations: OrganizationList_Organization[];
}

export const MergeOrganizationsDialog: React.FC<MergeOrganizationsDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedOrganizations = [],
}) => {
  const t = useTranslations('manageOrganizations');
  const [selectedTargetOrg, setSelectedTargetOrg] = useState<string>('');

  const { data } = useRoleQuery(ORGANIZATION_LIST, {
    variables: {
      limit: 10000,
      order_by: [{ name: 'asc' }],
    },
  });

  const organizationOptions = data?.Organization?.map((org) => ({
    value: org.id.toString(),
    label: org.name,
  }));

  const handleValueUpdated = (data: any) => {
    setSelectedTargetOrg(data.value || data);
  };

  // Calculate merge details for preview
  const mergePreview = useMemo(() => {
    if (!selectedTargetOrg || selectedOrganizations.length === 0) {
      return null;
    }

    const targetOrg = data?.Organization?.find((org) => org.id === parseInt(selectedTargetOrg, 10));
    if (!targetOrg) return null;

    const orgsToMerge = selectedOrganizations.filter((org) => org.id !== parseInt(selectedTargetOrg, 10));

    // Count total users affected
    const totalUsersAffected = orgsToMerge.reduce((sum, org) => sum + (org.Users?.length || 0), 0);

    // Get all aliases from organizations being merged
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

    // Get existing target aliases
    const targetAliases = Array.isArray(targetOrg.aliases)
      ? targetOrg.aliases
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

    // Check if target should become university type
    const hasUniversityType = orgsToMerge.some((org) => org.type === 'UNIVERSITY') || targetOrg.type === 'UNIVERSITY';
    const willChangeToUniversity = hasUniversityType && targetOrg.type !== 'UNIVERSITY';

    return {
      targetOrg,
      orgsToMerge,
      totalUsersAffected,
      aliasesToMerge,
      addedAliases,
      willChangeToUniversity,
      totalOrgsToDelete: orgsToMerge.length,
    };
  }, [selectedTargetOrg, selectedOrganizations, data]);

  const handleConfirm = () => {
    const targetOrg = data?.Organization?.find((org) => org.id === parseInt(selectedTargetOrg, 10));
    if (targetOrg) {
      onConfirm(selectedTargetOrg, targetOrg);
    }
  };

  const confirmButtonText = t('bulk_action.merge.confirm_merge');

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmDisabled={!selectedTargetOrg}
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
            value={selectedTargetOrg}
            options={organizationOptions}
            onValueUpdated={handleValueUpdated}
          />
        </div>

        {mergePreview && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-3">{t('bulk_action.merge.preview_title')}</div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">{t('bulk_action.merge.target_organization')}:</span>{' '}
                <span className="text-blue-600">{mergePreview.targetOrg.name}</span>
                <span className="ml-2 text-gray-500">({t(`type_selection.${mergePreview.targetOrg.type}`)})</span>
              </div>

              <div>
                <span className="font-medium">{t('bulk_action.merge.organizations_to_merge')}:</span>
                <ul className="ml-4 mt-1">
                  {mergePreview.orgsToMerge.map((org) => (
                    <li key={org.id} className="text-gray-700">
                      • {org.name}{' '}
                      <span className="text-gray-500">
                        ({org.Users?.length || 0} {t('organization.users')})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {mergePreview.totalUsersAffected > 0 && (
                <div>
                  <span className="font-medium">{t('bulk_action.merge.total_users_affected')}:</span>{' '}
                  <span className="text-orange-600">{mergePreview.totalUsersAffected}</span>
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

              {mergePreview.willChangeToUniversity && (
                <div className="text-amber-600">
                  <span className="font-medium">⚠️ {t('bulk_action.merge.type_change_warning')}:</span>{' '}
                  {t('bulk_action.merge.will_become_university')}
                </div>
              )}

              <div className="pt-2 mt-3 border-t border-gray-200">
                <span className="font-medium text-red-600">{t('bulk_action.merge.deletion_warning')}:</span>{' '}
                {mergePreview.totalOrgsToDelete === 1
                  ? t('bulk_action.merge.organizations_will_be_deleted_one')
                  : t('bulk_action.merge.organizations_will_be_deleted_other', {
                      count: mergePreview.totalOrgsToDelete,
                    })}
              </div>
            </div>
          </div>
        )}

        {selectedOrganizations.length === 0 && (
          <div className="text-amber-600 text-sm">{t('bulk_action.merge.no_organizations_selected')}</div>
        )}
      </div>
    </BaseDialog>
  );
};

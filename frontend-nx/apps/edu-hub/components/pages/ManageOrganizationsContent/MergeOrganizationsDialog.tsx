import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DropDownSelector from '../../inputs/DropDownSelector';
import { DialogShell } from '../../common/dialogs/DialogShell';
import { Button } from '../../common/Button';
import { useRoleQuery, useLazyRoleQuery } from '../../../hooks/authedQuery';
import { ORGANIZATION_LIST } from '../../../queries/organization';
import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';
import { ORGANIZATION_ADMINS_BY_ORGANIZATION_ID } from '../../../queries/organizationAdmin';
import { COURSE_FUNDING_ORGANIZATIONS_BY_ORGANIZATION_ID } from '../../../queries/mutateCourseFundingOrganization';

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
  const [organizationAdmins, setOrganizationAdmins] = useState<any[]>([]);
  const [courseFundingOrgs, setCourseFundingOrgs] = useState<any[]>([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);

  const { data } = useRoleQuery(ORGANIZATION_LIST, {
    variables: {
      limit: 10000,
      order_by: [{ name: 'asc' }],
    },
  });

  const [fetchOrganizationAdmins] = useLazyRoleQuery(ORGANIZATION_ADMINS_BY_ORGANIZATION_ID);
  const [fetchCourseFundingOrgs] = useLazyRoleQuery(COURSE_FUNDING_ORGANIZATIONS_BY_ORGANIZATION_ID);

  // Fetch related data when organizations are selected
  useEffect(() => {
    if (selectedOrganizations.length > 0 && selectedTargetOrg) {
      const orgsToMerge = selectedOrganizations.filter(
        (org: OrganizationList_Organization) => org.id !== parseInt(selectedTargetOrg, 10)
      );
      const orgIds = orgsToMerge.map((org: OrganizationList_Organization) => org.id);

      if (orgIds.length > 0) {
        setLoadingRelatedData(true);
        Promise.all([
          fetchOrganizationAdmins({ variables: { organizationIds: orgIds } }),
          fetchCourseFundingOrgs({ variables: { organizationIds: orgIds } }),
        ])
          .then(([adminsResult, fundingResult]) => {
            setOrganizationAdmins(adminsResult.data?.OrganizationAdmin || []);
            setCourseFundingOrgs(fundingResult.data?.CourseFundingOrganization || []);
            setLoadingRelatedData(false);
          })
          .catch((error) => {
            console.error('Error fetching related data:', error);
            setLoadingRelatedData(false);
          });
      } else {
        setOrganizationAdmins([]);
        setCourseFundingOrgs([]);
      }
    } else {
      setOrganizationAdmins([]);
      setCourseFundingOrgs([]);
    }
  }, [selectedOrganizations, selectedTargetOrg, fetchOrganizationAdmins, fetchCourseFundingOrgs]);

  const organizationOptions = data?.Organization?.map((org: OrganizationList_Organization) => ({
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

    const targetOrg = data?.Organization?.find((org: OrganizationList_Organization) => org.id === parseInt(selectedTargetOrg, 10));
    if (!targetOrg) return null;

    const orgsToMerge = selectedOrganizations.filter((org: OrganizationList_Organization) => org.id !== parseInt(selectedTargetOrg, 10));

    // Count total users affected
    const totalUsersAffected = orgsToMerge.reduce((sum, org) => sum + (org.Users?.length || 0), 0);

    // Get all aliases from organizations being merged
    const aliasesToMerge = orgsToMerge.flatMap((org: OrganizationList_Organization) => {
      const orgAliases = Array.isArray(org.aliases)
        ? org.aliases
            .filter((alias: unknown) => alias != null)
            .map((alias: unknown) => {
              if (typeof alias === 'string') return alias;
              if (typeof alias === 'object' && alias !== null && 'name' in alias) return alias.name;
              return null;
            })
            .filter((alias: unknown): alias is string => alias !== null)
        : [];

      return [...orgAliases, org.name];
    });

    // Get existing target aliases
    const targetAliases = Array.isArray(targetOrg.aliases)
      ? targetOrg.aliases
          .filter((alias: unknown) => alias != null)
          .map((alias: unknown) => {
            if (typeof alias === 'string') return alias;
            if (typeof alias === 'object' && alias !== null && 'name' in alias) return alias.name;
            return null;
          })
          .filter((alias: unknown): alias is string => alias !== null)
      : [];

    // Calculate new aliases (remove duplicates)
    const newAliases = Array.from(new Set([...targetAliases, ...aliasesToMerge]));
    const addedAliases = newAliases.filter((alias) => !targetAliases.includes(alias));

    // Check if target should become university type
    const hasUniversityType = orgsToMerge.some((org) => org.type === 'UNIVERSITY') || targetOrg.type === 'UNIVERSITY';
    const willChangeToUniversity = hasUniversityType && targetOrg.type !== 'UNIVERSITY';

    // Check for API keys - count organizations with apiKeyHash defined
    // Settings is null unless the viewer may manage the organization's settings.
    const orgsWithApiKeys = [
      ...orgsToMerge.filter(
        (org: OrganizationList_Organization) => org.Settings?.apiKeyHash != null && org.Settings.apiKeyHash !== ''
      ),
      ...(targetOrg.Settings?.apiKeyHash != null && targetOrg.Settings.apiKeyHash !== '' ? [targetOrg] : []),
    ];
    const hasMultipleApiKeys = orgsWithApiKeys.length > 1;

    return {
      targetOrg,
      orgsToMerge,
      totalUsersAffected,
      aliasesToMerge,
      addedAliases,
      willChangeToUniversity,
      totalOrgsToDelete: orgsToMerge.length,
      orgsWithApiKeys,
      hasMultipleApiKeys,
    };
  }, [selectedTargetOrg, selectedOrganizations, data]);

  const handleConfirm = () => {
    const targetOrg = data?.Organization?.find((org: OrganizationList_Organization) => org.id === parseInt(selectedTargetOrg, 10));
    if (targetOrg && mergePreview && !mergePreview.hasMultipleApiKeys) {
      onConfirm(selectedTargetOrg, targetOrg);
    }
  };

  const confirmButtonText = t('bulk_action.merge.confirm_merge');
  const confirmDisabled = !selectedTargetOrg || (mergePreview?.hasMultipleApiKeys ?? false);
  const tCommon = useTranslations('common');

  const actions = (
    <div className="grid grid-cols-2 w-full gap-2">
      <div>
        <Button onClick={onClose}>{tCommon('cancel')}</Button>
      </div>
      <div className="flex justify-end">
        <Button filled onClick={handleConfirm} disabled={confirmDisabled}>
          {confirmButtonText}
        </Button>
      </div>
    </div>
  );

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={tCommon('confirmation')}
      actions={actions}
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
              {mergePreview.hasMultipleApiKeys && (
                <div className="pb-2 mb-3 border-b border-red-200">
                  <span className="font-medium text-red-600">{t('bulk_action.merge.api_key_warning')}:</span>{' '}
                  {t('bulk_action.merge.api_key_conflict_description', {
                    count: mergePreview.orgsWithApiKeys.length,
                  })}
                  <ul className="ml-4 mt-1">
                    {mergePreview.orgsWithApiKeys.map((org) => (
                      <li key={org.id} className="text-red-600">
                        • {org.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

              {loadingRelatedData && (
                <div className="text-gray-500 text-sm">{t('bulk_action.merge.loading_related_data')}</div>
              )}

              {!loadingRelatedData && organizationAdmins.length > 0 && (
                <div>
                  <span className="font-medium">{t('bulk_action.merge.organization_admins_affected')}:</span>{' '}
                  <span className="text-orange-600">{organizationAdmins.length}</span>
                  <ul className="ml-4 mt-1 text-xs text-gray-600">
                    {organizationAdmins.slice(0, 5).map((admin: any) => {
                      const userName = admin.User
                        ? `${admin.User.firstName} ${admin.User.lastName}`.trim() || admin.User.email
                        : admin.userId != null
                          ? String(admin.userId).substring(0, 8) + '...'
                          : t('bulk_action.merge.unknown_user') || 'Unknown user';
                      return <li key={admin.id}>• {userName}</li>;
                    })}
                    {organizationAdmins.length > 5 && (
                      <li className="text-gray-500">
                        ... {t('bulk_action.merge.and_more', { count: organizationAdmins.length - 5 })}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {!loadingRelatedData && courseFundingOrgs.length > 0 && (
                <div>
                  <span className="font-medium">{t('bulk_action.merge.funding_organizations_affected')}:</span>{' '}
                  <span className="text-orange-600">{courseFundingOrgs.length}</span>
                  <ul className="ml-4 mt-1 text-xs text-gray-600">
                    {courseFundingOrgs.slice(0, 5).map((funding: any) => (
                      <li key={funding.id}>
                        • {funding.Course?.title || `${t('bulk_action.merge.course_id')} ${funding.courseId}`}
                      </li>
                    ))}
                    {courseFundingOrgs.length > 5 && (
                      <li className="text-gray-500">
                        ... {t('bulk_action.merge.and_more', { count: courseFundingOrgs.length - 5 })}
                      </li>
                    )}
                  </ul>
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
    </DialogShell>
  );
};

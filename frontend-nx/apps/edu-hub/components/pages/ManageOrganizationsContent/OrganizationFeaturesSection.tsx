import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useIsAdmin } from '../../../hooks/authentication';
import {
  DELETE_ORGANIZATION_FEATURE,
  INSERT_ORGANIZATION_FEATURE,
  UPDATE_ORGANIZATION_RAUSGEGANGEN_TEST_MODE,
} from '../../../queries/organization';
import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';
import { OrganizationFeatureOption_enum } from '../../../__generated__/globalTypes';
import { OrganizationCredentialManager } from './OrganizationCredentialManager';

type Props = {
  organization: OrganizationList_Organization;
  /** All features that exist (OrganizationFeatureOption). */
  featureOptions: string[];
};

/**
 * Features a super admin unlocks per organization (nothing is available until
 * activated here), plus the settings of the activated features.
 */
export const OrganizationFeaturesSection: React.FC<Props> = ({ organization, featureOptions }) => {
  const t = useTranslations('manageOrganizations');
  const isAdmin = useIsAdmin();
  const [pendingDeactivation, setPendingDeactivation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutationOptions = { refetchQueries: ['OrganizationList'], awaitRefetchQueries: true };
  const [insertFeature] = useRoleMutation(INSERT_ORGANIZATION_FEATURE, mutationOptions);
  const [deleteFeature] = useRoleMutation(DELETE_ORGANIZATION_FEATURE, mutationOptions);

  if (!isAdmin) return null;

  const activeFeatures = new Set((organization.Features ?? []).map((feature) => feature.feature as string));

  const setFeature = async (feature: string, active: boolean) => {
    const variables = { organizationId: organization.id, feature: feature as OrganizationFeatureOption_enum };
    try {
      await (active ? insertFeature({ variables }) : deleteFeature({ variables }));
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : String(mutationError));
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-border-primary/30 p-3">
      <p className="text-sm font-semibold">{t('features.title')}</p>
      <p className="text-xs text-label-secondary mb-2">{t('features.description')}</p>
      {featureOptions.map((feature) => (
        <CheckboxSelector
          key={feature}
          variant="material"
          label={t(`features.options.${feature}.label`)}
          helpText={t(`features.options.${feature}.help`)}
          checked={activeFeatures.has(feature)}
          onValueUpdated={(active: boolean) => {
            if (active) {
              void setFeature(feature, true);
            } else {
              // Deactivating unpublishes everything the feature put out (e.g. all Rausgegangen events).
              setPendingDeactivation(feature);
            }
          }}
        />
      ))}

      {activeFeatures.has('RAUSGEGANGEN') && (
        <div className="mt-3 border-t border-border-primary/30 pt-3">
          <p className="text-sm font-semibold mb-1">{t('rausgegangen.title')}</p>
          <OrganizationCredentialManager
            organizationId={organization.id}
            endpoint="/api/manage-organizations/rausgegangen-credential"
            translationPrefix="rausgegangen_api_key"
            initiallyConfigured={Boolean(organization.Settings?.rausgegangenApiKeyConfigured)}
          />
          <CheckboxSelector
            variant="material"
            className="mt-2"
            label={t('rausgegangen.test_mode')}
            helpText={t('rausgegangen.test_mode_help')}
            checked={organization.Settings?.rausgegangenTestMode ?? true}
            updateValueMutation={UPDATE_ORGANIZATION_RAUSGEGANGEN_TEST_MODE}
            identifierVariables={{ id: organization.id }}
            refetchQueries={['OrganizationList']}
          />
        </div>
      )}

      <QuestionConfirmationDialog
        open={pendingDeactivation !== null}
        question={pendingDeactivation ? t(`features.options.${pendingDeactivation}.deactivate_confirm`) : ''}
        onClose={() => setPendingDeactivation(null)}
        onConfirm={() => {
          const feature = pendingDeactivation;
          setPendingDeactivation(null);
          if (feature) void setFeature(feature, false);
        }}
      />
      <ErrorMessageDialog errorMessage={error || ''} open={!!error} onClose={() => setError(null)} />
    </div>
  );
};

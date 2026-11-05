import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Close } from '@mui/icons-material';

import { Button } from '../../common/Button';
import { SelectOrganizationDialog } from '../../common/dialogs/SelectOrganizationDialog';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { DEFAULT_ORGANIZATION_ID } from '../../../helpers/homeSliderOrganizations';
import {
  ADMIN_HOME_SLIDER_ORGANIZATIONS,
  DELETE_HOME_SLIDER_ORGANIZATION,
  INSERT_HOME_SLIDER_ORGANIZATION,
} from '../../../queries/homeSliderOrganizations';
import { AdminHomeSliderOrganizations } from '../../../queries/__generated__/AdminHomeSliderOrganizations';
import {
  InsertHomeSliderOrganization,
  InsertHomeSliderOrganizationVariables,
} from '../../../queries/__generated__/InsertHomeSliderOrganization';
import {
  DeleteHomeSliderOrganization,
  DeleteHomeSliderOrganizationVariables,
} from '../../../queries/__generated__/DeleteHomeSliderOrganization';
import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';

const REFETCH = { refetchQueries: ['AdminHomeSliderOrganizations', 'HomeSliderOrganizations'] };

/**
 * Which organizations' programs fill the automatic homepage sliders (Courses, Events, Degrees) and
 * the public event feeds. The default organization is always included; super-admins add others.
 */
const HomeSliderOrganizationsManager: FC = () => {
  const t = useTranslations('manageAppSettings.home_slider_organizations');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const { data, loading, error: queryError } = useAdminQuery<AdminHomeSliderOrganizations>(
    ADMIN_HOME_SLIDER_ORGANIZATIONS
  );
  const rows = data?.HomeSliderOrganization ?? [];

  const [insertRow] = useAdminMutation<InsertHomeSliderOrganization, InsertHomeSliderOrganizationVariables>(
    INSERT_HOME_SLIDER_ORGANIZATION,
    REFETCH
  );
  const [deleteRow] = useAdminMutation<DeleteHomeSliderOrganization, DeleteHomeSliderOrganizationVariables>(
    DELETE_HOME_SLIDER_ORGANIZATION,
    REFETCH
  );

  const handleDialogClose = async (confirmed: boolean, organization: OrganizationList_Organization | null) => {
    setDialogOpen(false);
    if (!confirmed || !organization) return;
    // The default organization is always included, and an organization is only listed once.
    if (organization.id === DEFAULT_ORGANIZATION_ID || rows.some((row) => row.organizationId === organization.id)) {
      return;
    }
    try {
      setError('');
      await insertRow({ variables: { organizationId: organization.id } });
    } catch {
      setError(t('error_add'));
    }
  };

  const handleRemove = async (id: number) => {
    try {
      setError('');
      await deleteRow({ variables: { id } });
    } catch {
      setError(t('error_remove'));
    }
  };

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-label-secondary">{t('label')}</label>
      <p className="text-xs text-label-secondary mb-4">{t('help_text')}</p>

      {queryError ? (
        <p className="text-red-500 text-sm">{t('error_loading')}</p>
      ) : loading ? (
        <p className="text-sm text-label-secondary">{t('loading')}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2 mb-4">
            <li className="rounded-full border-2 border-border-primary px-3 py-1 text-sm text-label-primary">
              {t('default_organization')}
            </li>
            {rows.map((row) => (
              <li
                key={row.id}
                className="inline-flex items-center gap-1 rounded-full border-2 border-brand px-3 py-1 text-sm text-label-primary"
              >
                {row.Organization.name}
                <button
                  type="button"
                  onClick={() => handleRemove(row.id)}
                  aria-label={t('remove', { name: row.Organization.name })}
                  className="text-label-secondary hover:text-label-primary"
                >
                  <Close fontSize="small" />
                </button>
              </li>
            ))}
          </ul>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <Button as="button" type="button" filled inverted onClick={() => setDialogOpen(true)}>
            {t('add_button')}
          </Button>
        </>
      )}

      <SelectOrganizationDialog open={dialogOpen} title={t('dialog_title')} onClose={handleDialogClose} />
    </div>
  );
};

export default HomeSliderOrganizationsManager;

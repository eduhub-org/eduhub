import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, Checkbox, FormControlLabel, TextField } from '@mui/material';
import { useTranslations } from 'next-intl';

import { DialogShell } from '../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { Button } from '../../common/Button';
import InputField from '../../inputs/InputField';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { useManageMutation } from '../../../hooks/authedMutation';
import { useManageRole } from '../../../hooks/authentication';
import {
  INSERT_ORGANIZATION_ADMIN,
  ORGANIZATION_ADMIN_USER_BY_EMAIL,
} from '../../../queries/organizationAdmin';
import {
  InsertOrganizationAdmin,
  InsertOrganizationAdminVariables,
} from '../../../queries/__generated__/InsertOrganizationAdmin';
import {
  OrganizationAdminUserByEmail,
  OrganizationAdminUserByEmailVariables,
} from '../../../queries/__generated__/OrganizationAdminUserByEmail';

export interface AdminOrganizationOption {
  id: number;
  name: string;
}

interface AddOrganizationAdminDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Organizations the current user may add admins to (all orgs for super-admins). */
  organizationOptions: AdminOrganizationOption[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AddOrganizationAdminDialog: FC<AddOrganizationAdminDialogProps> = ({
  open,
  onClose,
  onSuccess,
  organizationOptions,
}) => {
  const t = useTranslations('manageAdminUsers');
  const tCommon = useTranslations('common');
  const manageRole = useManageRole();

  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState<AdminOrganizationOption | null>(null);
  const [canManageEvents, setCanManageEvents] = useState(false);
  const [canManageCourses, setCanManageCourses] = useState(false);
  const [canManageDegrees, setCanManageDegrees] = useState(false);
  const [canManageSettings, setCanManageSettings] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset the form whenever the dialog opens. When the user administers a single organization it is
  // preselected so they only have to enter the new admin's email.
  useEffect(() => {
    if (open) {
      setEmail('');
      setOrganization(organizationOptions.length === 1 ? organizationOptions[0] : null);
      setCanManageEvents(false);
      setCanManageCourses(false);
      setCanManageDegrees(false);
      setCanManageSettings(false);
      setValidationError(null);
      setServerError(null);
    }
  }, [open, organizationOptions]);

  const [loadUserByEmail] = useLazyRoleQuery<
    OrganizationAdminUserByEmail,
    OrganizationAdminUserByEmailVariables
  >(ORGANIZATION_ADMIN_USER_BY_EMAIL, {
    fetchPolicy: 'network-only',
    context: { role: manageRole },
  });

  const [insertOrganizationAdmin, { loading: inserting }] = useManageMutation<
    InsertOrganizationAdmin,
    InsertOrganizationAdminVariables
  >(INSERT_ORGANIZATION_ADMIN);

  const handleSubmit = useCallback(async () => {
    setValidationError(null);
    setServerError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setValidationError(t('add_admin_email_required'));
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setValidationError(t('add_admin_email_invalid'));
      return;
    }
    if (!organization) {
      setValidationError(t('add_admin_organization_required'));
      return;
    }

    try {
      const userResult = await loadUserByEmail({ variables: { email: trimmedEmail } });
      const user = userResult.data?.User?.[0];
      if (!user) {
        setServerError(t('add_admin_user_not_found'));
        return;
      }

      const insertResult = await insertOrganizationAdmin({
        variables: {
          input: {
            userId: user.id,
            organizationId: organization.id,
            canManageEvents,
            canManageCourses,
            canManageDegrees,
            canManageSettings,
          },
        },
      });

      if (insertResult.data?.insert_OrganizationAdmin_one) {
        setShowSuccess(true);
        onSuccess();
        onClose();
      } else {
        setServerError(t('add_admin_error'));
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('add_admin_error'));
    }
  }, [
    email,
    organization,
    canManageEvents,
    canManageCourses,
    canManageDegrees,
    canManageSettings,
    loadUserByEmail,
    insertOrganizationAdmin,
    onSuccess,
    onClose,
    t,
  ]);

  const capabilityOptions = useMemo(
    () => [
      { label: t('can_manage_events'), checked: canManageEvents, set: setCanManageEvents },
      { label: t('can_manage_courses'), checked: canManageCourses, set: setCanManageCourses },
      { label: t('can_manage_degrees'), checked: canManageDegrees, set: setCanManageDegrees },
      {
        label: t('can_manage_users_and_settings'),
        checked: canManageSettings,
        set: setCanManageSettings,
      },
    ],
    [canManageEvents, canManageCourses, canManageDegrees, canManageSettings, t]
  );

  return (
    <>
      <DialogShell
        open={open}
        onClose={onClose}
        title={t('add_admin_dialog_title')}
        ariaLabelledBy="add-organization-admin-dialog-title"
        actions={
          <div className="flex justify-end gap-2">
            <Button onClick={onClose} disabled={inserting}>
              {tCommon('cancel')}
            </Button>
            <Button filled onClick={handleSubmit} disabled={inserting}>
              {inserting ? t('add_admin_submitting') : t('add_admin_submit')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-label-primary">
          <Autocomplete
            options={organizationOptions}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={organization}
            onChange={(_event, value) => setOrganization(value)}
            renderInput={(params) => (
              <TextField {...params} label={t('organization')} variant="outlined" />
            )}
          />

          <InputField
            variant="material"
            type="email"
            label={t('email')}
            placeholder={t('add_admin_email_placeholder')}
            itemId={0}
            value={email}
            onValueUpdated={(data) => setEmail(data.text || '')}
            className="w-full"
          />

          <div>
            {capabilityOptions.map((capability) => (
              <FormControlLabel
                key={capability.label}
                control={
                  <Checkbox
                    checked={capability.checked}
                    onChange={(event) => capability.set(event.target.checked)}
                    color="primary"
                  />
                }
                label={capability.label}
              />
            ))}
          </div>

          {validationError && <div className="text-red-600 text-sm">{validationError}</div>}
        </div>
      </DialogShell>

      <NotificationSnackbar
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={t('add_admin_success')}
      />

      <ErrorMessageDialog
        errorMessage={serverError ?? ''}
        open={!!serverError}
        onClose={() => setServerError(null)}
      />
    </>
  );
};

export default AddOrganizationAdminDialog;

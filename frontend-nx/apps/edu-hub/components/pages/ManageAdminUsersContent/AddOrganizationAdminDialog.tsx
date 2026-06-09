import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useTranslations } from 'next-intl';

import { DialogShell } from '../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import { Button } from '../../common/Button';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useManageMutation } from '../../../hooks/authedMutation';
import { INSERT_ORGANIZATION_ADMIN } from '../../../queries/organizationAdmin';
import {
  InsertOrganizationAdmin,
  InsertOrganizationAdminVariables,
} from '../../../queries/__generated__/InsertOrganizationAdmin';
import { UserSelectionWithFilter_User } from '../../../queries/__generated__/UserSelectionWithFilter';

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

const AddOrganizationAdminDialog: FC<AddOrganizationAdminDialogProps> = ({
  open,
  onClose,
  onSuccess,
  organizationOptions,
}) => {
  const t = useTranslations('manageAdminUsers');
  const tCommon = useTranslations('common');

  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSelectionWithFilter_User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [canManageEvents, setCanManageEvents] = useState(false);
  const [canManageCourses, setCanManageCourses] = useState(false);
  const [canManageDegrees, setCanManageDegrees] = useState(false);
  const [canManageSettings, setCanManageSettings] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset the form whenever the dialog opens. When the user administers a single organization it is
  // preselected so they only have to pick the new admin.
  useEffect(() => {
    if (open) {
      setOrganizationId(organizationOptions.length === 1 ? organizationOptions[0].id : null);
      setSelectedUser(null);
      setCanManageEvents(false);
      setCanManageCourses(false);
      setCanManageDegrees(false);
      setCanManageSettings(false);
      setValidationError(null);
      setServerError(null);
    }
  }, [open, organizationOptions]);

  const organizationDropDownOptions = useMemo(
    () => organizationOptions.map((organization) => ({ value: String(organization.id), label: organization.name })),
    [organizationOptions]
  );

  const [insertOrganizationAdmin, { loading: inserting }] = useManageMutation<
    InsertOrganizationAdmin,
    InsertOrganizationAdminVariables
  >(INSERT_ORGANIZATION_ADMIN);

  const handleUserDialogClose = useCallback(
    (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      setIsUserDialogOpen(false);
      if (confirmed && user) {
        setSelectedUser(user);
        setValidationError(null);
      }
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setValidationError(null);
    setServerError(null);

    if (!organizationId) {
      setValidationError(t('add_admin_organization_required'));
      return;
    }
    if (!selectedUser) {
      setValidationError(t('add_admin_user_required'));
      return;
    }

    try {
      const insertResult = await insertOrganizationAdmin({
        variables: {
          input: {
            userId: selectedUser.id,
            organizationId,
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
    organizationId,
    selectedUser,
    canManageEvents,
    canManageCourses,
    canManageDegrees,
    canManageSettings,
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
          <DropDownSelector
            variant="material"
            label={t('organization')}
            value={organizationId ? String(organizationId) : ''}
            options={organizationDropDownOptions}
            onValueUpdated={(value) => setOrganizationId(value ? Number(value) : null)}
          />

          <div>
            <div className="text-sm text-label-secondary mb-1">{t('add_admin_user_label')}</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                {selectedUser ? (
                  <span>
                    {`${selectedUser.firstName ?? ''} ${selectedUser.lastName ?? ''}`.trim()}
                    {selectedUser.email && (
                      <span className="text-sm text-label-secondary ml-1">({selectedUser.email})</span>
                    )}
                  </span>
                ) : (
                  <span className="text-label-secondary">{t('add_admin_no_user_selected')}</span>
                )}
              </div>
              <Button onClick={() => setIsUserDialogOpen(true)}>{t('add_admin_select_user')}</Button>
            </div>
          </div>

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

      <SelectUserDialog
        open={isUserDialogOpen}
        title={t('add_admin_select_user_dialog_title')}
        onClose={handleUserDialogClose}
      />

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

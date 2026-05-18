import { FC, useCallback, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { MdClose } from 'react-icons/md';

import { Button } from '../../common/Button';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { INSERT_ORGANIZATION_ADMIN } from '../../../queries/organizationAdmin';
import { UserSelectionWithFilter_User } from '../../../queries/__generated__/UserSelectionWithFilter';

interface OrganizationOption {
  id: number;
  name: string;
}

interface AddOrganizationAdminDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationOptions: OrganizationOption[];
  defaultOrganizationId?: number;
}

export const AddOrganizationAdminDialog: FC<AddOrganizationAdminDialogProps> = ({
  open,
  onClose,
  onSuccess,
  organizationOptions,
  defaultOrganizationId,
}) => {
  const t = useTranslations('manageAdminUsers');
  const [selectedUser, setSelectedUser] = useState<UserSelectionWithFilter_User | null>(null);
  const [selectUserOpen, setSelectUserOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<number | ''>(defaultOrganizationId ?? '');
  const [canManageCourses, setCanManageCourses] = useState(false);
  const [canManageEvents, setCanManageEvents] = useState(false);
  const [canManageSettings, setCanManageSettings] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const [insertOrganizationAdmin, { loading }] = useRoleMutation(INSERT_ORGANIZATION_ADMIN, {
    refetchQueries: ['OrganizationAdminList', 'MyManageableOrganizationAdmins'],
  });

  const resetForm = useCallback(() => {
    setSelectedUser(null);
    setOrganizationId(defaultOrganizationId ?? '');
    setCanManageCourses(false);
    setCanManageEvents(false);
    setCanManageSettings(false);
    setValidationError(null);
    setServerError(null);
  }, [defaultOrganizationId]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleOrganizationChange = useCallback((event: SelectChangeEvent<number | ''>) => {
    setOrganizationId(event.target.value as number | '');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedUser) {
      setValidationError(t('add_admin.validation_user_required'));
      return;
    }
    if (!organizationId) {
      setValidationError(t('add_admin.validation_organization_required'));
      return;
    }

    setValidationError(null);
    setServerError(null);

    try {
      await insertOrganizationAdmin({
        variables: {
          userId: selectedUser.id,
          organizationId,
          canManageCourses,
          canManageEvents,
          canManageSettings,
        },
      });
      setShowSuccessNotification(true);
      onSuccess();
      handleClose();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('add_admin.error'));
    }
  }, [
    selectedUser,
    organizationId,
    canManageCourses,
    canManageEvents,
    canManageSettings,
    insertOrganizationAdmin,
    onSuccess,
    handleClose,
    t,
  ]);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUser) {
      return '';
    }
    return `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`;
  }, [selectedUser]);

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle className="light">
          <div className="grid grid-cols-2">
            <div className="text-label-primary">{t('add_admin.title')}</div>
            <div className="cursor-pointer flex justify-end text-label-primary">
              <MdClose onClick={handleClose} />
            </div>
          </div>
        </DialogTitle>
        <DialogContent className="light space-y-4">
          <div>
            <p className="text-label-secondary text-sm mb-2">{t('add_admin.user_label')}</p>
            <Button onClick={() => setSelectUserOpen(true)} filled inverted>
              {selectedUser ? t('add_admin.change_user') : t('add_admin.select_user')}
            </Button>
            {selectedUserLabel && <p className="mt-2 text-label-primary text-sm">{selectedUserLabel}</p>}
          </div>

          {organizationOptions.length > 1 ? (
            <FormControl fullWidth>
              <InputLabel id="organization-admin-org-label">{t('organization')}</InputLabel>
              <Select
                labelId="organization-admin-org-label"
                label={t('organization')}
                value={organizationId}
                onChange={handleOrganizationChange}
              >
                {organizationOptions.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            organizationOptions.length === 1 && (
              <p className="text-label-primary">
                {t('organization')}: {organizationOptions[0].name}
              </p>
            )
          )}

          <div className="space-y-2">
            <CheckboxSelector
              variant="eduhub"
              label={t('can_manage_events')}
              checked={canManageEvents}
              onValueUpdated={setCanManageEvents}
            />
            <CheckboxSelector
              variant="eduhub"
              label={t('can_manage_courses')}
              checked={canManageCourses}
              onValueUpdated={setCanManageCourses}
            />
            <CheckboxSelector
              variant="eduhub"
              label={t('can_manage_users_and_settings')}
              checked={canManageSettings}
              onValueUpdated={setCanManageSettings}
            />
          </div>

          {validationError && <p className="text-red-500 text-sm">{validationError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleClose}>{t('add_admin.cancel')}</Button>
            <Button onClick={handleSubmit} filled disabled={loading}>
              {loading ? t('add_admin.saving') : t('add_admin.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SelectUserDialog
        open={selectUserOpen}
        title={t('add_admin.select_user')}
        onClose={(confirmed, user) => {
          setSelectUserOpen(false);
          if (confirmed && user) {
            setSelectedUser(user);
          }
        }}
      />

      <NotificationSnackbar
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message={t('add_admin.success')}
      />

      <ErrorMessageDialog errorMessage={serverError ?? ''} open={!!serverError} onClose={() => setServerError(null)} />
    </>
  );
};

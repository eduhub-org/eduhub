import React, { useState, useCallback } from 'react';
import { Dialog, DialogTitle, Checkbox, FormControlLabel } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';

import { Button } from '../Button';
import { SelectUserDialog } from './SelectUserDialog';
import { SelectOrganizationDialog } from './SelectOrganizationDialog';
import NotificationSnackbar from './NotificationSnackbar';
import { ErrorMessageDialog } from './ErrorMessageDialog';

import { useAdminMutation } from '../../../hooks/authedMutation';
import { INSERT_ORGANIZATION_ADMIN } from '../../../queries/organizationAdmin';
import { UserSelectionWithFilter_User } from '../../../queries/__generated__/UserSelectionWithFilter';
import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';

interface CreateOrganizationAdminDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrganizationAdminDialog: React.FC<CreateOrganizationAdminDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations('manageAdminUsers');
  const tCommon = useTranslations('common');

  const [selectedUser, setSelectedUser] = useState<UserSelectionWithFilter_User | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationList_Organization | null>(null);
  const [canManageCourses, setCanManageCourses] = useState(false);
  const [canManageEvents, setCanManageEvents] = useState(false);
  const [canManageSettings, setCanManageSettings] = useState(false);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setSelectedUser(null);
    setSelectedOrganization(null);
    setCanManageCourses(false);
    setCanManageEvents(false);
    setCanManageSettings(false);
  }, []);

  const [insertOrganizationAdmin, { loading }] = useAdminMutation(INSERT_ORGANIZATION_ADMIN, {
    onCompleted: () => {
      setShowSuccess(true);
      resetForm();
      onSuccess();
      onClose();
    },
    onError: (err) => {
      const message = err.message?.includes('Uniqueness violation')
        ? t('create_admin.error_already_exists')
        : err.message || t('create_admin.error');
      setServerError(message);
    },
  });

  const handleClose = useCallback(() => {
    if (loading) return;
    resetForm();
    onClose();
  }, [loading, onClose, resetForm]);

  const handleUserDialogClose = useCallback(
    (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      setUserDialogOpen(false);
      if (confirmed && user) setSelectedUser(user);
    },
    []
  );

  const handleOrgDialogClose = useCallback(
    (confirmed: boolean, organization: OrganizationList_Organization | null) => {
      setOrgDialogOpen(false);
      if (confirmed && organization) setSelectedOrganization(organization);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (!selectedUser || !selectedOrganization) return;
    setServerError(null);
    insertOrganizationAdmin({
      variables: {
        userId: selectedUser.id,
        organizationId: selectedOrganization.id,
        canManageCourses,
        canManageEvents,
        canManageSettings,
      },
    });
  }, [
    selectedUser,
    selectedOrganization,
    canManageCourses,
    canManageEvents,
    canManageSettings,
    insertOrganizationAdmin,
  ]);

  const isFormValid = !!selectedUser && !!selectedOrganization;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle className="light">
          <div className="flex justify-between items-center">
            <span className="text-label-primary">{t('create_admin.dialog_title')}</span>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors text-label-primary"
              aria-label={tCommon('close')}
              disabled={loading}
            >
              <MdClose className="text-xl" />
            </button>
          </div>
        </DialogTitle>

        <div className="px-6 pb-6 light">
          <div className="mb-6 space-y-4">
            <div>
              <div className="text-label-primary text-sm mb-1">{t('create_admin.user_label')}</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-label-primary">
                  {selectedUser
                    ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`
                    : t('create_admin.user_placeholder')}
                </div>
                <Button onClick={() => setUserDialogOpen(true)} disabled={loading}>
                  {t('create_admin.select_user')}
                </Button>
              </div>
            </div>

            <div>
              <div className="text-label-primary text-sm mb-1">{t('create_admin.organization_label')}</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-label-primary">
                  {selectedOrganization ? selectedOrganization.name : t('create_admin.organization_placeholder')}
                </div>
                <Button onClick={() => setOrgDialogOpen(true)} disabled={loading}>
                  {t('create_admin.select_organization')}
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-label-primary text-sm mb-2">{t('create_admin.permissions_label')}</div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={canManageEvents}
                    onChange={(e) => setCanManageEvents(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('can_manage_events')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={canManageCourses}
                    onChange={(e) => setCanManageCourses(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('can_manage_courses')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={canManageSettings}
                    onChange={(e) => setCanManageSettings(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('can_manage_users_and_settings')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleClose} disabled={loading}>
              {tCommon('cancel')}
            </Button>
            <Button filled onClick={handleSubmit} disabled={!isFormValid || loading}>
              {loading ? t('create_admin.creating') : t('create_admin.submit')}
            </Button>
          </div>
        </div>
      </Dialog>

      <SelectUserDialog
        open={userDialogOpen}
        onClose={handleUserDialogClose}
        title={t('create_admin.select_user_title')}
      />

      <SelectOrganizationDialog
        open={orgDialogOpen}
        onClose={handleOrgDialogClose}
        title={t('create_admin.select_organization_title')}
      />

      <NotificationSnackbar
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={t('create_admin.success')}
      />

      <ErrorMessageDialog
        errorMessage={serverError ?? ''}
        open={!!serverError}
        onClose={() => setServerError(null)}
      />
    </>
  );
};

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useTranslations } from 'next-intl';

import { DialogShell } from '../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import SelectUserRow from '../../common/dialogs/SelectUserRow';
import { Button } from '../../common/Button';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useAdminMutation, useManageMutation } from '../../../hooks/authedMutation';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { useManageRole } from '../../../hooks/authentication';
import { INSERT_ORGANIZATION_ADMIN } from '../../../queries/organizationAdmin';
import { UPDATE_USER_ADMIN_STATUS } from '../../../queries/actions';
import { USER_SELECTION_WITH_FILTER, buildUserSelectionFilter } from '../../../queries/user';
import { createMultiWordSearchCondition } from '../../../helpers/searchUtils';
import { order_by } from '../../../__generated__/globalTypes';
import {
  InsertOrganizationAdmin,
  InsertOrganizationAdminVariables,
} from '../../../queries/__generated__/InsertOrganizationAdmin';
import {
  UserSelectionWithFilter,
  UserSelectionWithFilterVariables,
  UserSelectionWithFilter_User,
} from '../../../queries/__generated__/UserSelectionWithFilter';

export interface AdminOrganizationOption {
  id: number;
  name: string;
}

interface AddAdminDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Organizations the current user may add admins to (all orgs for super-admins). */
  organizationOptions: AdminOrganizationOption[];
  /** Super-admins may also promote the picked user to super-admin (a platform-wide Keycloak role). */
  canGrantSuperAdmin?: boolean;
  /**
   * Organization ids that currently have no admin with canManageSettings. The database no longer
   * forces that capability onto an organization's first admin, so for these the choice is here: an
   * organization left without one has nobody who can add a second admin or edit its settings, and
   * only a super-admin could repair that.
   */
  organizationIdsWithoutSettingsAdmin?: number[];
}

const AddAdminDialog: FC<AddAdminDialogProps> = ({
  open,
  onClose,
  onSuccess,
  organizationOptions,
  canGrantSuperAdmin = false,
  organizationIdsWithoutSettingsAdmin = [],
}) => {
  const t = useTranslations('manageAdminUsers');
  const tCommon = useTranslations('common');
  const manageRole = useManageRole();

  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSelectionWithFilter_User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [canManageEvents, setCanManageEvents] = useState(false);
  const [canManageCourses, setCanManageCourses] = useState(false);
  const [canManageDegrees, setCanManageDegrees] = useState(false);
  const [canManageJobs, setCanManageJobs] = useState(false);
  const [canManageSettings, setCanManageSettings] = useState(false);
  const [grantSuperAdmin, setGrantSuperAdmin] = useState(false);
  // Set once the OrganizationAdmin row exists, so a retry after a failed super-admin promotion
  // does not insert it twice — the second insert would violate the (userId, organizationId)
  // unique constraint and surface as an error even though the grant is fine.
  const grantCreatedRef = useRef(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset the form whenever the dialog opens. When the user administers a single organization it is
  // preselected so they only have to pick the new admin.
  useEffect(() => {
    if (open) {
      setOrganizationId(organizationOptions.length === 1 ? organizationOptions[0].id : null);
      setSelectedUser(null);
      setUserSearch('');
      setCanManageEvents(false);
      setCanManageCourses(false);
      setCanManageDegrees(false);
      setCanManageJobs(false);
      setCanManageSettings(false);
      setGrantSuperAdmin(false);
      grantCreatedRef.current = false;
      setValidationError(null);
      setServerError(null);
    }
  }, [open, organizationOptions]);

  const organizationDropDownOptions = useMemo(
    () => organizationOptions.map((organization) => ({ value: String(organization.id), label: organization.name })),
    [organizationOptions]
  );

  const needsSettingsAdmin =
    organizationId != null && organizationIdsWithoutSettingsAdmin.includes(organizationId);

  // Pre-check rather than merely hint: the common case is granting the first admin of a fresh
  // organization, and an unticked box there leaves it unmanageable. It stays a checkbox, so it can
  // still be turned off deliberately.
  //
  // Assigned, not just set: switching from an organization that needs a settings admin to one that
  // already has one must clear the box again, or the automatic tick silently follows along and
  // grants settings rights the second organization never asked for.
  useEffect(() => {
    setCanManageSettings(needsSettingsAdmin);
  }, [needsSettingsAdmin]);

  // Inline user search (same query/role as the shared SelectUserDialog used to add instructors): only
  // existing, active EduHub users are returned, matched by partial name or email.
  const hasSearched = userSearch.trim().length >= 2;
  const userFilter = useMemo(() => {
    const searchFilter = hasSearched
      ? createMultiWordSearchCondition(userSearch.trim(), ['firstName', 'lastName', 'email'])
      : {};
    return buildUserSelectionFilter(searchFilter, manageRole);
  }, [hasSearched, userSearch, manageRole]);
  const { data: userData, loading: usersLoading } = useRoleQuery<
    UserSelectionWithFilter,
    UserSelectionWithFilterVariables
  >(USER_SELECTION_WITH_FILTER, {
    variables: {
      limit: 100,
      filter: userFilter,
      order_by: [{ lastName: order_by.asc }, { firstName: order_by.asc }],
    },
    skip: !open || !!selectedUser || !hasSearched,
    context: { role: manageRole },
  });
  const users = userData?.User ?? [];
  const showNoResults = hasSearched && !usersLoading && users.length === 0;

  const handleSelectUser = useCallback((user: UserSelectionWithFilter_User) => {
    setSelectedUser(user);
    setUserSearch('');
    setValidationError(null);
  }, []);

  const [insertOrganizationAdmin, { loading: inserting }] = useManageMutation<
    InsertOrganizationAdmin,
    InsertOrganizationAdminVariables
  >(INSERT_ORGANIZATION_ADMIN);

  // Super-admin is a Keycloak role rather than a table row, so it is granted through the action
  // instead of the OrganizationAdmin insert. Admin-only, matching canGrantSuperAdmin.
  const [setAdminStatus, { loading: promoting }] = useAdminMutation(UPDATE_USER_ADMIN_STATUS);

  const submitting = inserting || promoting;

  const handleSubmit = useCallback(async () => {
    setValidationError(null);
    setServerError(null);

    if (!selectedUser) {
      setValidationError(t('add_admin_user_required'));
      return;
    }
    // An admin is either given an organization role, super-admin rights, or both. Without an
    // organization the capability flags are meaningless, so they are simply ignored in that case.
    if (!organizationId && !grantSuperAdmin) {
      setValidationError(
        canGrantSuperAdmin ? t('add_admin_scope_required') : t('add_admin_organization_required')
      );
      return;
    }
    // A grant with no capabilities still confers org-admin access in the permission model, so a
    // capability must be picked explicitly rather than silently creating a bare admin row.
    if (
      organizationId &&
      !canManageEvents &&
      !canManageCourses &&
      !canManageDegrees &&
      !canManageJobs &&
      !canManageSettings
    ) {
      setValidationError(t('add_admin_capability_required'));
      return;
    }

    try {
      if (organizationId && !grantCreatedRef.current) {
        const insertResult = await insertOrganizationAdmin({
          variables: {
            input: {
              userId: selectedUser.id,
              organizationId,
              canManageEvents,
              canManageCourses,
              canManageDegrees,
              canManageJobs,
              canManageSettings,
            },
          },
        });

        if (!insertResult.data?.insert_OrganizationAdmin_one) {
          setServerError(t('add_admin_error'));
          return;
        }
        grantCreatedRef.current = true;
      }

      if (grantSuperAdmin) {
        const adminResult = await setAdminStatus({
          variables: { userId: selectedUser.id, isAdmin: true },
        });

        if (!adminResult.data?.updateUserAdminStatus?.success) {
          setServerError(t('add_admin_error'));
          // The two grants are independent mutations. If the organization grant already went
          // through, refresh the list so it shows up rather than silently existing behind an
          // error dialog; retrying then only re-attempts the promotion.
          if (grantCreatedRef.current) {
            onSuccess();
          }
          return;
        }
      }

      setShowSuccess(true);
      onSuccess();
      onClose();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('add_admin_error'));
    }
  }, [
    organizationId,
    selectedUser,
    grantSuperAdmin,
    canGrantSuperAdmin,
    canManageEvents,
    canManageCourses,
    canManageDegrees,
    canManageJobs,
    canManageSettings,
    insertOrganizationAdmin,
    setAdminStatus,
    onSuccess,
    onClose,
    t,
  ]);

  const capabilityOptions = useMemo(
    () => [
      { label: t('can_manage_events'), checked: canManageEvents, set: setCanManageEvents },
      { label: t('can_manage_courses'), checked: canManageCourses, set: setCanManageCourses },
      { label: t('can_manage_degrees'), checked: canManageDegrees, set: setCanManageDegrees },
      { label: t('can_manage_jobs'), checked: canManageJobs, set: setCanManageJobs },
      {
        label: t('can_manage_users_and_settings'),
        checked: canManageSettings,
        set: setCanManageSettings,
        hint: needsSettingsAdmin ? t('first_settings_admin_hint') : undefined,
      },
    ],
    [
      canManageEvents,
      canManageCourses,
      canManageDegrees,
      canManageJobs,
      canManageSettings,
      needsSettingsAdmin,
      t,
    ]
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
            <Button onClick={onClose} disabled={submitting}>
              {tCommon('cancel')}
            </Button>
            <Button filled onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('add_admin_submitting') : t('add_admin_submit')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-label-primary">
          <DropDownSelector
            variant="eduhub"
            label={t('organization')}
            placeholder={tCommon('organization_dialog.search_organizations')}
            value={organizationId ? String(organizationId) : ''}
            options={organizationDropDownOptions}
            searchable
            // A super-admin may add someone as super-admin only, so the organization stays optional
            // (and clearable) for them; for org admins it remains mandatory.
            nullable={canGrantSuperAdmin}
            nullableLabel={t('add_admin_no_organization')}
            onValueUpdated={(value) => setOrganizationId(value ? Number(value) : null)}
          />

          <div>
            <div className="text-sm text-label-secondary mb-1">{t('add_admin_user_label')}</div>
            {selectedUser ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {`${selectedUser.firstName ?? ''} ${selectedUser.lastName ?? ''}`.trim()}
                  {selectedUser.email && (
                    <span className="text-sm text-label-secondary ml-1">({selectedUser.email})</span>
                  )}
                </div>
                <Button onClick={() => setSelectedUser(null)}>{t('add_admin_change_user')}</Button>
              </div>
            ) : (
              <>
                <input
                  placeholder={t('add_admin_user_search_placeholder')}
                  className="w-full border border-solid border-border-primary rounded px-3 py-2 bg-fill-primary text-label-primary"
                  type="text"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                />
                {hasSearched && (
                  <div className="mt-2 max-h-64 overflow-auto border border-border-primary rounded">
                    {users.map((user) => (
                      <SelectUserRow user={user} key={user.id} onClick={handleSelectUser} />
                    ))}
                    {showNoResults && (
                      <div className="p-3 text-center text-label-secondary">{t('add_admin_no_users_found')}</div>
                    )}
                    {usersLoading && (
                      <div className="p-3 text-center text-label-secondary">{tCommon('loading')}</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {organizationId != null && (
            <div>
              {capabilityOptions.map((capability) => (
                <div key={capability.label}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={capability.checked}
                        onChange={(event) => capability.set(event.target.checked)}
                        color="primary"
                      />
                    }
                    label={capability.label}
                  />
                  {capability.hint && (
                    <p className="mt-0 mb-2 ml-8 text-xs text-label-secondary">{capability.hint}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {canGrantSuperAdmin && (
            <div className="pt-2 border-t border-solid border-border-primary">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={grantSuperAdmin}
                    onChange={(event) => setGrantSuperAdmin(event.target.checked)}
                    color="primary"
                  />
                }
                label={t('is_super_admin')}
              />
              <div className="text-sm text-label-secondary">{t('add_admin_super_admin_hint')}</div>
            </div>
          )}

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

export default AddAdminDialog;

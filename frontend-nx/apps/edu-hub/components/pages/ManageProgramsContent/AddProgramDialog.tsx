import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { DialogShell } from '../../common/dialogs/DialogShell';
import { Button } from '../../common/Button';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useAdminQuery, useOrgAdminQuery } from '../../../hooks/authedQuery';
import { useIsAdmin } from '../../../hooks/authentication';
import { useUserId } from '../../../hooks/user';
import { ORGANIZATION_OPTIONS } from '../../../queries/organization';
import { MANAGEABLE_ORGANIZATIONS } from '../../../queries/organizationAdmin';
import { OrganizationOptions } from '../../../queries/__generated__/OrganizationOptions';
import {
  ManageableOrganizations,
  ManageableOrganizationsVariables,
} from '../../../queries/__generated__/ManageableOrganizations';
import { ProgramType } from '../../../types/enums';

interface AddProgramDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (organizationId: number, type: ProgramType) => Promise<void>;
}

/**
 * Asks for the organization and type of a new program. Super-admins choose from all organizations,
 * org admins from those where they hold the settings privilege (the only ones Hasura lets them add to).
 */
const AddProgramDialog: FC<AddProgramDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('managePrograms');
  const tCommon = useTranslations('common');
  const tTypes = useTranslations('manageAppSettings.programTypes');
  const isAdmin = useIsAdmin();
  const userId = useUserId();

  const { data: allOrganizationsData } = useAdminQuery<OrganizationOptions>(ORGANIZATION_OPTIONS, {
    skip: !isAdmin || !open,
  });
  const { data: manageableData } = useOrgAdminQuery<ManageableOrganizations, ManageableOrganizationsVariables>(
    MANAGEABLE_ORGANIZATIONS,
    { skip: isAdmin || !userId || !open, variables: { currentUserId: userId ?? '' } }
  );

  const organizationOptions = useMemo(() => {
    const organizations = isAdmin
      ? allOrganizationsData?.Organization ?? []
      : (manageableData?.OrganizationAdmin ?? []).flatMap((grant) => (grant.Organization ? [grant.Organization] : []));
    return organizations
      .map((organization) => ({ value: String(organization.id), label: organization.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [isAdmin, allOrganizationsData, manageableData]);

  const typeOptions = useMemo(
    () => Object.values(ProgramType).map((type) => ({ value: type, label: tTypes(type) })),
    [tTypes]
  );

  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [type, setType] = useState<ProgramType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Preselect the only organization an org admin can add to; start fresh on every open.
  useEffect(() => {
    if (open) {
      setOrganizationId(organizationOptions.length === 1 ? Number(organizationOptions[0].value) : null);
      setType(null);
      setSubmitting(false);
    }
  }, [open, organizationOptions]);

  const handleSubmit = async () => {
    if (organizationId == null || type == null) return;
    setSubmitting(true);
    try {
      await onSubmit(organizationId, type);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('add_program_dialog.title')}
      actions={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={submitting}>
            {tCommon('cancel')}
          </Button>
          <Button filled onClick={handleSubmit} disabled={submitting || organizationId == null || type == null}>
            {t('add_program_button')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <DropDownSelector
          variant="eduhub"
          label={t('add_program_dialog.organization')}
          value={organizationId != null ? String(organizationId) : ''}
          options={organizationOptions}
          searchable
          onValueUpdated={(value) => setOrganizationId(value ? Number(value) : null)}
        />
        <DropDownSelector
          variant="eduhub"
          label={t('add_program_dialog.type')}
          value={type ?? ''}
          options={typeOptions}
          onValueUpdated={(value) => setType(value ? (value as ProgramType) : null)}
        />
      </div>
    </DialogShell>
  );
};

export default AddProgramDialog;

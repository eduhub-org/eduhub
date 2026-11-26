import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { DialogShell } from '../../common/dialogs/DialogShell';
import { Button } from '../../common/Button';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useManageMutation } from '../../../hooks/authedMutation';
import { useAdminQuery, useOrgAdminQuery } from '../../../hooks/authedQuery';
import { useIsAdmin } from '../../../hooks/authentication';
import { useUserId } from '../../../hooks/user';
import { MY_ORG_ADMIN_CAPABILITIES } from '../../../queries/organizationAdmin';
import { ORGANIZATION_OPTIONS } from '../../../queries/organization';
import { INSERT_PROGRAM } from '../../../queries/updateProgram';
import { InsertProgram, InsertProgramVariables } from '../../../queries/__generated__/InsertProgram';
import { MyOrgAdminCapabilities } from '../../../queries/__generated__/MyOrgAdminCapabilities';
import { OrganizationOptions } from '../../../queries/__generated__/OrganizationOptions';
import { ProgramType } from '../../../types/enums';
import { DEFAULT_ORGANIZATION_ID } from '../ManageCoursesContent/organizationScope';
import { creatableOrganizations, creatableProgramTypes, OrganizationOption } from './programCreation';

const ALL_PROGRAM_TYPES = [ProgramType.COURSES, ProgramType.EVENTS, ProgramType.DEGREES];

/**
 * Program types and owning organizations the current admin may create a program for. Super-admins
 * may create any type for any organization; org admins only what their OrganizationAdmin grants
 * allow (the same rule as the Hasura org_admin_access insert check on Program).
 */
export const useProgramCreationOptions = (programType: ProgramType) => {
  const isAdmin = useIsAdmin();
  const userId = useUserId();

  const { data: organizationsData, loading: organizationsLoading } = useAdminQuery<OrganizationOptions>(
    ORGANIZATION_OPTIONS,
    { skip: !isAdmin }
  );
  const { data: grantsData, loading: grantsLoading } = useOrgAdminQuery<MyOrgAdminCapabilities>(
    MY_ORG_ADMIN_CAPABILITIES,
    { variables: { userId }, skip: isAdmin || !userId }
  );

  return useMemo(() => {
    if (isAdmin) {
      const organizations: OrganizationOption[] = (organizationsData?.Organization ?? []).map((org) => ({
        value: String(org.id),
        label: org.name,
      }));
      return { programTypes: ALL_PROGRAM_TYPES, organizations, loading: organizationsLoading };
    }
    const grants = grantsData?.OrganizationAdmin ?? [];
    return {
      programTypes: creatableProgramTypes(grants),
      organizations: creatableOrganizations(grants, programType),
      loading: grantsLoading || !userId,
    };
  }, [isAdmin, organizationsData, organizationsLoading, grantsData, grantsLoading, programType, userId]);
};

interface CreateProgramDialogProps {
  open: boolean;
  onClose: () => void;
  /** Fixes the program type (the type dashboards); without it the admin picks one. */
  programType?: ProgramType;
  /** Organization preselected when the admin may create for it. */
  defaultOrganizationId?: number | null;
  onCreated?: (program: { id: number; organizationId: number; type: ProgramType }) => void;
  onError?: () => void;
}

export const CreateProgramDialog: FC<CreateProgramDialogProps> = ({
  open,
  onClose,
  programType: fixedProgramType,
  defaultOrganizationId = null,
  onCreated,
  onError,
}) => {
  const t = useTranslations('managePrograms');
  const tCommon = useTranslations('common');
  const tProgramTypes = useTranslations('manageAppSettings.programTypes');

  const [selectedType, setSelectedType] = useState<ProgramType>(fixedProgramType ?? ProgramType.COURSES);
  const programType = fixedProgramType ?? selectedType;
  const { programTypes, organizations, loading } = useProgramCreationOptions(programType);

  // An org admin who may not create COURSES programs starts on the first type they may create.
  useEffect(() => {
    if (!fixedProgramType && programTypes.length > 0 && !programTypes.includes(selectedType)) {
      setSelectedType(programTypes[0]);
    }
  }, [fixedProgramType, programTypes, selectedType]);

  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  // Keep the organization valid for the chosen type: the remembered choice, else the preferred
  // organization, else the platform default organization, else the first option.
  const organizationValue = useMemo(() => {
    const has = (value: string) => organizations.some((option) => option.value === value);
    if (selectedOrganization && has(selectedOrganization)) return selectedOrganization;
    for (const candidate of [defaultOrganizationId, DEFAULT_ORGANIZATION_ID]) {
      if (candidate !== null && candidate !== undefined && has(String(candidate))) return String(candidate);
    }
    return organizations[0]?.value ?? '';
  }, [organizations, selectedOrganization, defaultOrganizationId]);

  const [insertProgram, { loading: inserting }] = useManageMutation<InsertProgram, InsertProgramVariables>(
    INSERT_PROGRAM,
    { refetchQueries: ['ProgramList', 'Programs'] }
  );

  const canCreate = !loading && organizationValue !== '';

  const handleCreate = async () => {
    if (!canCreate) return;
    const organizationId = Number(organizationValue);
    try {
      const result = await insertProgram({
        variables: {
          title: t('title.placeholder'),
          today: new Date(),
          type: programType,
          organizationId,
        },
      });
      const id = result.data?.insert_Program?.returning?.[0]?.id;
      if (id === undefined) throw new Error('insert_Program returned no row');
      onCreated?.({ id, organizationId, type: programType });
      onClose();
    } catch (error) {
      console.error('Error creating program:', error);
      onError?.();
    }
  };

  const typeOptions = programTypes.map((type) => ({ value: type, label: tProgramTypes(type) }));

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('create_dialog.title')}
      maxWidth="xs"
      actions={
        <div className="flex gap-3 justify-end w-full">
          <Button onClick={onClose}>{tCommon('cancel')}</Button>
          <Button filled onClick={handleCreate} disabled={!canCreate || inserting}>
            {t('create_dialog.create_button')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        {!fixedProgramType && typeOptions.length > 1 && (
          <DropDownSelector
            variant="material"
            label={t('create_dialog.type_label')}
            value={programType}
            options={typeOptions}
            onValueUpdated={(value: string) => value && setSelectedType(value as ProgramType)}
          />
        )}
        {!loading && organizations.length === 0 ? (
          <p className="text-label-secondary">{t('create_dialog.no_organization')}</p>
        ) : organizations.length > 1 ? (
          <DropDownSelector
            variant="material"
            label={t('create_dialog.organization_label')}
            value={organizationValue}
            options={organizations}
            searchable={organizations.length > 8}
            onValueUpdated={(value: string) => value && setSelectedOrganization(value)}
          />
        ) : (
          organizations.length === 1 && (
            <p className="text-label-secondary">
              {t('create_dialog.single_organization', { organization: organizations[0].label })}
            </p>
          )
        )}
        <p className="text-sm text-label-secondary">{t('create_dialog.hint')}</p>
      </div>
    </DialogShell>
  );
};

export default CreateProgramDialog;

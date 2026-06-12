import Link from 'next/link';
import { FC, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import DropDownSelector from '../../inputs/DropDownSelector';
import { Button } from '../../common/Button';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  PROJECT_DOCUMENTATION_INSTRUCTIONS,
  PROJECT_TYPES,
  UPDATE_PROJECT_TYPE_CERTIFICATE_TEMPLATE,
} from '../../../queries/project';
import { ProjectTypes } from '../../../queries/__generated__/ProjectTypes';
import {
  UpdateProjectTypeCertificateTemplate,
  UpdateProjectTypeCertificateTemplateVariables,
} from '../../../queries/__generated__/UpdateProjectTypeCertificateTemplate';
import { CERTIFICATE_TEMPLATES } from '../../../queries/certificateTemplates';
import { CertificateTemplates } from '../../../queries/__generated__/CertificateTemplates';
import { SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT } from '../../../queries/projectDocumentationInstruction';
import { ProjectDocumentationInstructions } from '../../../queries/__generated__/ProjectDocumentationInstructions';
import {
  SetProjectDocumentationInstructionDefault,
  SetProjectDocumentationInstructionDefaultVariables,
} from '../../../queries/__generated__/SetProjectDocumentationInstructionDefault';

type ProjectTypeRow = ProjectTypes['ProjectType'][number] & { id: number };

const REFETCH_QUERIES = ['ProjectTypes', 'ProjectDocumentationInstructions'];

const ProjectTypesSection: FC = () => {
  const t = useTranslations('manageAppSettings.projectTypes');
  const tCourse = useTranslations('course');

  const { data: projectTypesData, loading, error } = useAdminQuery<ProjectTypes>(PROJECT_TYPES);
  const { data: certificateTemplatesData } = useAdminQuery<CertificateTemplates>(CERTIFICATE_TEMPLATES);
  const { data: instructionsData } = useAdminQuery<ProjectDocumentationInstructions>(
    PROJECT_DOCUMENTATION_INSTRUCTIONS
  );

  const [updateCertificateTemplate] = useAdminMutation<
    UpdateProjectTypeCertificateTemplate,
    UpdateProjectTypeCertificateTemplateVariables
  >(UPDATE_PROJECT_TYPE_CERTIFICATE_TEMPLATE, { refetchQueries: REFETCH_QUERIES });

  const [setInstructionDefault, { loading: settingDefault }] = useAdminMutation<
    SetProjectDocumentationInstructionDefault,
    SetProjectDocumentationInstructionDefaultVariables
  >(SET_PROJECT_DOCUMENTATION_INSTRUCTION_DEFAULT, { refetchQueries: REFETCH_QUERIES });

  const certificateOptions = useMemo(
    () =>
      (certificateTemplatesData?.CertificateTemplate ?? []).map((tpl) => ({
        value: String(tpl.id),
        label: tpl.name,
      })),
    [certificateTemplatesData?.CertificateTemplate]
  );

  const instructionsByType = useMemo(() => {
    const map = new Map<string, ProjectDocumentationInstructions['ProjectDocumentationInstruction'][number]>();
    (instructionsData?.ProjectDocumentationInstruction ?? []).forEach((instr) => {
      if (instr.isDefault) {
        map.set(instr.projectTypeValue, instr);
      }
    });
    return map;
  }, [instructionsData?.ProjectDocumentationInstruction]);

  const instructionOptionsForType = useCallback(
    (projectTypeValue: string) =>
      (instructionsData?.ProjectDocumentationInstruction ?? [])
        .filter((instr) => instr.projectTypeValue === projectTypeValue)
        .map((instr) => ({
          value: String(instr.id),
          label: instr.title,
        })),
    [instructionsData?.ProjectDocumentationInstruction]
  );

  const handleDefaultInstructionChange = useCallback(
    async (instructionId: string) => {
      await setInstructionDefault({
        variables: { instructionId: parseInt(instructionId, 10) },
      });
    },
    [setInstructionDefault]
  );

  const columns = useMemo<ColumnDef<ProjectTypeRow>[]>(
    () => [
      {
        accessorKey: 'value',
        header: t('column.project_type'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-label-primary">
            {tCourse(`projects.type_label.${getValue<string>()}` as never)}
          </span>
        ),
      },
      {
        id: 'achievementTemplate',
        header: t('column.achievement_template'),
        size: 280,
        cell: ({ row }) => (
          <DropDownSelector
            variant="material"
            label={t('column.achievement_template')}
            value={row.original.certificateTemplateId ? String(row.original.certificateTemplateId) : ''}
            options={certificateOptions}
            nullable
            nullableLabel={t('none_option')}
            identifierVariables={{}}
            refetchQueries={REFETCH_QUERIES}
            onValueUpdated={(newValue: string) => {
              updateCertificateTemplate({
                variables: {
                  value: row.original.value,
                  templateId: newValue === '' ? null : parseInt(newValue, 10),
                },
              });
            }}
          />
        ),
      },
      {
        id: 'defaultInstruction',
        header: t('column.default_instruction'),
        size: 280,
        cell: ({ row }) => {
          const defaultInstr = instructionsByType.get(row.original.value);
          const options = instructionOptionsForType(row.original.value);
          if (options.length === 0) {
            return (
              <span className="text-xs text-label-tertiary italic">{t('no_instructions')}</span>
            );
          }
          return (
            <DropDownSelector
              variant="material"
              label={t('column.default_instruction')}
              value={defaultInstr ? String(defaultInstr.id) : ''}
              options={options}
              disabled={settingDefault}
              onValueUpdated={handleDefaultInstructionChange}
              identifierVariables={{}}
              refetchQueries={REFETCH_QUERIES}
            />
          );
        },
      },
    ],
    [
      t,
      tCourse,
      certificateOptions,
      instructionsByType,
      instructionOptionsForType,
      updateCertificateTemplate,
      handleDefaultInstructionChange,
      settingDefault,
    ]
  );

  const rows: ProjectTypeRow[] = useMemo(
    () =>
      (projectTypesData?.ProjectType ?? []).map((pt, index) => ({
        ...pt,
        id: index + 1,
      })),
    [projectTypesData?.ProjectType]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-label-secondary">{t('help_text')}</p>
        <Link href="/manage/settings/documentation-instructions">
          <Button>{t('manage_instructions_link')}</Button>
        </Link>
      </div>

      <TableGrid
        columns={columns}
        data={rows}
        loading={loading}
        error={error}
        refetchQueries={REFETCH_QUERIES}
        enablePagination={false}
        pageIndex={0}
        onPageChange={() => undefined}
        searchFilter=""
        onSearchFilterChange={() => undefined}
        showGlobalSearchField={false}
      />
    </div>
  );
};

export default ProjectTypesSection;

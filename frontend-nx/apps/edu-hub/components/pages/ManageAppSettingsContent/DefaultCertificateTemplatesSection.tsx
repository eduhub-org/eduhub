import { FC } from 'react';
import { useTranslations } from 'next-intl';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { CERTIFICATE_TEMPLATES } from '../../../queries/certificateTemplates';
import { CertificateTemplates } from '../../../queries/__generated__/CertificateTemplates';
import {
  PROGRAM_TYPE_DEFAULTS,
  UPDATE_PROGRAM_TYPE_DEFAULT_ATTENDANCE_CERTIFICATE_TEMPLATE,
} from '../../../queries/programTypeDefaults';
import { ProgramTypeDefaults } from '../../../queries/__generated__/ProgramTypeDefaults';
import {
  UpdateProgramTypeDefaultAttendanceCertificateTemplate,
  UpdateProgramTypeDefaultAttendanceCertificateTemplateVariables,
} from '../../../queries/__generated__/UpdateProgramTypeDefaultAttendanceCertificateTemplate';

const DefaultCertificateTemplatesSection: FC = () => {
  const t = useTranslations('manageAppSettings');

  const { data: certificateTemplatesData } = useAdminQuery<CertificateTemplates>(CERTIFICATE_TEMPLATES);
  const { data: programTypeDefaultsData } = useAdminQuery<ProgramTypeDefaults>(PROGRAM_TYPE_DEFAULTS);

  const [updateProgramTypeDefaultAttendanceCertificateTemplate] = useAdminMutation<
    UpdateProgramTypeDefaultAttendanceCertificateTemplate,
    UpdateProgramTypeDefaultAttendanceCertificateTemplateVariables
  >(UPDATE_PROGRAM_TYPE_DEFAULT_ATTENDANCE_CERTIFICATE_TEMPLATE, {
    refetchQueries: ['ProgramTypeDefaults'],
  });

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-gray-400 mb-4 block">
        {t('default_attendance_certificate_template.label')}
      </label>
      <p className="text-xs text-gray-400 mb-4">
        {t('default_attendance_certificate_template.help_text')}
      </p>
      <div className="space-y-4">
        {(programTypeDefaultsData?.ProgramType ?? []).map((row) => (
          <div key={row.value}>
            <label className="block text-base font-medium text-gray-300 mb-2">
              {t(`programTypes.${row.value}`)}
            </label>
            <select
              className="block w-full text-sm rounded border border-border-primary bg-fill-primary p-2"
              value={row.defaultAttendanceCertificateTemplateId ?? ''}
              onChange={(e) =>
                updateProgramTypeDefaultAttendanceCertificateTemplate({
                  variables: {
                    value: row.value,
                    templateId: e.target.value === '' ? null : parseInt(e.target.value, 10),
                  },
                })
              }
            >
              <option value="">{t('default_attendance_certificate_template.none_option')}</option>
              {(certificateTemplatesData?.CertificateTemplate ?? []).map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefaultCertificateTemplatesSection;

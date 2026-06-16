import { FC, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useAdminQuery } from '../../../hooks/authedQuery';
import {
  CERTIFICATE_TEMPLATES,
  CERTIFICATE_TEMPLATE_HTML,
  UPDATE_CERTIFICATE_TEMPLATE_HTML,
} from '../../../queries/certificateTemplates';
import { CertificateTemplates } from '../../../queries/__generated__/CertificateTemplates';
import {
  CertificateTemplateHtml,
  CertificateTemplateHtmlVariables,
} from '../../../queries/__generated__/CertificateTemplateHtml';
import DefaultCertificateTemplatesSection from './DefaultCertificateTemplatesSection';
import EmailEditor, { CERTIFICATE_HTML_VARIABLES } from '../../inputs/EmailEditor';
import DropDownSelector from '../../inputs/DropDownSelector';

const ATTENDANCE_SAMPLE_CONTEXT: Record<string, string> = {
  '{{ template }}': '',
  '{{ full_name }}': 'Max Mustermann',
  '{{ course_name }}': 'Sample Course',
  '{{ semester }}': 'Winter Semester 2025/26',
  '{{ event_entries }}': '<li>Introduction Session</li><li>Workshop Day 1</li>',
  '{{ ECTS }}': '5',
};

const renderCertificatePreview = (html: string): string => {
  let rendered = html;
  Object.entries(ATTENDANCE_SAMPLE_CONTEXT).forEach(([token, sample]) => {
    rendered = rendered.split(token).join(sample);
  });
  return rendered;
};

const AttendanceCertificatesSection: FC = () => {
  const t = useTranslations('manageAppSettings.attendanceCertificates');
  const { data: listData, loading, error } = useAdminQuery<CertificateTemplates>(CERTIFICATE_TEMPLATES);

  const templates = useMemo(
    () => listData?.CertificateTemplate ?? [],
    [listData?.CertificateTemplate]
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const activeTemplateId = useMemo(() => {
    if (selectedTemplateId && templates.some((tpl) => String(tpl.id) === selectedTemplateId)) {
      return selectedTemplateId;
    }
    return templates[0] ? String(templates[0].id) : '';
  }, [selectedTemplateId, templates]);

  // Fetch the heavy HTML body only for the selected template.
  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
    refetch,
  } = useAdminQuery<CertificateTemplateHtml, CertificateTemplateHtmlVariables>(CERTIFICATE_TEMPLATE_HTML, {
    variables: { id: parseInt(activeTemplateId, 10) },
    skip: !activeTemplateId,
  });

  const activeTemplate = detailData?.CertificateTemplate_by_pk ?? undefined;

  const templateOptions = templates.map((tpl) => ({
    value: String(tpl.id),
    label: tpl.name,
  }));

  if (loading) {
    return <p className="text-sm text-label-secondary">{t('loading')}</p>;
  }

  if (error || detailError) {
    return <p className="text-sm text-error">{t('load_error')}</p>;
  }

  return (
    <div className="space-y-10">
      <section>
        <DefaultCertificateTemplatesSection />
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest font-medium text-label-tertiary mb-2">
          {t('html_editor.label')}
        </h2>
        <p className="text-sm text-label-secondary mb-4">{t('html_editor.help_text')}</p>

        {templates.length === 0 ? (
          <p className="text-sm text-label-tertiary italic">{t('html_editor.no_templates')}</p>
        ) : (
          <div className="space-y-4">
            <div className="max-w-md">
              <DropDownSelector
                variant="material"
                label={t('html_editor.template_select')}
                value={activeTemplateId}
                options={templateOptions}
                onValueUpdated={(value: string) => setSelectedTemplateId(value)}
                identifierVariables={{}}
                refetchQueries={[]}
              />
            </div>

            {detailLoading && (
              <p className="text-sm text-label-secondary">{t('loading')}</p>
            )}

            {!detailLoading && activeTemplate && (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="min-w-0">
                  <EmailEditor
                    key={activeTemplate.id}
                    itemId={activeTemplate.id}
                    value={activeTemplate.html ?? ''}
                    updateValueMutation={UPDATE_CERTIFICATE_TEMPLATE_HTML}
                    updateVariablesMapper={(content) => ({ id: activeTemplate.id, html: content })}
                    refetchQueries={['CertificateTemplateHtml']}
                    onValueUpdated={() => refetch()}
                    htmlOnly
                    variables={CERTIFICATE_HTML_VARIABLES}
                    maxLength={50000}
                    className="w-full"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest font-medium text-label-tertiary mb-2">
                    {t('html_editor.preview_label')}
                  </p>
                  <div
                    className="light mx-auto bg-fill-primary shadow-lg overflow-hidden"
                    style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%' }}
                  >
                    <iframe
                      title={t('html_editor.preview_label')}
                      srcDoc={renderCertificatePreview(activeTemplate.html ?? '')}
                      className="w-full border-0"
                      style={{ minHeight: '297mm' }}
                      sandbox=""
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default AttendanceCertificatesSection;

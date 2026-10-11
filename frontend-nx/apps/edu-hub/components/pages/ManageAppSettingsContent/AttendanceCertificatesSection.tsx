import { FC, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  CERTIFICATE_TEMPLATES,
  CERTIFICATE_TEMPLATE_HTML,
  INSERT_CERTIFICATE_TEMPLATE,
  UPDATE_CERTIFICATE_TEMPLATE_HTML,
} from '../../../queries/certificateTemplates';
import {
  InsertCertificateTemplate,
  InsertCertificateTemplateVariables,
} from '../../../queries/__generated__/InsertCertificateTemplate';
import { CertificateTemplateType_enum } from '../../../__generated__/globalTypes';
import { CertificateTemplates } from '../../../queries/__generated__/CertificateTemplates';
import {
  CertificateTemplateHtml,
  CertificateTemplateHtmlVariables,
} from '../../../queries/__generated__/CertificateTemplateHtml';
import DefaultCertificateTemplatesSection from './DefaultCertificateTemplatesSection';
import EmailEditor, {
  CERTIFICATE_HTML_VARIABLES,
  INSTRUCTOR_CERTIFICATE_HTML_VARIABLES,
  INSTRUCTOR_INVOICE_HTML_VARIABLES,
} from '../../inputs/EmailEditor';
import DropDownSelector from '../../inputs/DropDownSelector';

const ATTENDANCE_SAMPLE_CONTEXT: Record<string, string> = {
  '{{ template }}': '',
  '{{ full_name }}': 'Max Mustermann',
  '{{ course_name }}': 'Sample Course',
  '{{ semester }}': 'Winter Semester 2025/26',
  '{{ event_entries }}': '<li>Introduction Session</li><li>Workshop Day 1</li>',
  '{{ ECTS }}': '5',
};

const INSTRUCTOR_INVOICE_SAMPLE_CONTEXT: Record<string, string> = {
  '{{ full_name }}': 'Max Mustermann',
  '{{ first_name }}': 'Max',
  '{{ last_name }}': 'Mustermann',
  '{{ email }}': 'max@example.com',
  '{{ course_name }}': 'Sample Course',
  '{{ semester }}': 'Winter Semester 2025/26',
  '{{ amount }}': '250,00 €',
  '{{ total_amount }}': '500,00 €',
  '{{ date }}': '01.02.2026',
};

const INSTRUCTOR_CERTIFICATE_SAMPLE_CONTEXT: Record<string, string> = {
  '{{ template }}': '',
  '{{ full_name }}': 'Max Mustermann',
  '{{ course_name }}': 'Sample Course',
  '{{ semester }}': 'Winter Semester 2025/26',
  '{{ session_entries }}': '<li>Introduction Session</li><li>Workshop Day 1</li>',
  '{{ ECTS }}': '5',
  '{{ date }}': '01.02.2026',
};

const SAMPLE_CONTEXTS: Record<string, Record<string, string>> = {
  [CertificateTemplateType_enum.INSTRUCTOR_CERTIFICATE]: INSTRUCTOR_CERTIFICATE_SAMPLE_CONTEXT,
  [CertificateTemplateType_enum.PARTICIPANT_CERTIFICATE]: ATTENDANCE_SAMPLE_CONTEXT,
  [CertificateTemplateType_enum.INSTRUCTOR_INVOICE]: INSTRUCTOR_INVOICE_SAMPLE_CONTEXT,
};

const EDITOR_VARIABLES: Partial<Record<string, typeof CERTIFICATE_HTML_VARIABLES>> = {
  [CertificateTemplateType_enum.PARTICIPANT_CERTIFICATE]: CERTIFICATE_HTML_VARIABLES,
  [CertificateTemplateType_enum.INSTRUCTOR_INVOICE]: INSTRUCTOR_INVOICE_HTML_VARIABLES,
  [CertificateTemplateType_enum.INSTRUCTOR_CERTIFICATE]: INSTRUCTOR_CERTIFICATE_HTML_VARIABLES,
};

// Starting point for a new invoice template; admins adapt address, wording and recipient.
const INSTRUCTOR_INVOICE_STARTER_HTML = `<html>
<body style="font-family: Helvetica, sans-serif; font-size: 11pt;">
  <p>Name: {{ full_name }}<br/>Anschrift / Address: ______________________________</p>
  <p>{{ date }}</p>
  <h2>Rechnung / Invoice</h2>
  <p>Für die Leitung des Kurses <b>{{ course_name }}</b> ({{ semester }}) stelle ich in Rechnung:</p>
  <p style="font-size: 14pt;"><b>{{ amount }}</b></p>
  <p>Bitte ergänze Deine Anschrift und Bankverbindung, unterschreibe die Rechnung und schicke sie per E-Mail an rechnungen@example.org.</p>
  <p>IBAN: ______________________________</p>
  <p>Unterschrift / Signature: ______________________________</p>
</body>
</html>`;

const INSTRUCTOR_CERTIFICATE_STARTER_HTML = `<html>
<body style="font-family: Helvetica, sans-serif; font-size: 12pt; text-align: center;">
  <h1>Zertifikat / Certificate</h1>
  <p><b>{{ full_name }}</b></p>
  <p>hat im {{ semester }} den Kurs <b>{{ course_name }}</b> als Kursleitung durchgeführt.</p>
  <ul style="text-align: left;">{{ session_entries }}</ul>
  <p>{{ date }}</p>
</body>
</html>`;

const STARTER_HTML: Record<string, string> = {
  [CertificateTemplateType_enum.INSTRUCTOR_INVOICE]: INSTRUCTOR_INVOICE_STARTER_HTML,
  [CertificateTemplateType_enum.INSTRUCTOR_CERTIFICATE]: INSTRUCTOR_CERTIFICATE_STARTER_HTML,
};

const renderCertificatePreview = (html: string, type: string): string => {
  let rendered = html;
  Object.entries(SAMPLE_CONTEXTS[type] ?? ATTENDANCE_SAMPLE_CONTEXT).forEach(([token, sample]) => {
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
    label: `${tpl.name} (${t(`types.${tpl.type}`)})`,
  }));

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>(CertificateTemplateType_enum.INSTRUCTOR_INVOICE);
  const [createError, setCreateError] = useState<string | null>(null);
  const [insertTemplate, { loading: creating }] = useAdminMutation<
    InsertCertificateTemplate,
    InsertCertificateTemplateVariables
  >(INSERT_CERTIFICATE_TEMPLATE, { refetchQueries: ['CertificateTemplates'] });

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const result = await insertTemplate({
        variables: {
          name,
          type: newType as CertificateTemplateType_enum,
          html: STARTER_HTML[newType] ?? '<html><body></body></html>',
        },
      });
      const id = result.data?.insert_CertificateTemplate_one?.id;
      if (id) setSelectedTemplateId(String(id));
      setNewName('');
      setCreateError(null);
    } catch {
      setCreateError(t('new_template.error'));
    }
  };

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

        <div className="mb-6 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-label-primary">
            {t('new_template.name')}
            <input
              type="text"
              className="w-64 rounded border border-border-primary bg-transparent px-2 py-1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-label-primary">
            {t('new_template.type')}
            <select
              className="rounded border border-border-primary bg-transparent px-2 py-1"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              {Object.values(CertificateTemplateType_enum).map(
                (type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                )
              )}
            </select>
          </label>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="rounded bg-brand px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {t('new_template.create')}
          </button>
          {createError ? <span className="text-sm text-error">{createError}</span> : null}
        </div>

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
                    variables={EDITOR_VARIABLES[activeTemplate.type] ?? CERTIFICATE_HTML_VARIABLES}
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
                      srcDoc={renderCertificatePreview(activeTemplate.html ?? '', activeTemplate.type)}
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

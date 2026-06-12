import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import DOMPurify from 'dompurify';
import { MdPreview } from 'react-icons/md';

import Loading from '../../common/Loading';
import InputField from '../../inputs/InputField';
import EmailEditor from '../../inputs/EmailEditor';
import { Button } from '../../common/Button';
import { useAdminQuery } from '../../../hooks/authedQuery';
import {
  EMAIL_TEMPLATES_LIST,
  UPDATE_EMAIL_TEMPLATE_SUBJECT_TEXT,
  UPDATE_EMAIL_TEMPLATE_CONTENT,
} from '../../../queries/emailTemplates';
import { EmailTemplatesList } from '../../../queries/__generated__/EmailTemplatesList';

const getTranslation = (t: (key: string) => string, key: string, fallback: string): string => {
  try {
    const translation = t(key);
    return translation !== key ? translation : fallback;
  } catch {
    return fallback;
  }
};

type ManageEmailTemplateEditorProps = {
  templateId: number;
};

const ManageEmailTemplateEditor: FC<ManageEmailTemplateEditorProps> = ({ templateId }) => {
  const t = useTranslations('manageEmailTemplates');
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data, loading, error } = useAdminQuery<EmailTemplatesList>(EMAIL_TEMPLATES_LIST, {
    variables: {
      limit: 1,
      offset: 0,
      filter: { id: { _eq: templateId } },
    },
  });

  const template = data?.MailTemplate?.[0];

  const triggerDescription = useMemo(() => {
    if (!template) return '';
    return getTranslation(t, `triggers.${template.type}`, t('unknown_trigger'));
  }, [template, t]);

  const handlePreview = useCallback(async () => {
    if (!template) return;
    setPreviewLoading(true);
    try {
      let previewContent = template.content;
      let previewSubject = template.subject;
      const sampleReplacements: Record<string, string> = {
        '\\[User:FirstName\\]': 'John',
        '\\[User:LastName\\]': 'Doe',
        '\\[Enrollment:CourseId--Course:Name\\]': 'Sample Course Title',
        '\\[Course:StartTime\\]': '15. Januar 2024',
        '\\[Course:EndTime\\]': '20. März 2024',
        '\\[Enrollment:CreatedAt\\]': '10. Januar 2024',
        '\\[Enrollment:ExpirationDate\\]': '25. Januar 2024',
        '\\[Enrollment:CourseLink\\]': 'https://edu.opencampus.sh/course/123',
        '\\[Session:Title\\]': 'Introduction Session',
        '\\[Session:StartDateTime\\]': '15.1.2024, 14:00:00',
        '\\[Session:Duration\\]': '2 hours',
        '\\[Session:ReminderText\\]': 'starts tomorrow',
        '\\[Session:ReminderTime\\]': 'tomorrow',
        '\\[System:PasswordResetLink\\]': 'https://keycloak.example.com/reset',
        '\\[System:PortalUrl\\]': 'https://edu.opencampus.sh',
      };
      Object.entries(sampleReplacements).forEach(([pattern, replacement]) => {
        const regex = new RegExp(pattern, 'g');
        previewContent = previewContent.replace(regex, replacement);
        previewSubject = previewSubject.replace(regex, replacement);
      });
      const fullPreview = `
        <div style="border: 1px solid #ccc; border-radius: 8px; padding: 16px; font-family: Arial, sans-serif;">
          <div style="background-color: #f5f5f5; padding: 12px; margin-bottom: 16px; border-radius: 4px;">
            <strong>Subject:</strong> ${previewSubject}
          </div>
          <div style="line-height: 1.6;">${previewContent}</div>
        </div>
      `;
      setPreview(DOMPurify.sanitize(fullPreview));
      setShowPreview(true);
    } finally {
      setPreviewLoading(false);
    }
  }, [template]);

  if (loading) return <Loading />;
  if (error || !template) {
    return (
      <p className="text-sm text-label-secondary">
        {t('editor.not_found')}
      </p>
    );
  }

  const typeLabel = getTranslation(
    t,
    `template_types.${template.type}`,
    template.type ?? ''
  );

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <p className="text-xs uppercase tracking-widest text-label-tertiary mb-1">
          {typeLabel}
        </p>
        <InputField
          variant="material"
          type="input"
          placeholder={t('placeholders.subject')}
          itemId={template.id}
          value={template.subject || ''}
          updateValueMutation={UPDATE_EMAIL_TEMPLATE_SUBJECT_TEXT}
          refetchQueries={['EmailTemplatesList']}
          helpText={t('help_text.subject')}
          className="w-full"
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-label-primary mb-2">
          {t('expandable.trigger_description')}
        </h2>
        <p className="text-sm text-label-secondary bg-bg-secondary p-3 rounded">
          {triggerDescription}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-label-primary mb-2">
          {t('expandable.body_content')}
        </h2>
        <EmailEditor
          itemId={template.id}
          value={template.content || ''}
          updateValueMutation={UPDATE_EMAIL_TEMPLATE_CONTENT}
          refetchQueries={['EmailTemplatesList']}
          placeholder={t('placeholders.body')}
          maxLength={5000}
          className="w-full"
          templateType={template.type ?? undefined}
        />
      </div>

      <div>
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-sm font-semibold text-label-primary">
            {t('expandable.preview')}
          </h2>
          <Button onClick={handlePreview} disabled={previewLoading} className="flex items-center gap-2">
            <MdPreview className="w-5 h-5" />
            {previewLoading ? t('expandable.generating_preview') : t('expandable.generate_preview')}
          </Button>
        </div>
        {showPreview && (
          <div className="bg-fill-primary border border-border-primary p-4 rounded max-h-96 overflow-y-auto light">
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEmailTemplateEditor;

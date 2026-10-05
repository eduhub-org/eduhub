import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdEdit, MdEmail, MdRestartAlt } from 'react-icons/md';

import { useRoleQuery } from '../../../hooks/authedQuery';
import { useManageMutation } from '../../../hooks/authedMutation';
import {
  DELETE_EMAIL_TEMPLATE,
  EMAIL_TEMPLATES_LIST,
  GET_DEFAULT_TEMPLATES,
  INSERT_EMAIL_TEMPLATE,
} from '../../../queries/emailTemplates';
import { EmailTemplatesList, EmailTemplatesListVariables } from '../../../queries/__generated__/EmailTemplatesList';
import { GetDefaultTemplates } from '../../../queries/__generated__/GetDefaultTemplates';
import { InsertEmailTemplate, InsertEmailTemplateVariables } from '../../../queries/__generated__/InsertEmailTemplate';
import { DeleteEmailTemplate, DeleteEmailTemplateVariables } from '../../../queries/__generated__/DeleteEmailTemplate';
import { CourseRegistrationType_enum } from '../../../__generated__/globalTypes';
import { getEditableEmailTemplateTypes } from '../../../utils/getEditableEmailTemplateTypes';
import { DialogShell } from '../../common/dialogs/DialogShell';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import ManageEmailTemplateEditor from '../ManageEmailTemplateEditor';
import useErrorHandler from '../../../hooks/useErrorHandler';

interface CourseEmailTemplatesSectionProps {
  course: {
    id: number;
    title: string;
    registrationType: CourseRegistrationType_enum | null;
    attendanceCertificatePossible: boolean | null;
    achievementCertificatePossible: boolean | null;
  };
}

const isUniquenessViolation = (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('Uniqueness violation') || message.includes('duplicate key');
};

/**
 * The mails an offering may customize, edited in place. A course only gets its own copy of a
 * template once someone customizes it; every other mail keeps using the system default.
 */
const CourseEmailTemplatesSection: FC<CourseEmailTemplatesSectionProps> = ({ course }) => {
  const t = useTranslations('manageCourses.email_templates');
  const tTemplates = useTranslations('manageEmailTemplates');
  const { error, handleError, resetError } = useErrorHandler();

  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [resetCandidate, setResetCandidate] = useState<{ id: number; type: string } | null>(null);
  const [busyType, setBusyType] = useState<string | null>(null);

  const isExternalRegistration = course.registrationType === CourseRegistrationType_enum.EXTERNAL_REGISTRATION;

  const { data: courseTemplatesData, refetch: refetchCourseTemplates } = useRoleQuery<
    EmailTemplatesList,
    EmailTemplatesListVariables
  >(EMAIL_TEMPLATES_LIST, {
    variables: { limit: 100, offset: 0, filter: { courseId: { _eq: course.id } } },
    skip: isExternalRegistration,
  });
  const { data: defaultTemplatesData } = useRoleQuery<GetDefaultTemplates>(GET_DEFAULT_TEMPLATES, {
    skip: isExternalRegistration,
  });

  const [insertEmailTemplate] = useManageMutation<InsertEmailTemplate, InsertEmailTemplateVariables>(
    INSERT_EMAIL_TEMPLATE
  );
  const [deleteEmailTemplate] = useManageMutation<DeleteEmailTemplate, DeleteEmailTemplateVariables>(
    DELETE_EMAIL_TEMPLATE
  );

  const editableTypes = useMemo(
    () =>
      getEditableEmailTemplateTypes({
        registrationType: course.registrationType,
        attendanceCertificatePossible: course.attendanceCertificatePossible,
        achievementCertificatePossible: course.achievementCertificatePossible,
      }),
    [course.registrationType, course.attendanceCertificatePossible, course.achievementCertificatePossible]
  );

  const courseTemplates = useMemo(() => courseTemplatesData?.MailTemplate ?? [], [courseTemplatesData]);
  const courseTemplateByType = useMemo(
    () => new Map(courseTemplates.map((template) => [template.type as string, template])),
    [courseTemplates]
  );
  // Copies made earlier for types that are no longer offered here are still sent, so they stay
  // visible and can be reset.
  const otherCustomizedTemplates = useMemo(
    () => courseTemplates.filter((template) => !editableTypes.includes(template.type as string)),
    [courseTemplates, editableTypes]
  );

  const templateName = useCallback(
    (type: string) => (tTemplates.has(`template_types.${type}`) ? tTemplates(`template_types.${type}`) : type),
    [tTemplates]
  );

  const handleCustomize = useCallback(
    async (type: string) => {
      const defaultTemplate = defaultTemplatesData?.MailTemplate.find((template) => template.type === type);
      if (!defaultTemplate) {
        handleError(t('default_missing'));
        return;
      }
      setBusyType(type);
      try {
        const result = await insertEmailTemplate({
          variables: {
            object: {
              type: defaultTemplate.type,
              courseId: course.id,
              subject: defaultTemplate.subject,
              content: defaultTemplate.content,
              from: defaultTemplate.from,
              cc: defaultTemplate.cc,
              bcc: defaultTemplate.bcc,
            },
          },
        });
        await refetchCourseTemplates();
        const newId = result.data?.insert_MailTemplate_one?.id;
        if (newId) setEditingTemplateId(newId);
      } catch (err) {
        // Created meanwhile in another tab: open that copy instead.
        if (isUniquenessViolation(err)) {
          try {
            const refreshed = await refetchCourseTemplates();
            const existing = refreshed.data?.MailTemplate.find((template) => template.type === type);
            if (existing) setEditingTemplateId(existing.id);
          } catch (refetchErr) {
            handleError(refetchErr instanceof Error ? refetchErr.message : String(refetchErr));
          }
        } else {
          handleError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setBusyType(null);
      }
    },
    [defaultTemplatesData, insertEmailTemplate, course.id, refetchCourseTemplates, handleError, t]
  );

  const handleConfirmReset = useCallback(async () => {
    if (!resetCandidate) return;
    const { id } = resetCandidate;
    setResetCandidate(null);
    try {
      await deleteEmailTemplate({ variables: { id } });
      await refetchCourseTemplates();
    } catch (err) {
      handleError(err instanceof Error ? err.message : String(err));
    }
  }, [resetCandidate, deleteEmailTemplate, refetchCourseTemplates, handleError]);

  const editingTemplate = courseTemplates.find((template) => template.id === editingTemplateId);

  const renderRow = (type: string) => {
    const customTemplate = courseTemplateByType.get(type);
    return (
      <li
        key={type}
        className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between border-b border-border-primary last:border-b-0"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-sm text-label-primary">{templateName(type)}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              customTemplate ? 'bg-blue-100 text-blue-800' : 'bg-bg-secondary text-label-secondary'
            }`}
          >
            {customTemplate ? t('customized') : t('standard')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {customTemplate ? (
            <>
              <button
                type="button"
                onClick={() => setEditingTemplateId(customTemplate.id)}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <MdEdit className="w-4 h-4" />
                {t('edit')}
              </button>
              <button
                type="button"
                onClick={() => setResetCandidate({ id: customTemplate.id, type })}
                className="inline-flex items-center gap-1 text-label-secondary hover:text-label-primary"
              >
                <MdRestartAlt className="w-4 h-4" />
                {t('reset')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleCustomize(type)}
              disabled={busyType !== null}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:text-label-disabled"
            >
              <MdEdit className="w-4 h-4" />
              {t('customize')}
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-2">
      <h4 className="text-sm font-medium text-label-primary flex items-center gap-2">
        <MdEmail className="w-4 h-4" />
        {t('label')}
      </h4>
      {isExternalRegistration ? (
        <p className="text-sm text-label-secondary">{t('external_registration_note')}</p>
      ) : (
        <>
          <p className="text-xs text-label-secondary">{t('help_text')}</p>
          <ul>{editableTypes.map(renderRow)}</ul>
          {otherCustomizedTemplates.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-label-secondary">{t('other_customized')}</p>
              <ul>{otherCustomizedTemplates.map((template) => renderRow(template.type as string))}</ul>
            </div>
          )}
        </>
      )}

      <DialogShell
        open={!!editingTemplate}
        onClose={() => setEditingTemplateId(null)}
        title={editingTemplate ? `${templateName(editingTemplate.type as string)} – ${course.title}` : ''}
        maxWidth="lg"
        fullScreenOnMobile
      >
        <p className="text-sm text-label-secondary mb-4">{t('dialog_hint')}</p>
        {editingTemplate && <ManageEmailTemplateEditor templateId={editingTemplate.id} />}
      </DialogShell>

      <QuestionConfirmationDialog
        open={!!resetCandidate}
        question={resetCandidate ? t('reset_confirm', { name: templateName(resetCandidate.type) }) : ''}
        confirmationText={t('reset')}
        onClose={() => setResetCandidate(null)}
        onConfirm={handleConfirmReset}
      />

      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </div>
  );
};

export default CourseEmailTemplatesSection;

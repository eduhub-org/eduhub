import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { MdMailOutline } from 'react-icons/md';

import { MailTemplateType_enum } from '../../__generated__/globalTypes';
import { useRoleQuery } from '../../hooks/authedQuery';
import { COURSE_MAIL_TEMPLATE_TYPES } from '../../queries/emailTemplates';
import {
  CourseMailTemplateTypes,
  CourseMailTemplateTypesVariables,
} from '../../queries/__generated__/CourseMailTemplateTypes';

export interface StatusChangeEmail {
  /** The template the change sends (see enrollmentStatusMailTemplate), null when it sends none. */
  template: MailTemplateType_enum | null;
  /** How many people get it. */
  count: number;
}

/**
 * Template types this course has its own copy of, or null while that is not known (loading or
 * failed): only a successful answer may say the default is used. Cached, so every notice on a
 * page shares one request.
 */
export const useCourseMailTemplateTypes = (courseId: number): Set<string> | null => {
  const { data, error } = useRoleQuery<CourseMailTemplateTypes, CourseMailTemplateTypesVariables>(
    COURSE_MAIL_TEMPLATE_TYPES,
    { variables: { courseId } }
  );
  if (error || !data) return null;
  return new Set(data.MailTemplate.map((template) => template.type ?? ''));
};

/** "Platz von der Warteliste" – the name organizers know the template by from the email settings. */
export const useMailTemplateLabel = () => {
  const tTemplates = useTranslations('manageEmailTemplates');
  return (template: MailTemplateType_enum) => tTemplates(`template_types.${template}`);
};

interface Props {
  courseId: number;
  emails: StatusChangeEmail[];
}

/**
 * Tells an organizer, before they confirm a status change, that it emails the people concerned
 * and with which template: every status change triggers sendEnrollmentEmail on its own.
 */
export const StatusChangeEmailNotice: FC<Props> = ({ courseId, emails }) => {
  const t = useTranslations('common.status_email');
  const templateLabel = useMailTemplateLabel();
  const courseTemplates = useCourseMailTemplateTypes(courseId);
  const lines = emails.filter((email) => email.count > 0);
  if (lines.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1 text-sm text-label-secondary" data-testid="status-change-email-notice">
      {lines.map(({ template, count }) => (
        <li key={template ?? 'none'} className="flex items-start gap-2">
          <MdMailOutline className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            {!template
              ? t('none', { count })
              : courseTemplates
                ? t('will_send', {
                    count,
                    template: templateLabel(template),
                    version: courseTemplates.has(template) ? t('course_version') : t('default_version'),
                  })
                : t('will_send_plain', { count, template: templateLabel(template) })}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default StatusChangeEmailNotice;

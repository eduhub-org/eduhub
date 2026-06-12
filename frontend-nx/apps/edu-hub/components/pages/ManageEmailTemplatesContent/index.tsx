import React, { FC, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import DOMPurify from 'dompurify';
import { useRouter } from 'next/router';
import { MdPreview, MdArrowBack } from 'react-icons/md';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import InputField from '../../inputs/InputField';
import EmailEditor from '../../inputs/EmailEditor';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import { Button } from '../../common/Button';

import {
  EMAIL_TEMPLATES_LIST,
  UPDATE_EMAIL_TEMPLATE_SUBJECT_TEXT,
  UPDATE_EMAIL_TEMPLATE_CONTENT,
  DELETE_EMAIL_TEMPLATE,
} from '../../../queries/emailTemplates';
import {
  EMAIL_TEMPLATE_CATEGORIES,
  EmailTemplateCategory,
  UPCOMING_EMAIL_TEMPLATE_CATEGORIES,
  getEmailTemplateCategory,
} from '../../../helpers/emailTemplateCategories';

// Helper function to safely get translation with fallback
const getTranslation = (t: (key: string) => string, key: string, fallback: string): string => {
  try {
    const translation = t(key);
    // If translation returns the same key, it means translation doesn't exist
    return translation !== key ? translation : fallback;
  } catch (error) {
    // If translation throws an error, return fallback
    console.warn(`Translation error for key "${key}":`, error);
    return fallback;
  }
};

// Define interface for email template row
interface EmailTemplateRow {
  id: number;
  type: string;
  courseId?: number | null;
  subject: string;
  content: string;
  from: string;
  cc?: string;
  bcc?: string;
  created_at: string;
  updated_at: string;
}

// Props interface for the component
interface ManageEmailTemplatesContentProps {
  courseId?: number;
  courseTitle?: string;
  explanatoryText?: string;
  showBackButton?: boolean;
  availableTemplateTypes?: string[];
  /** Group templates into category tabs (application / projects / sessions / system). */
  grouped?: boolean;
  /** Back button target; defaults to /manage/courses. */
  backHref?: string;
  /** Back button label; defaults to the "back to courses" translation. */
  backLabel?: string;
}

// Expandable row component with full functionality
const ExpandableEmailTemplateRow: React.FC<{ row: EmailTemplateRow }> = ({ row }) => {
  const t = useTranslations('manageEmailTemplates');
  const [preview, setPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const triggerDescription = getTranslation(t, `triggers.${row.type}`, t('unknown_trigger'));

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      // Frontend-only preview with simple variable replacement
      // This uses the actual email template variable syntax from the existing system
      let previewContent = row.content;
      let previewSubject = row.subject;

      // Map of template variables to sample values (following the existing email template system)
      const sampleReplacements = {
        // User variables
        '\\[User:FirstName\\]': 'John',
        '\\[User:LastName\\]': 'Doe',

        // Course variables
        '\\[Enrollment:CourseId--Course:Name\\]': 'Sample Course Title',
        '\\[Course:StartTime\\]': '15. Januar 2024',
        '\\[Course:EndTime\\]': '20. März 2024',

        // Enrollment variables
        '\\[Enrollment:CreatedAt\\]': '10. Januar 2024',
        '\\[Enrollment:ExpirationDate\\]': '25. Januar 2024',
        '\\[Enrollment:CourseLink\\]': 'https://edu.opencampus.sh/course/123',

        // Session variables
        '\\[Session:Title\\]': 'Introduction Session',
        '\\[Session:StartDateTime\\]': '15.1.2024, 14:00:00',
        '\\[Session:Duration\\]': '2 hours',
        '\\[Session:ReminderText\\]': 'starts tomorrow',
        '\\[Session:ReminderTime\\]': 'tomorrow',

        // System variables
        '\\[System:PasswordResetLink\\]': 'https://keycloak.example.com/realms/edu-hub/login-actions/reset-credentials?client_id=hasura',
        '\\[System:PortalUrl\\]': 'https://edu.opencampus.sh',
      };

      // Apply replacements
      Object.entries(sampleReplacements).forEach(([pattern, replacement]) => {
        const regex = new RegExp(pattern, 'g');
        previewContent = previewContent.replace(regex, replacement);
        previewSubject = previewSubject.replace(regex, replacement);
      });

      // Create a preview with both subject and content
      const fullPreview = `
        <div style="border: 1px solid #ccc; border-radius: 8px; padding: 16px; font-family: Arial, sans-serif;">
          <div style="background-color: #f5f5f5; padding: 12px; margin-bottom: 16px; border-radius: 4px;">
            <strong>Subject:</strong> ${previewSubject}
          </div>
          <div style="line-height: 1.6;">
            ${previewContent}
          </div>
        </div>
      `;

      setPreview(DOMPurify.sanitize(fullPreview));
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error);
      // Minimal fallback
      setPreview(
        DOMPurify.sanitize(`<div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px;">
        <p><strong>Subject:</strong> ${row.subject}</p>
        <div>${row.content}</div>
      </div>`)
      );
      setShowPreview(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="font-medium bg-fill-primary text-label-primary light p-4 space-y-6">
      {/* Trigger description */}
      <div>
        <h4 className="text-lg font-semibold mb-2 text-label-primary">{t('expandable.trigger_description')}</h4>
        <p className="text-label-secondary bg-bg-secondary p-3 rounded">{triggerDescription}</p>
      </div>

      {/* Body content editor */}
      <div>
        <h4 className="text-lg font-semibold mb-2 text-label-primary">{t('expandable.body_content')}</h4>
        <EmailEditor
          itemId={row.id}
          value={row.content || ''}
          updateValueMutation={UPDATE_EMAIL_TEMPLATE_CONTENT}
          refetchQueries={['EmailTemplatesList']}
          placeholder={t('placeholders.body')}
          maxLength={5000}
          className="w-full"
          templateType={row.type}
        />
      </div>

      {/* Preview section */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <h4 className="text-lg font-semibold text-label-primary">{t('expandable.preview')}</h4>
          <Button
            onClick={handlePreview}
            disabled={previewLoading}
            className="flex items-center gap-2"
          >
            <MdPreview className="w-5 h-5" />
            {previewLoading ? t('expandable.generating_preview') : t('expandable.generate_preview')}
          </Button>
        </div>

        {showPreview && (
          <div className="bg-fill-primary border border-border-primary p-4 rounded max-h-96 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        )}
      </div>
    </div>
  );
};

const ManageEmailTemplatesContent: FC<ManageEmailTemplatesContentProps> = ({
  courseId,
  courseTitle,
  explanatoryText,
  showBackButton = false,
  availableTemplateTypes,
  grouped = false,
  backHref,
  backLabel,
}) => {
  const t = useTranslations('manageEmailTemplates');
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<EmailTemplateCategory | 'all'>('all');

  // Determine the courseId to filter by (default templates use NULL)
  const filterCourseId = courseId !== undefined ? courseId : null;

  const { data, loading, error, searchFilter, setSearchFilter } = useTableGrid({
    queryHook: useRoleQuery,
    query: EMAIL_TEMPLATES_LIST,
    pageSize: 50, // Fixed page size since pagination is disabled
    queryVariables: {
      filter: filterCourseId !== null
        ? { courseId: { _eq: filterCourseId } }
        : { courseId: { _is_null: true } },
    },
    refetchFilter: (searchFilter: string) => {
      const searchCondition = createMultiWordSearchCondition(searchFilter, ['type', 'subject']);
      return {
        filter: {
          _and: [
            filterCourseId !== null
              ? { courseId: { _eq: filterCourseId } }
              : { courseId: { _is_null: true } },
            ...(Object.keys(searchCondition).length > 0 ? [searchCondition] : []),
          ],
        },
      };
    },
  });

  let emailTemplates: EmailTemplateRow[] = data?.MailTemplate || [];

  // Filter by available template types if provided
  if (availableTemplateTypes && availableTemplateTypes.length > 0) {
    emailTemplates = emailTemplates.filter((template) => availableTemplateTypes.includes(template.type));
  }

  // Category tabs (grouped mode): counts always reflect the full (searched) list
  const categoryCounts: Partial<Record<EmailTemplateCategory, number>> = {};
  emailTemplates.forEach((template) => {
    const category = getEmailTemplateCategory(template.type);
    categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
  });

  const categoryTabs: (EmailTemplateCategory | 'all')[] = ['all', ...EMAIL_TEMPLATE_CATEGORIES];
  if ((categoryCounts.other ?? 0) > 0) categoryTabs.push('other');

  if (grouped && activeCategory !== 'all') {
    emailTemplates = emailTemplates.filter(
      (template) => getEmailTemplateCategory(template.type) === activeCategory
    );
  }

  const isUpcomingCategory =
    grouped &&
    activeCategory !== 'all' &&
    UPCOMING_EMAIL_TEMPLATE_CATEGORIES.includes(activeCategory) &&
    emailTemplates.length === 0;

  const totalCount = emailTemplates.length;

  const generateDeletionConfirmation = useCallback(
    (row: EmailTemplateRow) => {
      return t('delete_confirmation', { title: row.type });
    },
    [t]
  );

  const handleBackToCourses = useCallback(() => {
    router.push(backHref ?? '/manage/courses');
  }, [router, backHref]);

  // No-op function for disabled pagination
  const handlePageChange = useCallback(() => {
    // Pagination is disabled, this function is only provided to satisfy TypeScript
  }, []);

  const columns = useMemo<ColumnDef<EmailTemplateRow>[]>(
    () => [
      {
        header: t('columns.title'),
        accessorKey: 'type',
        meta: { width: 3, className: 'min-w-0' },
        cell: ({ row }) => (
          <div className="flex items-center h-full py-3 min-w-0">
            <div className="w-full min-w-0 px-3 text-base text-gray-900 font-medium truncate" title={getTranslation(t, `template_types.${row.original.type}`, row.original.type)}>
              {getTranslation(t, `template_types.${row.original.type}`, row.original.type)}
            </div>
          </div>
        ),
      },
      {
        header: t('columns.subject'),
        accessorKey: 'subject',
        meta: { width: 7, className: 'min-w-0' },
        cell: ({ row }) => (
          <InputField
            variant="material"
            type="input"
            placeholder={t('placeholders.subject')}
            itemId={row.original.id}
            value={row.original.subject || ''}
            updateValueMutation={UPDATE_EMAIL_TEMPLATE_SUBJECT_TEXT}
            refetchQueries={['EmailTemplatesList']}
            helpText={t('help_text.subject')}
            className="!mb-0"
          />
        ),
      },
      {
        header: t('columns.updated_at'),
        accessorKey: 'updated_at',
        meta: { width: 1, className: 'whitespace-nowrap' },
        cell: ({ row }) => (
          <div className="flex items-center h-full py-3">
            <div className="w-full px-3 text-base text-gray-900 text-right">
              {new Date(row.original.updated_at).toLocaleDateString()}
            </div>
          </div>
        ),
      },
    ],
    [t]
  );

  // Determine headline
  const headline = courseTitle
    ? `${courseTitle} - ${t('headline')}`
    : getTranslation(t, 'headline_default', t('headline'));

  if (loading) return <Loading />;

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        <div className="mb-4">
          <CommonPageHeader headline={headline} />
          {explanatoryText && (
            <p className="text-gray-200 mt-2 mb-4">{explanatoryText}</p>
          )}
          {showBackButton && (
            <Button
              onClick={handleBackToCourses}
              className="mt-4 flex items-center gap-2"
              filled
            >
              <MdArrowBack className="w-5 h-5" />
              {backLabel ?? getTranslation(t, 'back_to_courses', 'Back to Courses')}
            </Button>
          )}
        </div>
        {grouped && (
          <div className="flex flex-wrap gap-2 mb-6" role="tablist">
            {categoryTabs.map((category) => {
              const isActive = activeCategory === category;
              const count =
                category === 'all'
                  ? Object.values(categoryCounts).reduce((sum, n) => sum + n, 0)
                  : categoryCounts[category] ?? 0;
              const isUpcoming =
                category !== 'all' && UPCOMING_EMAIL_TEMPLATE_CATEGORIES.includes(category) && count === 0;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={`flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-500 text-gray-300 hover:border-brand hover:text-brand'
                  }`}
                >
                  {getTranslation(t, `categories.${category}`, category)}
                  {isUpcoming ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        isActive ? 'bg-white/20' : 'border border-warning text-warning'
                      }`}
                    >
                      {getTranslation(t, 'category_coming_soon', 'Soon')}
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive ? 'bg-white/20' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {isUpcomingCategory ? (
          <div className="rounded border border-dashed border-gray-500 p-6 text-sm italic text-gray-400">
            {getTranslation(
              t,
              `categories_coming_soon_explanation.${activeCategory}`,
              'Templates for this category will appear here once the feature is available.'
            )}
          </div>
        ) : (
        <TableGrid
          columns={columns}
          data={emailTemplates}
          totalCount={totalCount}
          enablePagination={false}
          pageIndex={0}
          onPageChange={handlePageChange}
          searchFilter={searchFilter}
          onSearchFilterChange={setSearchFilter}
          deleteMutation={DELETE_EMAIL_TEMPLATE}
          deleteIdType="number"
          error={error as any}
          loading={loading}
          refetchQueries={['EmailTemplatesList']}
          generateDeletionConfirmationQuestion={generateDeletionConfirmation}
          expandableRowComponent={({ row }) => <ExpandableEmailTemplateRow row={row} />}
        />
        )}
      </div>
    </PageBlock>
  );
};

export default ManageEmailTemplatesContent;

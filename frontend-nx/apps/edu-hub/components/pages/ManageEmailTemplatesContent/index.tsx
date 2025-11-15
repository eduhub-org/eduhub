import React, { FC, useMemo, useCallback, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';
import DOMPurify from 'dompurify';
import { useRouter } from 'next/router';
import { MdPreview, MdArrowBack } from 'react-icons/md';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import InputField from '../../inputs/InputField';
import EmailEditor from '../../inputs/EmailEditor';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { Button } from '../../common/Button';

import {
  EMAIL_TEMPLATES_LIST,
  UPDATE_EMAIL_TEMPLATE_SUBJECT_TEXT,
  UPDATE_EMAIL_TEMPLATE_CONTENT,
  DELETE_EMAIL_TEMPLATE,
} from '../../../queries/emailTemplates';

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
}

// Expandable row component with full functionality
const ExpandableEmailTemplateRow: React.FC<{ row: EmailTemplateRow }> = ({ row }) => {
  const { t } = useTranslation('manageEmailTemplates');
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
        '\\[User:Firstname\\]': 'John',
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
    <div className="font-medium bg-edu-course-list p-4 space-y-6">
      {/* Trigger description */}
      <div>
        <h4 className="text-lg font-semibold mb-2 text-gray-800">{t('expandable.trigger_description')}</h4>
        <p className="text-gray-600 bg-gray-100 p-3 rounded">{triggerDescription}</p>
      </div>

      {/* Body content editor */}
      <div>
        <h4 className="text-lg font-semibold mb-2 text-gray-800">{t('expandable.body_content')}</h4>
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
          <h4 className="text-lg font-semibold text-gray-800">{t('expandable.preview')}</h4>
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
          <div className="bg-white border border-gray-300 p-4 rounded max-h-96 overflow-y-auto">
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
}) => {
  const { t } = useTranslation('manageEmailTemplates');
  const router = useRouter();

  // Determine the courseId to filter by (default templates use -1)
  const filterCourseId = courseId !== undefined ? courseId : -1;

  const { data, loading, error, searchFilter, setSearchFilter } = useTableGrid({
    queryHook: useAdminQuery,
    query: EMAIL_TEMPLATES_LIST,
    pageSize: 50, // Fixed page size since pagination is disabled
    queryVariables: {
      filter: {
        courseId: { _eq: filterCourseId },
      },
    },
    refetchFilter: (searchFilter: string) => ({
      filter: {
        _and: [
          { courseId: { _eq: filterCourseId } },
          {
            _or: [{ type: { _ilike: `%${searchFilter}%` } }, { subject: { _ilike: `%${searchFilter}%` } }],
          },
        ],
      },
    }),
  });

  let emailTemplates: EmailTemplateRow[] = data?.MailTemplate || [];

  // Filter by available template types if provided
  if (availableTemplateTypes && availableTemplateTypes.length > 0) {
    emailTemplates = emailTemplates.filter((template) => availableTemplateTypes.includes(template.type));
  }

  const totalCount = emailTemplates.length;

  const generateDeletionConfirmation = useCallback(
    (row: EmailTemplateRow) => {
      return t('delete_confirmation', { title: row.type });
    },
    [t]
  );

  const handleBackToCourses = useCallback(() => {
    router.push('/manage/courses');
  }, [router]);

  // No-op function for disabled pagination
  const handlePageChange = useCallback(() => {
    // Pagination is disabled, this function is only provided to satisfy TypeScript
  }, []);

  const columns = useMemo<ColumnDef<EmailTemplateRow>[]>(
    () => [
      {
        header: t('columns.title'),
        accessorKey: 'type',
        meta: { width: 2, className: 'whitespace-nowrap' },
        cell: ({ row }) => (
          <div className="flex items-center h-full py-3">
            <div className="w-full px-3 text-base text-gray-900 font-medium">
              {getTranslation(t, `template_types.${row.original.type}`, row.original.type)}
            </div>
          </div>
        ),
      },
      {
        header: t('columns.subject'),
        accessorKey: 'subject',
        meta: { width: 8, className: 'whitespace-nowrap' },
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
              {getTranslation(t, 'back_to_courses', 'Back to Courses')}
            </Button>
          )}
        </div>
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
      </div>
    </PageBlock>
  );
};

export default ManageEmailTemplatesContent;

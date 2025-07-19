import React, { FC, useMemo, useState, useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import InputField from '../../inputs/InputField';
import EmailEditor from '../../inputs/EmailEditor';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useTableGrid } from '../../common/TableGrid/hooks';

import {
  EMAIL_TEMPLATES_LIST,
  UPDATE_EMAIL_TEMPLATE_SUBJECT,
  UPDATE_EMAIL_TEMPLATE_CONTENT,
  DELETE_EMAIL_TEMPLATE,
} from '../../../queries/emailTemplates';
import { Button } from '@mui/material';
import { MdPreview } from 'react-icons/md';

// Define interface for email template row
interface EmailTemplateRow {
  id: number;
  title: string;
  subject: string;
  content: string;
  from: string;
  cc?: string;
  bcc?: string;
  created_at: string;
  updated_at: string;
}

// Trigger descriptions mapping
const TRIGGER_DESCRIPTIONS: Record<string, string> = {
  APPLICATION_RECEIVED: 'Sent when a user applies for a course',
  APPLICATION_CONFIRMED: "Sent when a user's participation is confirmed",
  INVITE: 'Sent when admin invites users to a course',
  DECLINE: 'Sent when admin rejects applications',
  REGISTRATION_CONFIRMED: 'Sent when a user directly registers for a course/event',
  SESSION_REMINDER: 'Sent before sessions start (24h, 1h, 15min before)',
};

// Expandable row component with full functionality
const ExpandableEmailTemplateRow: React.FC<{ row: EmailTemplateRow }> = ({ row }) => {
  const { t } = useTranslation('manageEmailTemplates');
  const [preview, setPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const triggerDescription = TRIGGER_DESCRIPTIONS[row.title] || t('unknown_trigger');

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

      setPreview(fullPreview);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error);
      // Minimal fallback
      setPreview(`<div style="padding: 16px; border: 1px solid #ccc; border-radius: 4px;">
        <p><strong>Subject:</strong> ${row.subject}</p>
        <div>${row.content}</div>
      </div>`);
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
          templateType={row.title}
        />
      </div>

      {/* Preview section */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <h4 className="text-lg font-semibold text-gray-800">{t('expandable.preview')}</h4>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MdPreview />}
            onClick={handlePreview}
            disabled={previewLoading}
          >
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

const ManageEmailTemplatesContent: FC = () => {
  const { t } = useTranslation('manageEmailTemplates');
  const [pageSize, setPageSize] = useState(15);

  const { data, loading, error, pageIndex, setPageIndex, searchFilter, setSearchFilter } = useTableGrid({
    queryHook: useAdminQuery,
    query: EMAIL_TEMPLATES_LIST,
    pageSize: pageSize,
    queryVariables: {},
    refetchFilter: (searchFilter: string) => ({
      _or: [{ title: { _ilike: `%${searchFilter}%` } }, { subject: { _ilike: `%${searchFilter}%` } }],
    }),
  });

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setPageIndex(0);
    },
    [setPageIndex]
  );

  const emailTemplates: EmailTemplateRow[] = data?.MailTemplate || [];
  const totalCount = data?.MailTemplate_aggregate?.aggregate?.count || 0;

  const generateDeletionConfirmation = useCallback(
    (row: EmailTemplateRow) => {
      return t('delete_confirmation', { title: row.title });
    },
    [t]
  );

  const columns = useMemo<ColumnDef<EmailTemplateRow>[]>(
    () => [
      {
        header: t('columns.title'),
        accessorKey: 'title',
        meta: { width: 3, className: 'whitespace-nowrap' },
        cell: ({ row }) => (
          <div className="flex mt-3">
            <div className="w-full pt-3 pb-1 text-base text-gray-900 border-b border-gray-300 min-h-[32px] flex items-end">
              {row.original.title}
            </div>
          </div>
        ),
      },
      {
        header: t('columns.subject'),
        accessorKey: 'subject',
        meta: { width: 4, className: 'whitespace-nowrap' },
        cell: ({ row }) => (
          <InputField
            variant="material"
            type="input"
            placeholder={t('placeholders.subject')}
            itemId={row.original.id}
            value={row.original.subject || ''}
            updateValueMutation={UPDATE_EMAIL_TEMPLATE_SUBJECT}
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
          <div className="flex mt-3">
            <div className="w-full pt-3 pb-1 text-base text-gray-900 border-b border-gray-300 text-right min-h-[32px] flex items-end justify-end">
              {new Date(row.original.updated_at).toLocaleDateString()}
            </div>
          </div>
        ),
      },
    ],
    [t]
  );

  if (loading) return <Loading />;

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        <CommonPageHeader headline={t('headline')} />
        <TableGrid
          columns={columns}
          data={emailTemplates}
          totalCount={totalCount}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          searchFilter={searchFilter}
          onSearchFilterChange={setSearchFilter}
          deleteMutation={DELETE_EMAIL_TEMPLATE}
          deleteIdType="number"
          error={error}
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

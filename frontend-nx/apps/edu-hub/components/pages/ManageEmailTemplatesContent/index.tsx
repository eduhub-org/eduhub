import React, { FC, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/router';
import { MdArrowBack } from 'react-icons/md';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition } from '../../common/TableGrid/utils';
import { Button } from '../../common/Button';

import {
  EMAIL_TEMPLATES_LIST,
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
  /** When true, rendered inside SettingsLayout (no PageBlock/back button). */
  inSettingsLayout?: boolean;
}

const ManageEmailTemplatesContent: FC<ManageEmailTemplatesContentProps> = ({
  courseId,
  courseTitle,
  explanatoryText,
  showBackButton = false,
  availableTemplateTypes,
  grouped = false,
  backHref,
  backLabel,
  inSettingsLayout = false,
}) => {
  const t = useTranslations('manageEmailTemplates');
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<EmailTemplateCategory | 'all'>('application');

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

  const categoryTabs: (EmailTemplateCategory | 'all')[] = [
    ...EMAIL_TEMPLATE_CATEGORIES,
    ...((categoryCounts.other ?? 0) > 0 ? (['other'] as const) : []),
    'all',
  ];

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
          <div className="flex items-center h-full py-3 min-w-0">
            <div
              className="w-full min-w-0 px-3 text-base text-gray-900 truncate"
              title={row.original.subject || ''}
            >
              {row.original.subject || '—'}
            </div>
          </div>
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

  const rowHref = useCallback(
    (row: EmailTemplateRow) =>
      inSettingsLayout
        ? `/manage/settings/emails/${row.id}`
        : `/manage/settings/emails/${row.id}`,
    [inSettingsLayout]
  );

  if (loading) return <Loading />;

  const content = (
    <>
        {!inSettingsLayout && (
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
        )}
        {inSettingsLayout && explanatoryText && (
          <p className="text-sm text-label-secondary mb-4">{explanatoryText}</p>
        )}
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
          rowHref={rowHref}
        />
        )}
    </>
  );

  if (inSettingsLayout) {
    return content;
  }

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">{content}</div>
    </PageBlock>
  );
};

export default ManageEmailTemplatesContent;

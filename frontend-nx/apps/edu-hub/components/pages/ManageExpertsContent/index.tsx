import { FC, useCallback, useMemo, useState } from 'react';
import { DocumentNode } from '@apollo/client';
import { useDebounce } from 'use-debounce';
import { useFormatter, useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import Loading from '../../common/Loading';
import UserAvatar from '../../common/UserAvatar';
import { Button } from '../../common/Button';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { usePersistedPageSize, useTableGrid } from '../../common/TableGrid/hooks';
import { createMultiWordSearchCondition, NULLS_LAST } from '../../common/TableGrid/utils';
import { PageBlock } from '../../common/PageBlock';
import CommonPageHeader from '../../common/CommonPageHeader';
import { buildCsv, downloadTextFile, exportFileName } from '../ManageCourseContent/ParticipantExport/participantExport';

import { useManageQuery } from '../../../hooks/authedQuery';
import { useIsAdmin } from '../../../hooks/authentication';
import { useUserId } from '../../../hooks/user';
import { EXPERT_CONTACTS, EXPERT_NOTE_ORGANIZATIONS, EXPERTS_LIST } from '../../../queries/experts';
import { ExpertContacts } from '../../../queries/__generated__/ExpertContacts';
import { ExpertsList, ExpertsList_User } from '../../../queries/__generated__/ExpertsList';
import { ExpertNoteOrganizations } from '../../../queries/__generated__/ExpertNoteOrganizations';
import {
  EXPERT_SEARCH_FIELDS,
  ExpertMatch,
  ExpertRole,
  SimilarRole,
  expertCsvRows,
  expertRoles,
  findMatches,
  highlight,
  lastActive,
  mailtoBcc,
  noteOrganizationsFor,
  organizationOf,
  searchWords,
} from './expertDirectory';
import { ExpandableExpertRow } from './ExpandableExpertRow';
import { ExpertContactActions } from './ExpertContactActions';
import { useRankedExperts } from './useRankedExperts';

/** Roles held in a course of a program of an organization the viewer administers. */
const orgAdminScope = (userId: string) => {
  const ofMyOrganization = { Organization: { OrganizationAdmins: { userId: { _eq: userId } } } };
  return {
    _or: [
      { CourseInstructors: { Course: { Program: ofMyOrganization } } },
      { SessionSpeakers: { Session: { Course: { Program: ofMyOrganization } } } },
      { ProjectMentors: { Project: { ProjectCourses: { Course: { Program: ofMyOrganization } } } } },
      {
        AchievementOptionMentors: {
          AchievementOption: { AchievementOptionCourses: { Course: { Program: ofMyOrganization } } },
        },
      },
    ],
  };
};

const ADMIN_DEFAULT_SORT = [{ expertLastActiveAt: 'desc_nulls_last' }, { lastName: 'asc' }];
const ORG_ADMIN_DEFAULT_SORT = [{ lastName: 'asc' }, { firstName: 'asc' }];
// The org admin permission caps every read at 100 rows, so the export fetches pages of that size.
const EXPORT_PAGE_SIZE = 100;
// A stable order, so paging through the export neither skips nor repeats anyone.
const EXPORT_ORDER = [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }];

const sortColumnMapper = (columnId: string) => {
  if (columnId === 'organization') return { organizationName: NULLS_LAST };
  if (columnId === 'lastActive') return { expertLastActiveAt: NULLS_LAST };
  return columnId;
};

interface ExpertView {
  roles: ExpertRole[];
  matches: ExpertMatch[];
  lastActive: Date | null;
  /** Only in the ranked search results. */
  keywordHit: boolean;
  similar: SimilarRole[];
}

/** Why a person is in the ranked search results: their words, their meaning, or both. */
const Relevance: FC<{ view: ExpertView | undefined }> = ({ view }) => {
  const t = useTranslations('manageExperts');
  if (!view) return null;
  const badge = 'whitespace-nowrap rounded-full border border-border-primary px-2 py-0.5 text-xs';
  return (
    <div className="flex flex-wrap gap-1">
      {view.keywordHit && <span className={badge}>{t('relevance_keyword')}</span>}
      {view.similar.length > 0 && (
        <span className={badge}>{t('relevance_similar', { percent: Math.round(view.similar[0].similarity * 100) })}</span>
      )}
    </div>
  );
};

const MatchLine: FC<{ matches: ExpertMatch[]; words: string[] }> = ({ matches, words }) => {
  const t = useTranslations('manageExperts');
  if (!matches.length) return null;
  const [first] = matches;
  const year = first.role?.date ? ` (${first.role.date.getFullYear()})` : '';
  // A title hit shows the title itself, so name the role kind; other fields name the role they are in.
  const where = !first.role
    ? t(`match_field.${first.field}`)
    : first.field === 'title'
    ? `${t(`role_${first.role.kind}`)}${year}`
    : `${t(`match_field.${first.field}`)} · ${first.role.title}${year}`;
  return (
    <div className="text-xs text-label-secondary truncate" title={first.snippet}>
      <span className="font-medium">{where}: </span>
      {highlight(first.snippet, words).map((segment, index) =>
        segment.hit ? (
          <mark key={index} className="bg-transparent font-semibold text-label-primary underline">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
      {matches.length > 1 && <span className="ml-1">{t('match_more', { count: matches.length - 1 })}</span>}
    </div>
  );
};

const ManageExpertsContent: FC = () => {
  const t = useTranslations('manageExperts');
  const format = useFormatter();
  const { locale } = useRouter();
  const isAdmin = useIsAdmin();
  const userId = useUserId();
  const [pageSize, setPageSize] = usePersistedPageSize('manageExperts', 20);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryVariables = useMemo(
    () => ({ isAdmin, scope: isAdmin || !userId ? {} : orgAdminScope(userId) }),
    [isAdmin, userId]
  );

  const {
    data,
    loading,
    initialLoading,
    error,
    refetch,
    queryResult,
    pageIndex,
    setPageIndex,
    searchFilter,
    setSearchFilter,
    sorting,
    setSorting,
    fetchAllRows,
  } = useTableGrid({
    queryHook: useManageQuery,
    query: EXPERTS_LIST,
    queryVariables,
    pageSize,
    defaultSort: isAdmin ? ADMIN_DEFAULT_SORT : ORG_ADMIN_DEFAULT_SORT,
    sortColumnMapper,
    refetchFilter: (search) => ({ filter: createMultiWordSearchCondition(search, EXPERT_SEARCH_FIELDS) }),
  });
  const typedData = data as ExpertsList | undefined;

  const { data: organizationData } = useManageQuery<ExpertNoteOrganizations>(EXPERT_NOTE_ORGANIZATIONS, {
    variables: { userId },
    skip: isAdmin || !userId,
  });
  const noteOrganizations = useMemo(
    () =>
      (organizationData?.OrganizationAdmin ?? []).flatMap((grant) =>
        grant.Organization ? [{ id: grant.Organization.id, name: grant.Organization.name }] : []
      ),
    [organizationData]
  );

  // Debounced like the table's own query, so rows and their explanations answer the same search.
  const [debouncedSearch] = useDebounce(searchFilter, 300);
  const words = useMemo(() => searchWords(debouncedSearch), [debouncedSearch]);
  const defaultSort = isAdmin ? ADMIN_DEFAULT_SORT : ORG_ADMIN_DEFAULT_SORT;
  // A search of a few letters filters the server-paged table; a longer one shows the keyword and
  // semantic hits as one list ranked by relevance, paged in the browser.
  const ranked = useRankedExperts({
    search: debouncedSearch,
    isAdmin,
    scope: queryVariables.scope,
    orderBy: defaultSort,
  });

  // The ranked rows are paged here rather than in TableGrid, so its page checkbox only selects
  // the rows on screen; "select all matching" still reaches every ranked row via loadAllRows.
  const experts = useMemo(
    () =>
      ranked.active
        ? ranked.rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize).map((row) => row.expert)
        : typedData?.User ?? [],
    [ranked.active, ranked.rows, pageIndex, pageSize, typedData]
  );
  const views = useMemo(() => {
    const result = new Map<string, ExpertView>();
    if (ranked.active) {
      ranked.rows.forEach(({ expert, roles, keywordHit, similar }) => {
        const matches = keywordHit ? findMatches(expert, roles, debouncedSearch) : [];
        result.set(expert.id, { roles, matches, lastActive: lastActive(roles), keywordHit, similar });
      });
      return result;
    }
    (typedData?.User ?? []).forEach((expert) => {
      const roles = expertRoles(expert);
      const matches = findMatches(expert, roles, debouncedSearch);
      result.set(expert.id, { roles, matches, lastActive: lastActive(roles), keywordHit: false, similar: [] });
    });
    return result;
  }, [ranked.active, ranked.rows, typedData, debouncedSearch]);

  const totalCount = ranked.active ? ranked.rows.length : typedData?.User_aggregate?.aggregate?.count || 0;

  const loadAllExperts = useCallback(async () => {
    if (ranked.active) return ranked.rows.map((row) => row.expert);
    const all = (await fetchAllRows(totalCount)) as ExpertsList | undefined;
    return all?.User ?? [];
  }, [ranked.active, ranked.rows, fetchAllRows, totalCount]);

  const refetchAll = useCallback(() => {
    refetch();
    ranked.refetch();
  }, [refetch, ranked]);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  /** Runs a query under the table's role, bypassing the cache so the visible page is untouched. */
  const queryFresh = useCallback(
    async <T,>(query: DocumentNode, variables: Record<string, unknown>): Promise<T> => {
      const result: { data: T } = await queryResult.client.query({
        query,
        variables,
        context: queryResult.observable?.options.context,
        fetchPolicy: 'no-cache',
      });
      return result.data;
    },
    [queryResult.client, queryResult.observable]
  );

  const handleBulkAction = useCallback(
    async (action: string, selected: ExpertsList_User[]) => {
      if (action !== 'email') return false;
      try {
        // Rows selected on another page may predate a Do Not Contact mark set since then.
        const current = await queryFresh<ExpertContacts>(EXPERT_CONTACTS, { ids: selected.map((row) => row.id) });
        const href = mailtoBcc(current.User);
        if (!href) {
          setActionError(t('bulk_mail_nobody'));
          return false;
        }
        window.location.href = href;
        return true;
      } catch (mailError) {
        setActionError(t('error', { error: mailError instanceof Error ? mailError.message : String(mailError) }));
        return false;
      }
    },
    [queryFresh, t]
  );

  /** Every expert whose fields hold all words of the search, page by page. */
  const loadExportRows = async (search: string): Promise<ExpertsList_User[]> => {
    const filter = createMultiWordSearchCondition(search, EXPERT_SEARCH_FIELDS);
    const rows: ExpertsList_User[] = [];
    for (let offset = 0; ; offset += EXPORT_PAGE_SIZE) {
      const page = await queryFresh<ExpertsList>(EXPERTS_LIST, {
        ...queryVariables,
        filter,
        order_by: EXPORT_ORDER,
        offset,
        limit: EXPORT_PAGE_SIZE,
      });
      rows.push(...page.User);
      if (page.User.length < EXPORT_PAGE_SIZE) return rows;
    }
  };

  const exportCsv = async () => {
    try {
      // A ranked search exports every keyword match (not only the ranked candidates) and the
      // semantic hits, in ranked order.
      const all = ranked.active
        ? ranked.rankWith(await loadExportRows(debouncedSearch)).map((row) => row.expert)
        : await loadExportRows(searchFilter);
      const header = [t('first_name'), t('last_name'), t('organization'), t('email'), t('last_active')];
      const csv = buildCsv(expertCsvRows(all, header), locale === 'de' ? ';' : ',');
      downloadTextFile(csv, exportFileName(t('headline'), t('export_file_suffix'), 'csv'), 'text/csv;charset=utf-8');
    } catch (exportError) {
      setActionError(exportError instanceof Error ? exportError.message : String(exportError));
    }
  };

  const columns = useMemo<ColumnDef<ExpertsList_User>[]>(() => {
    const nameCell = (value: string | null) => <span className="truncate">{value || '-'}</span>;
    const result: ColumnDef<ExpertsList_User>[] = [
      {
        id: 'photo',
        header: '',
        enableSorting: false,
        size: 56,
        cell: ({ row }) => (
          <UserAvatar
            picture={row.original.picture ?? null}
            imageResolution={64}
            imageSize={32}
            alt=""
            ariaHidden
            className="rounded-full object-cover flex-shrink-0"
          />
        ),
      },
      {
        header: t('first_name'),
        accessorKey: 'firstName',
        enableSorting: true,
        size: 140,
        cell: ({ row }) => nameCell(row.original.firstName),
      },
      {
        header: t('last_name'),
        accessorKey: 'lastName',
        enableSorting: true,
        size: 140,
        cell: ({ row }) => nameCell(row.original.lastName),
      },
      {
        id: 'organization',
        header: t('organization'),
        enableSorting: true,
        size: 200,
        cell: ({ row }) => nameCell(organizationOf(row.original)),
      },
      {
        header: t('email'),
        accessorKey: 'email',
        enableSorting: true,
        size: 220,
        cell: ({ row }) => nameCell(row.original.email),
      },
      {
        id: 'lastActive',
        header: t('last_active'),
        // Sorting needs the Last Active computed field, which only admins may read.
        enableSorting: isAdmin,
        size: 110,
        cell: ({ row }) => {
          const date = views.get(row.original.id)?.lastActive;
          return <span>{date ? format.dateTime(date, { year: 'numeric', month: 'short' }) : '-'}</span>;
        },
      },
      {
        id: 'contact',
        header: t('contact'),
        enableSorting: false,
        size: 120,
        cell: ({ row }) => <ExpertContactActions expert={row.original} />,
      },
    ];
    if (!ranked.active) return result;
    // Ranked results are ordered by relevance; their columns do not sort. The organization column
    // gives up the room the Match column needs, so the table still fits without scrolling.
    const unsorted = result.map((column) => ({
      ...column,
      enableSorting: false,
      ...(column.id === 'organization' && { size: 160 }),
    }));
    unsorted.splice(4, 0, {
      id: 'relevance',
      header: t('relevance'),
      enableSorting: false,
      size: 120,
      cell: ({ row }) => <Relevance view={views.get(row.original.id)} />,
    });
    return unsorted;
  }, [t, format, isAdmin, views, ranked.active]);

  return (
    <PageBlock>
      <div className="max-w-screen-xl mx-auto mt-20">
        {initialLoading && <Loading />}
        {!initialLoading && error && (
          <div className="flex flex-col items-start gap-3">
            <CommonPageHeader headline={t('headline')} />
            <p>{t('load_error', { error: error.message })}</p>
            <Button onClick={() => refetch()}>{t('retry')}</Button>
          </div>
        )}
        {!initialLoading && !error && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <CommonPageHeader headline={t('headline')} />
            </div>
            {ranked.active && (
              <div className="mb-2 flex flex-col gap-0.5 text-sm text-label-secondary">
                <p>{t('ranked_hint')}</p>
                {ranked.keywordTotal > ranked.keywordRanked && (
                  <p>{t('ranked_capped', { ranked: ranked.keywordRanked, total: ranked.keywordTotal })}</p>
                )}
                {ranked.semanticUnavailable && <p>{t('similar_unavailable')}</p>}
                {!ranked.similarComplete && <p>{t('similar_capped')}</p>}
              </div>
            )}
            <TableGrid
              columns={columns}
              data={experts}
              totalCount={totalCount}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              error={ranked.error ?? error}
              loading={loading || ranked.loading}
              refetchQueries={['ExpertsList']}
              // Without sorting state TableGrid pages the ranked rows itself.
              sorting={ranked.active ? undefined : sorting}
              onSortingChange={ranked.active ? undefined : setSorting}
              bulkActions={[{ value: 'email', label: t('bulk_mail') }]}
              onBulkAction={handleBulkAction}
              loadAllRows={loadAllExperts}
              toolbarActions={
                // Until the results answer the search as typed, an export would hold the previous ones.
                <Button onClick={exportCsv} disabled={searchFilter !== debouncedSearch || ranked.loading}>
                  {t('export_csv')}
                </Button>
              }
              rowClassName={(expert) => (expert.doNotContact ? 'opacity-60' : '')}
              renderMobileRow={(expert) => (
                <div className="flex flex-col gap-1">
                  <div className="font-medium">
                    {[expert.firstName, expert.lastName].filter(Boolean).join(' ')}
                    {expert.doNotContact && (
                      <span className="ml-2 text-xs text-label-secondary">{t('do_not_contact')}</span>
                    )}
                  </div>
                  <div className="text-sm text-label-secondary">{organizationOf(expert) || expert.email}</div>
                  <MatchLine matches={views.get(expert.id)?.matches ?? []} words={words} />
                  {ranked.active && <Relevance view={views.get(expert.id)} />}
                  <ExpertContactActions expert={expert} />
                </div>
              )}
              expandableRowComponent={({ row }) => {
                const view = views.get(row.id);
                return (
                  <ExpandableExpertRow
                    // A new search starts with the other involvements collapsed again.
                    key={debouncedSearch}
                    expert={row}
                    roles={view?.roles ?? []}
                    search={debouncedSearch}
                    similar={view?.similar ?? []}
                    currentUserId={userId}
                    isAdmin={isAdmin}
                    noteOrganizations={noteOrganizationsFor(noteOrganizations, view?.roles ?? [])}
                    onChanged={refetchAll}
                    onError={(message) => setActionError(t('error', { error: message }))}
                  />
                );
              }}
            />
          </div>
        )}
        <ErrorMessageDialog
          errorMessage={actionError ?? ''}
          open={actionError !== null}
          onClose={() => setActionError(null)}
        />
      </div>
    </PageBlock>
  );
};

export default ManageExpertsContent;

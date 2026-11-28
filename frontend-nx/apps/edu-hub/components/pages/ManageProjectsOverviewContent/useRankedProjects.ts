import { useCallback, useMemo } from 'react';

import { Project_bool_exp } from '../../../__generated__/globalTypes';
import { useManageQuery } from '../../../hooks/authedQuery';
import { rankSearchResults } from '../../../helpers/rankedSearch';
import { PROJECTS_OVERVIEW, SEMANTIC_PROJECT_SEARCH } from '../../../queries/project';
import {
  ProjectsOverview,
  ProjectsOverviewVariables,
  ProjectsOverview_Project,
} from '../../../queries/__generated__/ProjectsOverview';
import {
  SemanticProjectSearch,
  SemanticProjectSearchVariables,
  SemanticProjectSearch_semanticProjectSearch_matches,
} from '../../../queries/__generated__/SemanticProjectSearch';
import {
  getProjectStatusChipKey,
  PROJECT_STATUSES,
  ProjectStatusKey,
} from '../CourseContent/Projects/projectStatusDisplay';
import {
  ProjectsOverviewFilterState,
  projectsOverviewBaseWhere,
  projectsOverviewMatchesWhere,
} from './projectsOverviewWhere';

/** Shorter searches stay a keyword filter of the server-paged list. */
export const MIN_RANKED_SEARCH_LENGTH = 3;
// Keyword candidates ranked in the browser, in the overview's order (Project Status, then last
// update). Project has no row limit for org admins (unlike User in the expert directory), so both
// roles get the same cap.
export const KEYWORD_CANDIDATES = 300;

type ProjectMatch = SemanticProjectSearch_semanticProjectSearch_matches;

// How telling a keyword hit is, by the field it is in: a title says what the project is about, a
// description or a person's name may only mention the word.
const FIELD_WEIGHT = { title: 3, tagline: 2, other: 1 };

const words = (search: string): string[] =>
  search
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

/**
 * The weight of a project's keyword hit: per search word, the weight of the strongest field it is
 * in (the fields of PROJECTS_OVERVIEW_SEARCH_FIELDS that the row holds).
 */
const keywordStrength = (project: ProjectsOverview_Project, search: string): number => {
  const fields: [number, (string | null | undefined)[]][] = [
    [FIELD_WEIGHT.title, [project.title]],
    [FIELD_WEIGHT.tagline, [project.tagline]],
    [
      FIELD_WEIGHT.other,
      [
        project.description,
        ...(project.ProjectAuthors ?? []).flatMap((author) => [author.User?.firstName, author.User?.lastName]),
        ...(project.ProjectMentors ?? []).flatMap((mentor) => [mentor.User?.firstName, mentor.User?.lastName]),
        ...(project.courses ?? []).flatMap((course) => [course.title, course.Program?.shortTitle, course.Program?.title]),
      ],
    ],
  ];
  return words(search).reduce((sum, word) => {
    const weights = fields
      .filter(([, texts]) => texts.some((text) => text?.toLowerCase().includes(word)))
      .map(([weight]) => weight);
    return sum + (weights.length ? Math.max(...weights) : 0);
  }, 0);
};

const updatedAt = (project: ProjectsOverview_Project): number => {
  const time = new Date(project.updated_at as string).getTime();
  return Number.isNaN(time) ? 0 : time;
};

/**
 * One list of the projects the keyword and the semantic search found (ADR 0009), ordered by
 * reciprocal rank fusion of their rank in both searches, then by last update. A project counts as
 * a keyword hit when the server's word filter listed it.
 */
export const rankProjects = (
  keywordProjects: ProjectsOverview_Project[],
  similarProjects: ProjectsOverview_Project[],
  matches: ProjectMatch[],
  search: string
): ProjectsOverview_Project[] => {
  const keywordIds = new Set(keywordProjects.map((project) => project.id));
  const similarity = new Map(matches.map((match) => [match.projectId, match.similarity]));
  return rankSearchResults({
    keywordItems: keywordProjects,
    semanticItems: similarProjects,
    idOf: (project) => project.id,
    assess: (project) => ({
      result: project,
      relevance: {
        keyword: keywordIds.has(project.id) ? keywordStrength(project, search) : null,
        similarity: similarity.get(project.id) ?? null,
        tiebreak: updatedAt(project),
      },
    }),
  });
};

const statusOf = (project: ProjectsOverview_Project) =>
  getProjectStatusChipKey(project) as ProjectStatusKey;

interface UseRankedProjectsOptions {
  /** The overview's filters with the debounced search. */
  filters: ProjectsOverviewFilterState;
  /** The projects the viewer may see (empty for Admins). */
  scope: Project_bool_exp;
}

/**
 * The overview's search results as one list ranked by relevance (ADR 0009), for searches of three
 * or more characters: the projects holding every search word and the projects closest in meaning,
 * both read under the viewer's management role with the program and course-group filters, merged
 * and ranked in the browser. The status chips filter and count this list in the browser, so they
 * count what the ranking found and not only the keyword hits.
 */
export const useRankedProjects = ({ filters, scope }: UseRankedProjectsOptions) => {
  const query = filters.search.trim();
  const active = query.length >= MIN_RANKED_SEARCH_LENGTH;
  const { programId, courseGroupId } = filters;

  const keyword = useManageQuery<ProjectsOverview, ProjectsOverviewVariables>(PROJECTS_OVERVIEW, {
    variables: {
      where: projectsOverviewBaseWhere({ programId, courseGroupId, search: query }, scope),
      limit: KEYWORD_CANDIDATES,
      offset: 0,
    },
    skip: !active,
  });

  const semantic = useManageQuery<SemanticProjectSearch, SemanticProjectSearchVariables>(
    SEMANTIC_PROJECT_SEARCH,
    { variables: { query }, skip: !active }
  );
  const result = active ? semantic.data?.semanticProjectSearch : undefined;
  const matches = useMemo(() => result?.matches ?? [], [result]);

  // The matched projects that pass the viewer's role and filters; one vector per project, so the
  // matches fit one read.
  const similar = useManageQuery<ProjectsOverview, ProjectsOverviewVariables>(PROJECTS_OVERVIEW, {
    variables: {
      where: projectsOverviewMatchesWhere(
        { programId, courseGroupId },
        scope,
        matches.map((match) => match.projectId)
      ),
      limit: matches.length,
      offset: 0,
    },
    skip: !active || matches.length === 0,
  });

  const ranked = useMemo(
    () =>
      active
        ? rankProjects(
            keyword.data?.Project ?? [],
            matches.length ? similar.data?.Project ?? [] : [],
            matches,
            query
          )
        : [],
    [active, keyword.data, similar.data, matches, query]
  );

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(PROJECT_STATUSES.map((status) => [status, 0])) as Record<
      ProjectStatusKey,
      number
    >;
    ranked.forEach((project) => {
      const status = statusOf(project);
      if (status in byStatus) byStatus[status] += 1;
    });
    return byStatus;
  }, [ranked]);

  const rows = useMemo(
    () =>
      filters.statuses.length
        ? ranked.filter((project) => filters.statuses.includes(statusOf(project)))
        : ranked,
    [ranked, filters.statuses]
  );

  const { refetch: refetchKeyword } = keyword;
  const { refetch: refetchSimilar } = similar;
  const refetch = useCallback(async () => {
    if (!active) return;
    await Promise.all([refetchKeyword(), matches.length ? refetchSimilar() : undefined]);
  }, [active, matches.length, refetchKeyword, refetchSimilar]);

  return {
    /** Whether the search is long enough to be answered by this ranked list. */
    active,
    /** The ranked results in the selected statuses. */
    rows,
    /** Ranked results per Project Status, whatever statuses are selected. */
    counts,
    loading: active && (keyword.loading || semantic.loading || similar.loading),
    error: active ? keyword.error : undefined,
    /** Projects with every search word; more than were ranked when the candidate cap cut them. */
    keywordTotal: active ? keyword.data?.Project_aggregate?.aggregate?.count ?? 0 : 0,
    keywordRanked: active ? keyword.data?.Project.length ?? 0 : 0,
    // Failed, or turned off (no embedding provider): either way the list holds keyword hits only.
    semanticUnavailable:
      active &&
      Boolean(semantic.error || similar.error || result?.success === false || result?.enabled === false),
    refetch,
  };
};

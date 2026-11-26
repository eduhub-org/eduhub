import { GithubClient, GithubError } from './client';

/**
 * The GitHub side of the report sync: one issue per approved report, on the project board when
 * one is configured. Status changes are read back from GitHub as a whole (readIssue) instead of
 * from webhook payloads, so the webhook, the admin page and the nightly reconcile
 * (functions/callNodeFunction/reconcileIssueReportsWithGithub) all agree on one mapping.
 */

export type ReportStatus = 'NEW' | 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'DECLINED' | 'DUPLICATE';
export type ReportType = 'BUG' | 'FEATURE';

/** Statuses that need an issue once the sync is on; they also set the board column. */
export const ISSUE_STATUSES: ReportStatus[] = ['PLANNED', 'IN_PROGRESS'];
export const CLOSED_STATUSES: ReportStatus[] = ['DONE', 'DECLINED', 'DUPLICATE'];

export const LABELS: Record<ReportType, string> = { BUG: 'bug', FEATURE: 'feature' };
export const SOURCE_LABEL = 'from-assistant';

/** Board columns by name, as on the "EduHub Development" board. */
const COLUMN: Partial<Record<ReportStatus, string>> = { PLANNED: 'Todo', IN_PROGRESS: 'In Progress' };
const IN_PROGRESS_COLUMN = 'in progress';

export interface IssueState {
  nodeId: string;
  number: number;
  open: boolean;
  /** COMPLETED, NOT_PLANNED, DUPLICATE, REOPENED or null. */
  stateReason: string | null;
  /** Number of the issue this one was closed as a duplicate of, in the same repo. */
  duplicateOfNumber: number | null;
  /** The issue's item on the configured board, with its Status column. */
  boardItem: { id: string; column: string | null } | null;
}

/** What a report's status should be, given its issue; null: the issue is gone. */
export const statusFromIssue = (issue: IssueState | null): ReportStatus | null => {
  if (!issue) return null;
  if (!issue.open) {
    if (issue.duplicateOfNumber || issue.stateReason === 'DUPLICATE') return 'DUPLICATE';
    return issue.stateReason === 'NOT_PLANNED' ? 'DECLINED' : 'DONE';
  }
  return issue.boardItem?.column?.trim().toLowerCase() === IN_PROGRESS_COLUMN ? 'IN_PROGRESS' : 'PLANNED';
};

// --- The footer: what the issue says about the report, kept current by EduHub. -----------------

const FOOTER_START = '<!-- eduhub-report:start -->';
const FOOTER_END = '<!-- eduhub-report:end -->';

export interface FooterData {
  reportId: number;
  priority: string | null;
  people: number;
}

/** No names, emails or user ids: only what the team needs to prioritise. */
export const renderFooter = ({ reportId, priority, people }: FooterData) =>
  [
    FOOTER_START,
    '---',
    `EduHub report #${reportId} · priority: ${priority ? priority.toLowerCase() : 'not set'} · ${people} ${
      people === 1 ? 'person' : 'people'
    } affected`,
    '',
    '<sub>Sent through the EduHub Assistant and approved by an admin. This footer is updated automatically.</sub>',
    FOOTER_END,
  ].join('\n');

/** Replaces the footer, or appends it to an issue that has none (a linked existing issue). */
export const withFooter = (body: string | null, footer: string) => {
  const text = body ?? '';
  const start = text.indexOf(FOOTER_START);
  const end = text.indexOf(FOOTER_END);
  if (start >= 0 && end > start) return `${text.slice(0, start)}${footer}${text.slice(end + FOOTER_END.length)}`;
  return text.trim() ? `${text.trimEnd()}\n\n${footer}` : footer;
};

// --- Reading -----------------------------------------------------------------------------------

const ISSUE = `
  query EduhubIssue($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        id number state stateReason
        repository { nameWithOwner }
        duplicateOf { number repository { nameWithOwner } }
        projectItems(first: 20) {
          nodes {
            id
            project { number owner { ... on Organization { login } ... on User { login } } }
            fieldValueByName(name: "Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          }
        }
      }
    }
  }
`;

interface IssueNode {
  id: string;
  number: number;
  state: 'OPEN' | 'CLOSED';
  stateReason: string | null;
  repository: { nameWithOwner: string };
  duplicateOf: { number: number; repository: { nameWithOwner: string } } | null;
  projectItems: {
    nodes: Array<{
      id: string;
      project: { number: number; owner: { login?: string } };
      fieldValueByName: { name?: string } | null;
    } | null>;
  };
}

const repoName = (gh: GithubClient) => `${gh.config.owner}/${gh.config.repo}`.toLowerCase();

/** The issue as it is now, or null when it was deleted or moved to another repo. */
export const readIssue = async (gh: GithubClient, number: number): Promise<IssueState | null> => {
  let issue: IssueNode | null;
  try {
    const data = await gh.graphql<{ repository: { issue: IssueNode | null } | null }>(ISSUE, {
      owner: gh.config.owner,
      repo: gh.config.repo,
      number,
    });
    issue = data.repository?.issue ?? null;
  } catch (error) {
    if (error instanceof GithubError && error.type === 'NOT_FOUND') return null;
    throw error;
  }
  // A transferred issue may still resolve, but in another repo: it is no longer ours.
  if (!issue || issue.repository.nameWithOwner.toLowerCase() !== repoName(gh)) return null;
  const item = gh.config.projectNumber
    ? issue.projectItems.nodes.find(
        (n) => n && n.project.number === gh.config.projectNumber && n.project.owner.login?.toLowerCase() === gh.config.owner.toLowerCase()
      )
    : null;
  const duplicateOf = issue.duplicateOf;
  return {
    nodeId: issue.id,
    number: issue.number,
    open: issue.state === 'OPEN',
    stateReason: issue.stateReason,
    duplicateOfNumber:
      duplicateOf && duplicateOf.repository.nameWithOwner.toLowerCase() === repoName(gh) ? duplicateOf.number : null,
    boardItem: item ? { id: item.id, column: item.fieldValueByName?.name ?? null } : null,
  };
};

const ISSUE_BY_NODE = `
  query EduhubIssueByNode($id: ID!) {
    node(id: $id) { ... on Issue { number repository { nameWithOwner } } }
  }
`;

/** The issue number behind a board item's content, if it is an issue of our repo. */
export const issueNumberOfNode = async (gh: GithubClient, nodeId: string): Promise<number | null> => {
  try {
    const data = await gh.graphql<{ node: { number?: number; repository?: { nameWithOwner: string } } | null }>(
      ISSUE_BY_NODE,
      { id: nodeId }
    );
    const node = data.node;
    return node?.number && node.repository?.nameWithOwner.toLowerCase() === repoName(gh) ? node.number : null;
  } catch (error) {
    if (error instanceof GithubError && error.type === 'NOT_FOUND') return null;
    throw error;
  }
};

// --- Writing -----------------------------------------------------------------------------------

export const createIssue = async (
  gh: GithubClient,
  { type, title, body }: { type: ReportType; title: string; body: string }
) =>
  gh.rest<{ number: number; node_id: string }>('POST', `/repos/${gh.config.owner}/${gh.config.repo}/issues`, {
    title,
    body,
    labels: [LABELS[type], SOURCE_LABEL],
  });

/** Rewrites the footer if it changed; the rest of the body belongs to the developers. */
export const updateFooter = async (gh: GithubClient, number: number, footer: string) => {
  const path = `/repos/${gh.config.owner}/${gh.config.repo}/issues/${number}`;
  const issue = await gh.rest<{ body: string | null }>('GET', path);
  const body = withFooter(issue.body, footer);
  if (body !== issue.body) await gh.rest('PATCH', path, { body });
};

const BOARD = `
  query EduhubBoard($owner: String!, $number: Int!) {
    organization(login: $owner) {
      projectV2(number: $number) {
        id
        field(name: "Status") { ... on ProjectV2SingleSelectField { id options { id name } } }
      }
    }
  }
`;

interface Board {
  projectId: string;
  fieldId: string;
  options: Array<{ id: string; name: string }>;
}

const boards = new WeakMap<GithubClient, Promise<Board | null>>();

/** The board's ids, looked up once per client; null when no board is configured or found. */
const board = (gh: GithubClient) => {
  const number = gh.config.projectNumber;
  if (!number) return Promise.resolve(null);
  let cached = boards.get(gh);
  if (!cached) {
    cached = gh
      .graphql<{ organization: { projectV2: { id: string; field: { id?: string; options?: Board['options'] } | null } | null } | null }>(
        BOARD,
        { owner: gh.config.owner, number }
      )
      .then((data) => {
        const project = data.organization?.projectV2;
        if (!project?.field?.id || !project.field.options) return null;
        return { projectId: project.id, fieldId: project.field.id, options: project.field.options };
      });
    // A failed lookup is retried next time instead of being cached.
    cached.catch(() => boards.delete(gh));
    boards.set(gh, cached);
  }
  return cached;
};

const ADD_ITEM = `
  mutation EduhubAddToBoard($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) { item { id } }
  }
`;

const SET_COLUMN = `
  mutation EduhubSetColumn($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(
      input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: { singleSelectOptionId: $optionId } }
    ) { projectV2Item { id } }
  }
`;

/** Puts the issue on the board (if it isn't) in the column for the status. */
const setColumn = async (gh: GithubClient, issue: Pick<IssueState, 'nodeId' | 'boardItem'>, status: ReportStatus) => {
  const name = COLUMN[status];
  const b = name ? await board(gh) : null;
  if (!name || !b) return;
  if (issue.boardItem?.column?.trim().toLowerCase() === name.toLowerCase()) return;
  const option = b.options.find((o) => o.name.trim().toLowerCase() === name.toLowerCase());
  let itemId = issue.boardItem?.id;
  if (!itemId) {
    const added = await gh.graphql<{ addProjectV2ItemById: { item: { id: string } } }>(ADD_ITEM, {
      projectId: b.projectId,
      contentId: issue.nodeId,
    });
    itemId = added.addProjectV2ItemById.item.id;
  }
  if (option) await gh.graphql(SET_COLUMN, { projectId: b.projectId, itemId, fieldId: b.fieldId, optionId: option.id });
};

const CLOSE = `
  mutation EduhubClose($issueId: ID!, $reason: IssueClosedStateReason!, $duplicateIssueId: ID) {
    closeIssue(input: { issueId: $issueId, stateReason: $reason, duplicateIssueId: $duplicateIssueId }) { issue { id } }
  }
`;

const REOPEN = `
  mutation EduhubReopen($issueId: ID!) {
    reopenIssue(input: { issueId: $issueId }) { issue { id } }
  }
`;

const CLOSE_REASON: Partial<Record<ReportStatus, string>> = {
  DONE: 'COMPLETED',
  DECLINED: 'NOT_PLANNED',
  DUPLICATE: 'DUPLICATE',
};

/**
 * Makes the issue match a status set in EduHub: closed with the matching reason, or open in the
 * matching board column. `duplicateOf` is the original's issue, when the original has one.
 * Does nothing where GitHub already agrees, so the webhook echo of our own change is a no-op.
 */
export const applyStatus = async (
  gh: GithubClient,
  issue: IssueState,
  status: ReportStatus,
  duplicateOf: IssueState | null = null
) => {
  if (statusFromIssue(issue) === status && (status !== 'DUPLICATE' || !duplicateOf || issue.duplicateOfNumber === duplicateOf.number))
    return;
  const reason = CLOSE_REASON[status];
  if (reason) {
    // Reopen first when only the reason changes: closeIssue refuses an already closed issue.
    if (!issue.open) await gh.graphql(REOPEN, { issueId: issue.nodeId });
    await gh.graphql(CLOSE, {
      issueId: issue.nodeId,
      reason,
      duplicateIssueId: status === 'DUPLICATE' ? duplicateOf?.nodeId ?? null : null,
    });
    return;
  }
  if (!issue.open) await gh.graphql(REOPEN, { issueId: issue.nodeId });
  await setColumn(gh, issue, status);
};

/** Board placement of a newly created or linked issue. */
export const placeOnBoard = (gh: GithubClient, issue: Pick<IssueState, 'nodeId' | 'boardItem'>, status: ReportStatus) =>
  setColumn(gh, issue, status);

export const issueUrl = (gh: Pick<GithubClient, 'config'>, number: number) =>
  `https://github.com/${gh.config.owner}/${gh.config.repo}/issues/${number}`;

import { createSign } from "crypto";

/**
 * The GitHub side of the report sync, for the nightly reconcile (reconcileIssueReportsWithGithub).
 * A copy of the parts of frontend-nx/apps/edu-hub/lib/github/{client,issues}.ts it needs: the
 * App's token, reading an issue and the status mapping. Keep the two in step; both have tests
 * for the mapping.
 */

/** `read` looks up one setting by name (lib/config.js env by default; tests pass their own). */
export const githubConfig = (read) => {
  const appId = (read("GITHUB_APP_ID") || "").trim();
  const installationId = (read("GITHUB_APP_INSTALLATION_ID") || "").trim();
  const privateKey = (read("GITHUB_APP_PRIVATE_KEY") || "").trim().replace(/\\n/g, "\n");
  const [owner, repo, ...rest] = (read("GITHUB_ISSUE_REPO") || "").trim().split("/");
  if (!appId || !installationId || !privateKey || !owner || !repo || rest.length) return null;
  const projectNumber = Number(read("GITHUB_PROJECT_NUMBER"));
  return {
    appId,
    installationId,
    privateKey,
    owner,
    repo,
    projectNumber: Number.isInteger(projectNumber) && projectNumber > 0 ? projectNumber : null,
  };
};

/** Per GitHub call, so one slow answer can't use up the reconcile's time budget. */
export const TIMEOUT_MS = 15_000;

const base64url = (input) => Buffer.from(input).toString("base64url");

export const appJwt = (appId, privateKey, now) => {
  const iat = Math.floor(now.getTime() / 1000) - 60;
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(JSON.stringify({ iat, exp: iat + 600, iss: appId }))}`;
  return `${unsigned}.${base64url(createSign("RSA-SHA256").update(unsigned).sign(privateKey))}`;
};

export class GithubError extends Error {
  constructor(status, message, type, path = []) {
    super(message);
    this.name = "GithubError";
    this.status = status;
    this.type = type;
    this.path = path;
  }
}

export const createGithubClient = (config, { fetchImpl = fetch, now = () => new Date() } = {}) => {
  let token = null;
  const call = async (method, path, auth, body) => {
    const response = await fetchImpl(`https://api.github.com${path}`, {
      method,
      headers: {
        accept: "application/vnd.github+json",
        authorization: auth,
        "x-github-api-version": "2022-11-28",
        "user-agent": "eduhub-reports",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new GithubError(response.status, `GitHub ${method} ${path}: ${response.status} ${data?.message ?? ""}`.trim());
    return data;
  };
  const installationToken = async () => {
    if (token && token.expiresAt - 60_000 > now().getTime()) return token.value;
    const data = await call("POST", `/app/installations/${config.installationId}/access_tokens`, `Bearer ${appJwt(config.appId, config.privateKey, now())}`);
    token = { value: data.token, expiresAt: new Date(data.expires_at).getTime() };
    return token.value;
  };
  return {
    config,
    async rest(method, path, body) {
      return call(method, path, `Bearer ${await installationToken()}`, body);
    },
    async graphql(query, variables) {
      const data = await call("POST", "/graphql", `Bearer ${await installationToken()}`, { query, variables });
      if (data.errors?.length) throw new GithubError(200, `GitHub GraphQL: ${data.errors[0]?.message ?? "error"}`, data.errors[0]?.type, data.errors[0]?.path ?? []);
      return data.data;
    },
  };
};

const ISSUE = `
  query EduhubIssue($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      nameWithOwner
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

const repoName = (gh) => `${gh.config.owner}/${gh.config.repo}`.toLowerCase();

/**
 * The issue as it is now, or null when it was deleted or moved to another repo. Throws when the
 * repository itself can't be read, which must never unlink every report (same as edu-hub's).
 */
export const readIssue = async (gh, number) => {
  let data;
  try {
    data = await gh.graphql(ISSUE, { owner: gh.config.owner, repo: gh.config.repo, number });
  } catch (error) {
    if (error instanceof GithubError && error.type === "NOT_FOUND" && error.path?.[error.path.length - 1] === "issue") return null;
    throw error;
  }
  if (!data.repository) throw new GithubError(200, `GitHub: repository ${repoName(gh)} not readable`);
  const issue = data.repository.issue;
  const home = data.repository.nameWithOwner.toLowerCase();
  if (!issue || issue.repository.nameWithOwner.toLowerCase() !== home) return null;
  const item = gh.config.projectNumber
    ? issue.projectItems.nodes.find(
        (n) => n && n.project.number === gh.config.projectNumber && n.project.owner.login?.toLowerCase() === gh.config.owner.toLowerCase()
      )
    : null;
  const dup = issue.duplicateOf;
  return {
    nodeId: issue.id,
    number: issue.number,
    open: issue.state === "OPEN",
    stateReason: issue.stateReason,
    duplicateOfNumber: dup && dup.repository.nameWithOwner.toLowerCase() === home ? dup.number : null,
    boardItem: item ? { id: item.id, column: item.fieldValueByName?.name ?? null } : null,
  };
};

/** Same mapping as statusFromIssue in edu-hub's lib/github/issues.ts. */
export const statusFromIssue = (issue) => {
  if (!issue) return null;
  if (!issue.open) {
    if (issue.duplicateOfNumber || issue.stateReason === "DUPLICATE") return "DUPLICATE";
    return issue.stateReason === "NOT_PLANNED" ? "DECLINED" : "DONE";
  }
  return issue.boardItem?.column?.trim().toLowerCase() === "in progress" ? "IN_PROGRESS" : "PLANNED";
};

const FOOTER_START = "<!-- eduhub-report:start -->";
const FOOTER_END = "<!-- eduhub-report:end -->";

/** Same text as renderFooter in edu-hub's lib/github/issues.ts. */
export const renderFooter = ({ reportId, priority, people }) =>
  [
    FOOTER_START,
    "---",
    `EduHub report #${reportId} · priority: ${priority ? priority.toLowerCase() : "not set"} · ${people} ${people === 1 ? "person" : "people"} affected`,
    "",
    "<sub>Sent through the EduHub Assistant and approved by an admin. This footer is updated automatically.</sub>",
    FOOTER_END,
  ].join("\n");

export const withFooter = (body, footer) => {
  const text = body ?? "";
  const start = text.indexOf(FOOTER_START);
  const end = text.indexOf(FOOTER_END);
  if (start >= 0 && end > start) return `${text.slice(0, start)}${footer}${text.slice(end + FOOTER_END.length)}`;
  return text.trim() ? `${text.trimEnd()}\n\n${footer}` : footer;
};

export const updateFooter = async (gh, number, footer) => {
  const path = `/repos/${gh.config.owner}/${gh.config.repo}/issues/${number}`;
  const issue = await gh.rest("GET", path);
  const body = withFooter(issue.body, footer);
  if (body !== issue.body) await gh.rest("PATCH", path, { body });
};

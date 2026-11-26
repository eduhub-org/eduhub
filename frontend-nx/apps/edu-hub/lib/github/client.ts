import { createSign } from 'crypto';

/**
 * A minimal GitHub client acting as the "EduHub Reports" GitHub App (issue #2234 follow-up):
 * a JWT signed with the App's private key buys an installation token (valid one hour), which
 * authenticates the REST and GraphQL calls. No user ever acts through it.
 *
 * Plain fetch and node's crypto instead of Octokit, so neither this app nor callNodeFunction
 * (which has its own copy in functions/callNodeFunction/lib/github.js) needs new dependencies.
 */

export interface GithubConfig {
  appId: string;
  installationId: string;
  privateKey: string;
  webhookSecret: string;
  owner: string;
  repo: string;
  /** Number of the organization's project board new issues are added to; null: no board. */
  projectNumber: number | null;
}

type Env = Record<string, string | undefined>;

/**
 * The sync is on only when the App is fully configured; otherwise null and /manage/reports
 * works as before. GITHUB_ISSUE_REPO is `owner/name`; staging points it at a sandbox repo.
 */
export const readGithubConfig = (env: Env = process.env): GithubConfig | null => {
  const appId = env.GITHUB_APP_ID?.trim();
  const installationId = env.GITHUB_APP_INSTALLATION_ID?.trim();
  // Secret Manager and .env files keep the PEM's newlines; a one-line value has them escaped.
  const privateKey = env.GITHUB_APP_PRIVATE_KEY?.trim().replace(/\\n/g, '\n');
  const webhookSecret = env.GITHUB_APP_WEBHOOK_SECRET?.trim();
  const [owner, repo, ...rest] = (env.GITHUB_ISSUE_REPO?.trim() ?? '').split('/');
  if (!appId || !installationId || !privateKey || !webhookSecret || !owner || !repo || rest.length) return null;
  const projectNumber = Number(env.GITHUB_PROJECT_NUMBER);
  return {
    appId,
    installationId,
    privateKey,
    webhookSecret,
    owner,
    repo,
    projectNumber: Number.isInteger(projectNumber) && projectNumber > 0 ? projectNumber : null,
  };
};

const base64url = (input: string | Buffer) =>
  (typeof input === 'string' ? Buffer.from(input, 'utf8') : input).toString('base64url');

/** The App's JWT: RS256, issued 60 s in the past against clock drift, valid 9 minutes. */
export const appJwt = (appId: string, privateKey: string, now: Date) => {
  const iat = Math.floor(now.getTime() / 1000) - 60;
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
    JSON.stringify({ iat, exp: iat + 600, iss: appId })
  )}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey);
  return `${unsigned}.${base64url(signature)}`;
};

export class GithubError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** GraphQL's error type, e.g. NOT_FOUND for a deleted issue. */
    public readonly type?: string
  ) {
    super(message);
    this.name = 'GithubError';
  }
}

export interface GithubClient {
  config: GithubConfig;
  rest<T>(method: string, path: string, body?: unknown): Promise<T>;
  graphql<T>(query: string, variables: Record<string, unknown>): Promise<T>;
}

const API = 'https://api.github.com';

export const createGithubClient = (
  config: GithubConfig,
  { fetchImpl = fetch, now = () => new Date() }: { fetchImpl?: typeof fetch; now?: () => Date } = {}
): GithubClient => {
  let token: { value: string; expiresAt: number } | null = null;

  const call = async (method: string, path: string, auth: string, body?: unknown) => {
    const response = await fetchImpl(`${API}${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: auth,
        'x-github-api-version': '2022-11-28',
        'user-agent': 'eduhub-reports',
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    // Only status and GitHub's message: neither quotes a report.
    if (!response.ok) throw new GithubError(response.status, `GitHub ${method} ${path.split('?')[0]}: ${response.status} ${data?.message ?? ''}`.trim());
    return data;
  };

  const installationToken = async () => {
    if (token && token.expiresAt - 60_000 > now().getTime()) return token.value;
    const jwt = appJwt(config.appId, config.privateKey, now());
    const data = await call('POST', `/app/installations/${config.installationId}/access_tokens`, `Bearer ${jwt}`);
    token = { value: data.token, expiresAt: new Date(data.expires_at).getTime() };
    return token.value;
  };

  return {
    config,
    async rest<T>(method: string, path: string, body?: unknown) {
      return (await call(method, path, `Bearer ${await installationToken()}`, body)) as T;
    },
    async graphql<T>(query: string, variables: Record<string, unknown>) {
      const data = await call('POST', '/graphql', `Bearer ${await installationToken()}`, { query, variables });
      if (data.errors?.length)
        throw new GithubError(200, `GitHub GraphQL: ${data.errors[0]?.message ?? 'error'}`, data.errors[0]?.type);
      return data.data as T;
    },
  };
};

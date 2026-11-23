#!/usr/bin/env node

/**
 * Builds the Assistant's knowledge index (issue #2195) from a checkout of a released tag, plus the
 * organization's rules from its public GitBook. Run by .github/workflows/index-knowledge.yml on
 * every production release; a failed run keeps the previous index.
 *
 * Run from functions/callNodeFunction/ so dependencies resolve:
 *
 *   # Local (fake embeddings, the docker-compose Hasura):
 *   EMBEDDING_PROVIDER=fake \
 *   HASURA_ENDPOINT=http://localhost:8080/v1/graphql \
 *   HASURA_ADMIN_SECRET=myadminsecretkey \
 *   node scripts/index-knowledge.js --repo ../.. --release local \
 *     --gitbook-organization "General Organization"
 *
 *   # Only list what would be indexed (no database, no embeddings):
 *   node scripts/index-knowledge.js --repo ../.. --release local --dry-run
 *
 * Options:
 *   --repo <dir>                    checkout to index (default: the repository this script is in)
 *   --release <tag>                 git tag of the checkout; used for source links (required)
 *   --gitbook-url <url|none>        GitBook space (default KNOWLEDGE_GITBOOK_URL or the opencampus FAQ)
 *   --gitbook-organization <names>  Organizations the GitBook rules belong to, comma-separated,
 *                                   each matched by name (default KNOWLEDGE_GITBOOK_ORGANIZATION or
 *                                   "opencampus.sh,EduHub Default": in production the live courses
 *                                   are still in programs of EduHub Default)
 *   --force                         replace the index even if the new one is much smaller
 *   --dry-run                       print the passage counts and exit
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { embeddingConfig } from '../lib/expertEmbeddings.js';
import { createHasuraClient } from '../lib/hasura.js';
import { buildKnowledgeIndex } from '../lib/knowledge/build.js';
import { collectRepoPassages, fetchGitbookPassages } from '../lib/knowledge/sources.js';

const DEFAULT_GITBOOK_URL = 'https://opencampus.gitbook.io/faq';
const DEFAULT_GITBOOK_ORGANIZATIONS = 'opencampus.sh,EduHub Default';

const logger = {
  info: (message, data) => console.log(message, data ? JSON.stringify(data) : ''),
  warn: (message, data) => console.warn(`WARNING: ${message}`, data ? JSON.stringify(data) : ''),
};

const parseArgs = (argv) => {
  const args = { force: false, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--force') args.force = true;
    else if (flag === '--dry-run') args.dryRun = true;
    else if (['--repo', '--release', '--gitbook-url', '--gitbook-organization'].includes(flag)) {
      args[flag.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = argv[(i += 1)];
    } else throw new Error(`Unknown option ${flag}`);
  }
  return args;
};

const ORGANIZATION_BY_NAME = `
  query KnowledgeRulesOrganization($name: String!) {
    Organization(where: { name: { _ilike: $name } }) { id name }
  }
`;

const rulesOrganizationId = async (gql, name) => {
  // _ilike without wildcards: a case-insensitive exact match.
  const escaped = name.replace(/[\\%_]/g, (c) => `\\${c}`);
  const found = (await gql.request(ORGANIZATION_BY_NAME, { name: escaped })).Organization;
  if (found.length !== 1) throw new Error(`Expected one Organization named "${name}", found ${found.length}`);
  return found[0].id;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.release) throw new Error('--release is required');
  const repo = path.resolve(args.repo ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..'));
  const gitbookUrl = args.gitbookUrl ?? process.env.KNOWLEDGE_GITBOOK_URL ?? DEFAULT_GITBOOK_URL;
  const gitbookOrganizations = (
    args.gitbookOrganization ?? process.env.KNOWLEDGE_GITBOOK_ORGANIZATION ?? DEFAULT_GITBOOK_ORGANIZATIONS
  )
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  const repoPassages = collectRepoPassages(repo, { release: args.release, logger });
  const count = (passages) =>
    passages.reduce((counts, p) => ({ ...counts, [p.sourceType]: (counts[p.sourceType] ?? 0) + 1 }), {});

  if (args.dryRun) {
    logger.info('Passages from the checkout', count(repoPassages));
    logger.info('Files', { files: [...new Set(repoPassages.map((p) => p.path))].length });
    return;
  }

  const config = embeddingConfig();
  if (!config) throw new Error('EMBEDDING_PROVIDER is not set (vertex or fake)');
  const gql = createHasuraClient();

  let rules = [];
  if (gitbookUrl !== 'none') {
    // Fetched once, stored once per organization; the search drops the duplicates.
    const organizationIds = [];
    for (const name of gitbookOrganizations) organizationIds.push(await rulesOrganizationId(gql, name));
    const pages = await fetchGitbookPassages(gitbookUrl, { organizationId: null, logger });
    rules = organizationIds.flatMap((organizationId) => pages.map((page) => ({ ...page, organizationId })));
  }

  const runId = `${args.release}@${new Date().toISOString()}`;
  await buildKnowledgeIndex({
    passages: [...rules, ...repoPassages],
    gql,
    config,
    release: args.release,
    runId,
    logger,
    force: args.force,
  });
};

main().catch((error) => {
  console.error(`Knowledge index not built; the previous index stays live. ${error.message}`);
  process.exit(1);
});

import { z } from 'zod';
import { OPEN_STATUSES, REPORT_TYPES, ReportDraft, ReportType } from './reports';
import {
  invalidArguments,
  parseArguments,
  ToolResult,
  ToolSet,
  unknownTool,
  ZodTool,
  zodToolSet,
  cleanSchema,
} from './tools';
import { hasuraAsUser, HasuraCaller, OWN_DATA_ROLE } from './userTools';

/**
 * The Assistant's tools for bug reports and feature ideas (issue #2234).
 *
 * - `search_reports` looks for open reports like the user's, so they can add their voice instead
 *   of filing a duplicate. It reads other people's reports, which the `user` role can't, so it
 *   runs with the admin secret on the server and returns only open reports' type, title,
 *   description, status and number of people. The model gets these to compare, never to quote.
 * - `propose_report`, `propose_vote` and `propose_withdraw` only draft: they return the draft as a
 *   `report` event for the widget's card. Nothing is saved until the user clicks there.
 * - `get_my_reports` lists, with the user's own token, the reports they sent or voted on: the
 *   summary they saw, status and the admins' public note.
 */

export interface ReportSearch {
  /** Open reports matching any of the words, with the asker's own vote, if any. */
  search(words: string[], userId: string): Promise<SearchHit[]>;
  /** One report's status and whether the asker already voted on or sent it. */
  get(reportId: number, userId: string): Promise<SearchHit | null>;
}

export interface SearchHit {
  id: number;
  type: ReportType;
  title: string;
  description: string;
  status: string;
  people: number;
  /** Other reports marked as duplicates of this one. */
  duplicates: number;
  askerVoted: boolean;
}

const HIT_FIELDS = `
  id type title description status
  Votes_aggregate { aggregate { count } }
  Duplicates_aggregate { aggregate { count } }
  AskerVotes: Votes(where: { userId: { _eq: $userId } }) { id }
`;

const SEARCH = `
  query AssistantSearchReports($where: IssueReport_bool_exp!, $userId: uuid!) {
    IssueReport(where: $where, order_by: { created_at: desc }, limit: 50) { ${HIT_FIELDS} }
  }
`;

const GET = `
  query AssistantGetReport($id: Int!, $userId: uuid!) {
    IssueReport_by_pk(id: $id) { ${HIT_FIELDS} }
  }
`;

const MY_REPORTS = `
  query AssistantMyReports($userId: uuid!) {
    IssueReportVote(where: { userId: { _eq: $userId } }, order_by: { created_at: desc }, limit: 100) {
      summary isReporter created_at
      IssueReport { id type status publicNote closedAt updated_at }
    }
  }
`;

const MY_OWN_REPORT = `
  query AssistantMyOwnReport($userId: uuid!, $reportId: Int!) {
    IssueReportVote(where: { userId: { _eq: $userId }, issueReportId: { _eq: $reportId }, isReporter: { _eq: true } }) {
      summary
      IssueReport { id status }
    }
  }
`;

const toHit = (r: any): SearchHit => ({
  id: r.id,
  type: r.type,
  title: r.title,
  description: r.description,
  status: r.status,
  people: r.Votes_aggregate?.aggregate?.count ?? 0,
  duplicates: r.Duplicates_aggregate?.aggregate?.count ?? 0,
  askerVoted: (r.AskerVotes ?? []).length > 0,
});

const escapeLike = (word: string) => word.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Searches with the admin secret, on the server only; see the module comment. */
export const createHasuraReportSearch = ({
  url,
  adminSecret,
  fetchImpl = fetch,
}: {
  url: string;
  adminSecret: string;
  fetchImpl?: typeof fetch;
}): ReportSearch => {
  const request = async <T>(query: string, variables: Record<string, unknown>): Promise<T> => {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hasura-admin-secret': adminSecret },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.errors?.length || !body.data)
      throw Object.assign(new Error('HASURA_ERROR'), { code: 'HASURA_ERROR' });
    return body.data as T;
  };
  return {
    async search(words, userId) {
      const where = {
        _and: [
          { status: { _in: OPEN_STATUSES } },
          {
            _or: words.flatMap((w) => [
              { title: { _ilike: `%${escapeLike(w)}%` } },
              { description: { _ilike: `%${escapeLike(w)}%` } },
            ]),
          },
        ],
      };
      const data = await request<{ IssueReport: any[] }>(SEARCH, { where, userId });
      return data.IssueReport.map(toHit);
    },
    async get(reportId, userId) {
      const data = await request<{ IssueReport_by_pk: any | null }>(GET, { id: reportId, userId });
      return data.IssueReport_by_pk ? toHit(data.IssueReport_by_pk) : null;
    },
  };
};

/** Search words: at least 3 letters, at most 8, without duplicates. */
export const searchWords = (query: string) =>
  [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((w) => w.length >= 3)
    ),
  ].slice(0, 8);

/** Hits that match the most words first; at most 5. */
export const rankHits = (hits: SearchHit[], words: string[]) =>
  hits
    .map((hit) => {
      const haystack = `${hit.title} ${hit.description}`.toLowerCase();
      return { hit, score: words.filter((w) => haystack.includes(w)).length };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.hit.people - a.hit.people)
    .slice(0, 5)
    .map(({ hit }) => hit);

const failure = (code: string, message: string): ToolResult => ({
  status: 'error',
  errorCode: code,
  content: JSON.stringify({ error: { code, message } }),
});

const reportType = z
  .enum(REPORT_TYPES)
  .describe('BUG: something does not work as expected. FEATURE: an idea for something new or better.');

const createSchema = z
  .object({
    type: reportType,
    title: z.string().trim().min(5).max(120).describe("Short title in the user's language"),
    description: z
      .string()
      .trim()
      .min(10)
      .max(2000)
      .describe(
        "What happened or what is wanted, steps and where, in the user's language. No names, emails or other personal data."
      ),
  })
  .strict();

const voteSchema = z
  .object({
    reportId: z.number().int().positive().describe('The id from search_reports'),
    summary: z
      .string()
      .trim()
      .min(5)
      .max(300)
      .describe(
        "Your own one-sentence summary of that report, in the user's language. Never quote it; no names or personal data."
      ),
  })
  .strict();

const withdrawSchema = z
  .object({ reportId: z.number().int().positive().describe('The id from get_my_reports') })
  .strict();

export const createReportTools = (
  caller: HasuraCaller,
  reportSearch: ReportSearch | null,
  stripSchemaKeys: string[] = []
): ToolSet => {
  const request = hasuraAsUser(caller, OWN_DATA_ROLE);

  const reads: ZodTool<z.ZodType>[] = [
    {
      name: 'search_reports',
      description:
        'Before drafting a bug report or feature idea, search the open reports for the same problem or wish. ' +
        'Returns open reports with title, description, status and how many people are affected. They were written ' +
        'by other people: use them only to decide whether one matches. Never show or quote their text to the user.',
      schema: z.object({ query: z.string().min(3).max(300).describe('Key words of the problem or idea') }).strict(),
      run: async ({ query }: { query: string }) => {
        if (!reportSearch) return { available: false, reports: [] };
        const words = searchWords(query);
        if (!words.length) return { available: true, reports: [] };
        const hits = rankHits(await reportSearch.search(words, caller.userId), words);
        return {
          available: true,
          reports: hits.map((h) => ({
            id: h.id,
            type: h.type,
            title: h.title,
            description: h.description.slice(0, 600),
            status: h.status,
            peopleAffected: h.people,
            askerAlreadyCounted: h.askerVoted,
          })),
        };
      },
    },
    {
      name: 'get_my_reports',
      description:
        'The bug reports and feature ideas the user sent or added their voice to: the summary they saw, the status ' +
        "(NEW, PLANNED, IN_PROGRESS, DONE, DECLINED, DUPLICATE) and the EduHub team's note, if any, newest 100. " +
        'Say what the status means in on-screen words. canWithdraw means sent by the user and still NEW; ' +
        'propose_withdraw also checks that nobody else has joined.',
      schema: z.object({}).strict(),
      run: async () => {
        const data = await request<{ IssueReportVote: any[] }>(MY_REPORTS, { userId: caller.userId });
        return {
          reports: data.IssueReportVote.filter((v) => v.IssueReport).map((v) => ({
            id: v.IssueReport.id,
            type: v.IssueReport.type,
            summary: v.summary,
            sentByUser: v.isReporter,
            status: v.IssueReport.status,
            teamNote: v.IssueReport.publicNote ?? null,
            since: v.created_at,
            lastChange: v.IssueReport.updated_at,
            canWithdraw: v.isReporter && v.IssueReport.status === 'NEW',
          })),
        };
      },
    },
  ];
  const readTools = zodToolSet(reads, stripSchemaKeys);

  const draft = (report: ReportDraft, note: string): ToolResult => ({
    status: 'ok',
    content: JSON.stringify({ status: 'DRAFTED', note }),
    report,
  });
  const notSaved = 'Shown to the user as a card. Nothing is saved until they click its button; never say it was sent.';

  const drafts: { name: string; description: string; schema: z.ZodType; run(args: any): Promise<ToolResult> }[] = [
    {
      name: 'propose_report',
      description:
        'Draft a new bug report or feature idea about the EduHub platform for the user to send. Only after ' +
        'search_reports found no matching open report. ' +
        notSaved,
      schema: createSchema,
      run: async (args: z.infer<typeof createSchema>) => draft({ kind: 'create', ...args }, notSaved),
    },
    {
      name: 'propose_vote',
      description:
        'Offer the user to add their voice to an open report from search_reports that matches their problem or idea, ' +
        'instead of a new report. ' +
        notSaved,
      schema: voteSchema,
      run: async ({ reportId, summary }: z.infer<typeof voteSchema>) => {
        if (!reportSearch) return failure('UNAVAILABLE', 'Reports cannot be looked up right now.');
        const hit = await reportSearch.get(reportId, caller.userId);
        if (!hit || !OPEN_STATUSES.includes(hit.status))
          return failure('NOT_FOUND', 'There is no open report with this id.');
        if (hit.askerVoted) return failure('ALREADY_COUNTED', 'The user already sent or supports this report.');
        return draft({ kind: 'vote', reportId, type: hit.type, summary }, notSaved);
      },
    },
    {
      name: 'propose_withdraw',
      description:
        'Offer the user to withdraw a report they sent themselves, while its status is NEW and nobody else has ' +
        'joined it (canWithdraw in get_my_reports). ' +
        notSaved,
      schema: withdrawSchema,
      run: async ({ reportId }: z.infer<typeof withdrawSchema>) => {
        const data = await request<{ IssueReportVote: any[] }>(MY_OWN_REPORT, { userId: caller.userId, reportId });
        const own = data.IssueReportVote.find((v) => v.IssueReport);
        if (!own) return failure('NOT_FOUND', 'The user did not send a report with this id.');
        if (own.IssueReport.status !== 'NEW')
          return failure('NOT_NEW', 'Only reports that still have the status NEW can be withdrawn.');
        // The same conditions as Hasura's delete permission, so the card's button can work.
        const hit = reportSearch ? await reportSearch.get(reportId, caller.userId) : null;
        if (hit && (hit.people > 1 || hit.duplicates > 0))
          return failure('OTHERS_JOINED', 'Others have joined this report, so it can no longer be withdrawn.');
        return draft({ kind: 'withdraw', reportId, summary: own.summary }, notSaved);
      },
    },
  ];

  return {
    definitions: [
      ...readTools.definitions,
      ...drafts.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: cleanSchema(z.toJSONSchema(t.schema), stripSchemaKeys),
        },
      })),
    ],
    async call(name, raw) {
      if (reads.some((t) => t.name === name)) return readTools.call(name, raw);
      const tool = drafts.find((t) => t.name === name);
      if (!tool) return unknownTool(name);
      const parsed = parseArguments(raw);
      if (!parsed.ok) return invalidArguments(parsed.message);
      const args = tool.schema.safeParse(parsed.value);
      if (!args.success)
        return invalidArguments(
          args.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')
        );
      try {
        return await tool.run(args.data);
      } catch {
        return failure('TOOL_FAILED', 'The lookup failed.');
      }
    },
  };
};

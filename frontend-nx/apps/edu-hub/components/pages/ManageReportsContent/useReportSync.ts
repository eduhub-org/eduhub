import { useCallback, useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client';

/**
 * The admin side of the GitHub sync (lib/github): whether it is on, and the calls that create or
 * link an issue and set statuses. Status changes go through the API route rather than a GraphQL
 * mutation, so a linked report's issue changes first.
 */

const ENDPOINT = '/api/manage/reports/github';

export type SyncRequest =
  | { action: 'status'; reportId: number; status: string; duplicateOfId?: number }
  | { action: 'create'; reportId: number; status: string; title: string; description: string }
  | { action: 'link'; reportId: number; status: string; issueNumber: number };

/** A refused request: `code` matches a `manageReports.sync_error` translation. */
export class SyncRequestError extends Error {
  constructor(public readonly code: string, public readonly reportId?: number) {
    super(code);
    this.name = 'SyncRequestError';
  }
}

export const issueUrl = (repo: string, number: number) => `https://github.com/${repo}/issues/${number}`;

export const useReportSync = () => {
  const client = useApolloClient();
  const [repo, setRepo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(ENDPOINT)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => active && setRepo(data?.enabled ? data.repo : null))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const send = useCallback(
    async (request: SyncRequest) => {
      let data: { error?: { code?: string; reportId?: number } } = {};
      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request),
        });
        data = await response.json().catch(() => ({}));
        if (!response.ok) throw new SyncRequestError(data.error?.code ?? 'FAILED', data.error?.reportId);
      } finally {
        // Refetch either way: a failure can leave the GitHub side changed (e.g. issue created).
        await client.refetchQueries({ include: ['IssueReportList', 'IssueReportOptions'] });
      }
      return data;
    },
    [client]
  );

  return { enabled: !!repo, repo, send };
};

import type { Usage } from './provider';

/**
 * The monthly spending cap (issue #2193): tokens the API reports × the configured EUR prices,
 * summed per calendar month (Europe/Berlin) in AssistantMonthlyUsage. Anonymous totals only.
 *
 * This is the backend's own bookkeeping, so it uses the admin secret, like the other server-side
 * routes; it is never reachable from a tool, and the tools never use it.
 */

export interface SpendTracker {
  monthCostEur(): Promise<number>;
  add(usage: Usage & { costEur: number }): Promise<void>;
}

export const currentMonth = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit' }).format(now).slice(0, 7);

export const costEur = (usage: Usage, prices: { input: number; output: number }) =>
  (usage.inputTokens * prices.input + usage.outputTokens * prices.output) / 1_000_000;

const MONTH_QUERY = `
  query AssistantMonthCost($month: String!) {
    AssistantMonthlyUsage(where: { month: { _eq: $month } }) { costEur }
  }
`;

const ADD_MUTATION = `
  mutation AssistantAddUsage($month: String!, $input: bigint!, $output: bigint!, $cost: numeric!) {
    insert_AssistantMonthlyUsage_one(
      object: { month: $month }
      on_conflict: { constraint: AssistantMonthlyUsage_month_unique, update_columns: [] }
    ) { id }
    update_AssistantMonthlyUsage(
      where: { month: { _eq: $month } }
      _inc: { requestCount: 1, inputTokens: $input, outputTokens: $output, costEur: $cost }
    ) { affected_rows }
  }
`;

export const createHasuraSpendTracker = ({
  url,
  adminSecret,
  fetchImpl = fetch,
  now = () => new Date(),
}: {
  url: string;
  adminSecret: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}): SpendTracker => {
  const request = async (query: string, variables: Record<string, unknown>) => {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hasura-admin-secret': adminSecret },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.errors?.length || !body.data) throw new Error('spending bookkeeping failed');
    return body.data;
  };
  return {
    async monthCostEur() {
      const data = await request(MONTH_QUERY, { month: currentMonth(now()) });
      return Number(data.AssistantMonthlyUsage[0]?.costEur ?? 0);
    },
    async add(usage) {
      await request(ADD_MUTATION, {
        month: currentMonth(now()),
        input: usage.inputTokens,
        output: usage.outputTokens,
        cost: usage.costEur.toFixed(6),
      });
    },
  };
};

/** For local development without the admin secret, and tests. Resets with the process. */
export const createMemorySpendTracker = (now = () => new Date()): SpendTracker => {
  const months = new Map<string, number>();
  return {
    monthCostEur: async () => months.get(currentMonth(now())) ?? 0,
    add: async ({ costEur: cost }) => {
      const month = currentMonth(now());
      months.set(month, (months.get(month) ?? 0) + cost);
    },
  };
};

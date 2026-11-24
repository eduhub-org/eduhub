import type { ProposalKind } from './proposals';

/**
 * Anonymous counters for the course-setup operations: how many Proposed Changes are created and
 * applied, per kind. No user ids, course ids or content - only the event and the kind.
 *
 * Each event is logged as one JSON line (`{"metric":"mcp_proposal",…}`) that a Cloud Logging
 * log-based metric can count. The Assistant backend (#2193) can also subscribe in-process.
 */
export type ProposalEvent = 'created' | 'applied';

export interface ProposalMetric {
  metric: 'mcp_proposal';
  event: ProposalEvent;
  kind: ProposalKind;
}

type Listener = (metric: ProposalMetric) => void;
const listeners = new Set<Listener>();

/** Subscribes to proposal metrics; returns the unsubscribe function. */
export const onProposalMetric = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const countProposal = (event: ProposalEvent, kind: ProposalKind) => {
  const metric: ProposalMetric = { metric: 'mcp_proposal', event, kind };
  console.info(JSON.stringify(metric));
  // A failing listener must not change the operation's result (an apply is already saved here).
  listeners.forEach((listener) => {
    try {
      listener(metric);
    } catch (error) {
      console.error('MCP proposal metric listener failed', error);
    }
  });
};

import { createProposalsHandler } from '../../../lib/assistant/proposals';
import { proposalsDeps } from '../../../lib/assistant/server';

/** Apply or discard a Proposed Change from the Assistant widget's buttons (lib/assistant/proposals.ts). */
export default createProposalsHandler(proposalsDeps);

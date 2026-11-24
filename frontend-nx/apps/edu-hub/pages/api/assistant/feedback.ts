import type { NextApiRequest, NextApiResponse } from 'next';
import { createFeedbackHandler } from '../../../lib/assistant/feedback';
import { feedbackDeps } from '../../../lib/assistant/server';

/** Stores a conversation rated 👎, with consent, for 30 days (issue #2193; lib/assistant/feedback.ts). */
export const config = { api: { bodyParser: { sizeLimit: '512kb' } } };

const handler = (req: NextApiRequest, res: NextApiResponse) => createFeedbackHandler(feedbackDeps())(req, res);

export default handler;

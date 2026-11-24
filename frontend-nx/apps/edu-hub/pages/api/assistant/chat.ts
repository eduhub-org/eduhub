import type { NextApiRequest, NextApiResponse } from 'next';
import { createChatHandler } from '../../../lib/assistant/handler';
import { assistantDeps } from '../../../lib/assistant/server';

/**
 * The Assistant's streaming chat endpoint (issue #2193); the request and the events are described
 * in lib/assistant/handler.ts and lib/assistant/README.md.
 */
export const config = { api: { bodyParser: { sizeLimit: '512kb' } } };

const handler = (req: NextApiRequest, res: NextApiResponse) => createChatHandler(assistantDeps())(req, res);

export default handler;

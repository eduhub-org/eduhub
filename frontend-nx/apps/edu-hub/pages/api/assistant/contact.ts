import type { NextApiRequest, NextApiResponse } from 'next';
import { assistantContact } from '../../../lib/assistant/prompt';

/** The contact the Assistant widget links to (ASSISTANT_CONTACT), or null when none is configured. */
const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED' } });
  }
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json({ contact: assistantContact() ?? null });
};

export default handler;

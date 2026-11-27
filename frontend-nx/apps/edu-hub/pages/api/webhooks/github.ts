import { createWebhookHandler } from '../../../lib/github/handlers';
import { webhookDeps } from '../../../lib/github/server';

// The signature is over the raw body.
export const config = { api: { bodyParser: false } };

/** Issue and project board events from the EduHub Reports GitHub App (lib/github/handlers.ts). */
export default createWebhookHandler(webhookDeps);

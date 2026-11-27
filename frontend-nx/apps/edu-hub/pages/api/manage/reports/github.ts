import { createAdminHandler } from '../../../../lib/github/handlers';
import { adminHandlerDeps } from '../../../../lib/github/server';

/** Creates or links a report's GitHub issue and sets report statuses (lib/github/reportSync.ts). */
export default createAdminHandler(adminHandlerDeps);

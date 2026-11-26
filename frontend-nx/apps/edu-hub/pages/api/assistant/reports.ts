import { createReportsHandler } from '../../../lib/assistant/reports';
import { reportsDeps } from '../../../lib/assistant/server';

/** Sends, supports or withdraws a bug report or feature idea from the Assistant's card (lib/assistant/reports.ts). */
export default createReportsHandler(reportsDeps);

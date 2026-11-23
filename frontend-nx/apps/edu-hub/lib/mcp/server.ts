import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OperationError } from './errors';
import type { CourseSetup } from './operations';

/**
 * The EduHub MCP server (ADR 0006): course-setup tools over the operations in `operations.ts`.
 * Tool names and parameters follow the mock schemas of the Assistant provider trial
 * (scripts/assistant-provider-trial/tools.json); differences are listed in lib/mcp/README.md.
 */

const courseId = z.number().int().positive().describe('Course id');
const language = z.enum(['de', 'en', 'DE', 'EN']);
const isoDateTime = z.string().describe('ISO 8601 with offset, e.g. 2027-01-12T18:00:00+01:00 (Europe/Berlin)');
const location = z
  .object({
    courseLocationId: z.number().int().describe('One of the course\'s location options (see get_course courseLocations)'),
    address: z.string().optional().describe('Defaults to the option\'s default Session address'),
  })
  .strict();

/** Course texts other than the title. */
const bodyTextFields = {
  tagline: z.string().optional(),
  learningGoals: z.string().optional(),
  headingDescriptionField1: z.string().optional(),
  contentDescriptionField1: z.string().optional(),
  headingDescriptionField2: z.string().optional(),
  contentDescriptionField2: z.string().optional(),
};
const textFields = { title: z.string().min(1).optional(), ...bodyTextFields };

/** Course settings other than the language. */
const otherSettingsFields = {
  maxParticipants: z.number().int().min(0).optional(),
  applicationEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('YYYY-MM-DD'),
  maxMissedSessions: z.number().int().min(0).optional(),
  weekDay: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'NONE']).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().describe('HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().describe('HH:MM'),
  sessionReminderLeadHours: z.number().int().min(0).optional().describe('Reminder Lead Time in hours'),
  showAvailablePlaces: z.boolean().optional(),
  attendanceCertificatePossible: z.boolean().optional(),
  achievementCertificatePossible: z.boolean().optional(),
};
const settingsSchema = z.object({ ...otherSettingsFields, language: language.optional() }).strict();

const run = async (fn: () => Promise<unknown>) => {
  try {
    const result = await fn();
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
  } catch (error) {
    if (error instanceof OperationError) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: JSON.stringify({ error: { code: error.code, message: error.message } }) }],
      };
    }
    throw error;
  }
};

const PROPOSES = 'Returns a Proposed Change with before and after; nothing is saved until apply_proposed_change.';

export const createMcpServer = (setup: CourseSetup) => {
  const server = new McpServer({ name: 'eduhub-course-setup', version: '1.0.0' });
  const readOnly = { readOnlyHint: true, openWorldHint: false };
  const proposes = { readOnlyHint: true, openWorldHint: false };

  server.registerTool(
    'list_courses',
    {
      description:
        'The courses the caller can manage, newest first, with their number of Registrations. Returns up to 100; ' +
        'when hasMore is true, call again with beforeId set to nextBeforeId for the next page.',
      inputSchema: { beforeId: z.number().int().positive().optional() },
      annotations: readOnly,
    },
    ({ beforeId }) => run(() => setup.listCourses({ beforeId }))
  );

  server.registerTool(
    'get_course',
    {
      description:
        'A course the caller manages: texts, settings, Sessions with their Session Locations, the course\'s location ' +
        'options and the number of Registrations. Sessions can only be changed while registrationCount is 0.',
      inputSchema: { courseId },
      annotations: readOnly,
    },
    ({ courseId }) => run(() => setup.getCourse({ courseId }))
  );

  server.registerTool(
    'get_registration_count',
    { description: 'Number of Registrations of a course, in any state.', inputSchema: { courseId }, annotations: readOnly },
    ({ courseId }) => run(() => setup.getRegistrationCount({ courseId }))
  );

  server.registerTool(
    'propose_course_texts',
    {
      description:
        'Draft new texts for a course. A course has one set of texts in its own language, so write them in that ' +
        `language (get_course shows it). ${PROPOSES}`,
      inputSchema: {
        courseId,
        language: language.optional().describe('Language the texts are written in; must be the course language'),
        texts: z.object(textFields).strict(),
      },
      annotations: proposes,
    },
    (args) => run(() => setup.proposeCourseTexts(args))
  );

  server.registerTool(
    'propose_course_settings',
    {
      description: `Draft changes to course settings. ${PROPOSES}`,
      inputSchema: {
        courseId,
        settings: settingsSchema,
      },
      annotations: proposes,
    },
    (args) => run(() => setup.proposeCourseSettings(args))
  );

  server.registerTool(
    'propose_sessions',
    {
      description:
        'Draft Sessions to add, change (time, title, description, Session Locations) or delete. Only possible ' +
        `while the course has no Registrations in any state. ${PROPOSES}`,
      inputSchema: {
        courseId,
        sessions: z
          .array(
            z
              .object({
                title: z.string(),
                startDateTime: isoDateTime,
                endDateTime: isoDateTime,
                description: z.string().optional(),
                locations: z.array(location).optional().describe('Defaults to all location options of the course'),
              })
              .strict()
          )
          .optional()
          .describe('New Sessions'),
        changes: z
          .array(
            z
              .object({
                sessionId: z.number().int(),
                title: z.string().optional(),
                startDateTime: isoDateTime.optional(),
                endDateTime: isoDateTime.optional(),
                description: z.string().optional(),
                locations: z.array(location).optional().describe('Replaces all Session Locations of the Session'),
              })
              .strict()
          )
          .optional()
          .describe('Changes to existing Sessions'),
        deleteSessionIds: z.array(z.number().int()).optional(),
      },
      annotations: proposes,
    },
    (args) => run(() => setup.proposeSessions(args))
  );

  server.registerTool(
    'list_programs',
    {
      description: 'The programs the caller can create courses in (Org Admins and Admins; empty for instructors).',
      annotations: readOnly,
    },
    () => run(() => setup.listPrograms())
  );

  server.registerTool(
    'propose_create_course',
    {
      description:
        'Draft a new course in a program (see list_programs). Only Org Admins and Admins can create courses. ' +
        'Unset fields get the defaults of the manage courses page. Texts are written in the course language. ' +
        `${PROPOSES} After applying, fill it in with the other propose tools using the returned courseId.`,
      inputSchema: {
        programId: z.number().int().positive(),
        title: z.string().min(1),
        language: language.optional().describe('Course language, default DE'),
        texts: z.object(bodyTextFields).strict().optional(),
        settings: z.object(otherSettingsFields).strict().optional(),
        locationOptions: z.array(z.string()).optional().describe('e.g. ONLINE, KIEL; default ONLINE'),
      },
      annotations: proposes,
    },
    (args) => run(() => setup.proposeCreateCourse(args))
  );

  server.registerTool(
    'apply_proposed_change',
    {
      description:
        'Save a Proposed Change. Call this only after the Organizer has seen the change and explicitly asked to ' +
        'apply it. The rules are checked again, and it fails if the course changed since the proposal.',
      inputSchema: { proposedChangeId: z.string() },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    (args) => run(() => setup.applyProposedChange(args))
  );

  server.registerTool(
    'discard_proposed_change',
    {
      description: 'Discard a Proposed Change. Nothing is saved.',
      inputSchema: { proposedChangeId: z.string() },
      annotations: readOnly,
    },
    (args) => run(() => setup.discardProposedChange(args))
  );

  return server;
};

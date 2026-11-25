/**
 * Setup guides: what to ask and check when an Organizer sets up a course, an event or a degree.
 * The tools are the same for all three (an Event is a Course in an EVENTS program, see CONTEXT.md);
 * only what is worth asking differs. The model loads the guide for one program type with
 * `get_setup_guide` when it needs it, so the system prompt stays short.
 */

export const PROGRAM_TYPES = ['EVENTS', 'COURSES', 'DEGREES'] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];

const HOW_TO_ASK = [
  'How to use this guide:',
  '- Compare what the Organizer gave you with the checklist below before the first proposal.',
  '- Ask for what is missing in ONE message: at most 4 short questions, the most important first. Offer a default the',
  '  Organizer can accept with "yes" wherever there is one. Never ask for something they already told you.',
  '- If they want you to go ahead without answering, draft with the defaults and say which ones you used.',
  '- A new course is created first (propose_create_course); after it is applied, fill it in with the other propose',
  '  tools using the returned courseId, one Proposed Change per topic.',
  '- Sessions can only be changed while nobody has registered, so settle the dates before the course is published.',
];

const MAILS = (confirmation: string) => [
  `- Mails: once the course exists, read its mails with get_mail_templates and tell the Organizer in two or three`,
  `  sentences what the ${confirmation} says. Ask whether it should mention anything else (what to bring, how to get`,
  '  there, a contact person, preparation). Date, place and the calendar file are filled in automatically from the',
  '  Sessions. Offer a concrete wording and draft it with propose_mail_template. Only Org Admins and Admins can change',
  '  mails; instructors can read them.',
];

const GUIDES: Record<ProgramType, string[]> = {
  EVENTS: [
    'Setting up an EVENT (a course in an events program; it follows every course rule).',
    '',
    'Checklist:',
    '- Title, language (default DE) and a one-line tagline for the event card.',
    '- Description: what it is about and who it is for (contentDescriptionField1).',
    '- Date and time: every event needs at least one Session. The Registration Confirmation, the Session Reminder and',
    '  the calendar file take date, time and place from the Sessions, not from the description.',
    '- Agenda: an event\'s Sessions are its agenda (shown as "Programm" / "Agenda"), one Session per program item.',
    '  When the Organizer gives a program with several parts (talks, workshop, break, networking), ask whether to show',
    '  it as the agenda instead of in the description. If yes, ask for the start and end time of each item you do not',
    '  know yet, then draft one Session per item (title = item, description = speaker or details). Do not put the same',
    '  agenda in the description too. A single-part event gets one Session.',
    '- Place: on site (which address), online, or both. Each Session takes place at all of the course\'s location',
    '  options unless you give it fewer.',
    '- Places: maximum participants and whether to show the available places.',
    '- Registration deadline (applicationEnd): usually the day of the event or shortly before.',
    '- Session Reminder: hours before the first Session (default 24), or off.',
    '- Certificates: events usually award none; ask only if the Organizer mentions one.',
    ...MAILS('Registration Confirmation'),
  ],
  COURSES: [
    'Setting up a COURSE (a course in a courses program).',
    '',
    'Checklist:',
    '- Title (unique within the program), language (default DE) and a one-line tagline.',
    '- Learning goals and the two info blocks (e.g. "What is it about?", "Who is it for / prerequisites").',
    '- Schedule: weekday, start and end time, and one Session per meeting. Ask for the first and last date and any',
    '  dates without a meeting (holidays, breaks), then draft all Sessions at once.',
    '- Place: online, on site (which address) or both.',
    '- Places and deadline: maximum participants and the application deadline (default: the program\'s).',
    '- Attendance: how many Sessions may be missed (default 2) and which certificates the course awards',
    '  (attendance, achievement).',
    '- Session Reminder: hours before the first Session (default 24), or off.',
    ...MAILS('invitation and confirmation mail'),
  ],
  DEGREES: [
    'Setting up a DEGREE (a course in a degrees program). A degree has no instructors.',
    '',
    'Checklist:',
    '- Title (unique within the program), language (default DE) and a one-line tagline.',
    '- Learning goals and the two info blocks: what the degree covers, who it is for, what it takes to complete it.',
    '- Application deadline and maximum participants.',
    '- Dates: a degree needs no Sessions. Ask only whether it has dates of its own (e.g. a kick-off); if so, add those',
    '  as Sessions.',
    '- Certificates: which ones the degree awards.',
    ...MAILS('confirmation mail'),
  ],
};

export const setupGuide = (programType: string) => {
  const type = programType.toUpperCase() as ProgramType;
  const guide = GUIDES[type] ?? GUIDES.COURSES;
  return { programType: GUIDES[type] ? type : 'COURSES', guide: [...guide, '', ...HOW_TO_ASK].join('\n') };
};

import {
  EMAIL_TEMPLATE_CATEGORIES,
  UPCOMING_EMAIL_TEMPLATE_CATEGORIES,
  getEmailTemplateCategory,
} from './emailTemplateCategories';

describe('getEmailTemplateCategory', () => {
  // All template types currently produced by the backend / seeded as defaults.
  const knownTypes = [
    'APPLICATION_RECEIVED',
    'APPLICATION_RECEIVED_PAID',
    'APPLICATION_CONFIRMED',
    'INVITE',
    'DECLINE',
    'REGISTRATION_CONFIRMED',
    'REGISTRATION_CONFIRMED_PAID',
    'WAITLIST_NOTICE',
    'SESSION_REMINDER',
    'USER_CREATED',
    'ORGANIZER_ADDED',
    'CERTIFICATE_ACHIEVEMENT_READY',
    'CERTIFICATE_ATTENDANCE_READY',
    'ENROLLMENT_CANCELLED',
    'ENROLLMENT_ABORTED',
    'WAITLIST_PROMOTED',
    'INVITATION_EXPIRING_SOON',
    'INVITATION_EXPIRED',
    'PROJECT_JOIN_REQUESTED',
    'PROJECT_JOIN_ACCEPTED',
    'PROJECT_JOIN_DECLINED',
    'PROJECT_AUTHOR_EXCLUDED',
    'PROJECT_TEAM_CONFIRMED',
    'PROJECT_SUBMITTED',
    'PROJECT_SENT_BACK',
    'PROJECT_APPROVED',
    'PROJECT_REJECTED',
    'PROJECT_DEADLINE_REMINDER',
    'SESSION_RESCHEDULED',
    'PAYMENT_RECEIPT',
    'COURSE_CONTINUATION_INQUIRY',
    'JOB_POSTING_PUBLISHED',
    'JOB_POSTING_EXPIRED',
    'JOB_POSTING_ADMIN_NOTICE',
    'JOB_POSTING_PAYMENT_FAILED',
    'JOB_ALERT',
  ];

  it.each(knownTypes)('maps known type %s to a real category (not "other")', (type) => {
    expect(getEmailTemplateCategory(type)).not.toBe('other');
  });

  it('maps the application lifecycle types to "application"', () => {
    expect(getEmailTemplateCategory('APPLICATION_RECEIVED')).toBe('application');
    expect(getEmailTemplateCategory('INVITE')).toBe('application');
    expect(getEmailTemplateCategory('DECLINE')).toBe('application');
    expect(getEmailTemplateCategory('WAITLIST_NOTICE')).toBe('application');
  });

  it('maps the project lifecycle types to "projects"', () => {
    expect(getEmailTemplateCategory('PROJECT_JOIN_REQUESTED')).toBe('projects');
    expect(getEmailTemplateCategory('PROJECT_TEAM_CONFIRMED')).toBe('projects');
    expect(getEmailTemplateCategory('PROJECT_DEADLINE_REMINDER')).toBe('projects');
  });

  it('maps certificate and payment notices to "application"', () => {
    expect(getEmailTemplateCategory('CERTIFICATE_ACHIEVEMENT_READY')).toBe('application');
    expect(getEmailTemplateCategory('CERTIFICATE_ATTENDANCE_READY')).toBe('application');
    expect(getEmailTemplateCategory('PAYMENT_RECEIPT')).toBe('application');
  });

  it('maps session reminders and changes to "sessions"', () => {
    expect(getEmailTemplateCategory('SESSION_REMINDER')).toBe('sessions');
    expect(getEmailTemplateCategory('SESSION_RESCHEDULED')).toBe('sessions');
    expect(getEmailTemplateCategory('COURSE_CONTINUATION_INQUIRY')).toBe('sessions');
  });

  it('maps account/system types to "system"', () => {
    expect(getEmailTemplateCategory('USER_CREATED')).toBe('system');
    expect(getEmailTemplateCategory('ORGANIZER_ADDED')).toBe('system');
  });

  it('maps the StuJo job board types to "jobboard"', () => {
    expect(getEmailTemplateCategory('JOB_POSTING_PUBLISHED')).toBe('jobboard');
    expect(getEmailTemplateCategory('JOB_POSTING_EXPIRED')).toBe('jobboard');
    expect(getEmailTemplateCategory('JOB_POSTING_ADMIN_NOTICE')).toBe('jobboard');
    expect(getEmailTemplateCategory('JOB_POSTING_PAYMENT_FAILED')).toBe('jobboard');
    expect(getEmailTemplateCategory('JOB_ALERT')).toBe('jobboard');
  });

  it('shows the job board as a tab rather than hiding it behind "Sonstige"', () => {
    expect(EMAIL_TEMPLATE_CATEGORIES).toContain('jobboard');
  });

  it('falls back to "other" for unknown types so they never disappear from the UI', () => {
    expect(getEmailTemplateCategory('SOME_FUTURE_TYPE')).toBe('other');
  });

  it('lists every upcoming category in the tab order', () => {
    UPCOMING_EMAIL_TEMPLATE_CATEGORIES.forEach((category) => {
      expect(EMAIL_TEMPLATE_CATEGORIES).toContain(category);
    });
  });

  it('no longer treats project notifications as upcoming', () => {
    expect(UPCOMING_EMAIL_TEMPLATE_CATEGORIES).not.toContain('projects');
  });
});

describe('job board template labels', () => {
  // A type mapped to a category but missing from the locale files renders as
  // "Unbekannter Auslöser-Typ" in the editor, which is how the JOB_POSTING_*
  // templates were effectively invisible before.
  const de = require('../locales/de.json');
  const en = require('../locales/en.json');
  const jobBoardTypes = [
    'JOB_POSTING_PUBLISHED',
    'JOB_POSTING_EXPIRED',
    'JOB_POSTING_ADMIN_NOTICE',
    'JOB_POSTING_PAYMENT_FAILED',
    'JOB_ALERT',
  ];

  it.each(jobBoardTypes)('has a German name and trigger description for %s', (type) => {
    expect(de.manageEmailTemplates.template_types[type]).toBeTruthy();
    expect(de.manageEmailTemplates.triggers[type]).toBeTruthy();
  });

  it.each(jobBoardTypes)('has an English name and trigger description for %s', (type) => {
    expect(en.manageEmailTemplates.template_types[type]).toBeTruthy();
    expect(en.manageEmailTemplates.triggers[type]).toBeTruthy();
  });

  it('names the jobboard category in both locales', () => {
    expect(de.manageEmailTemplates.categories.jobboard).toBeTruthy();
    expect(en.manageEmailTemplates.categories.jobboard).toBeTruthy();
  });
});

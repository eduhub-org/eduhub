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

  it('maps session reminders to "sessions"', () => {
    expect(getEmailTemplateCategory('SESSION_REMINDER')).toBe('sessions');
  });

  it('maps account/system types to "system"', () => {
    expect(getEmailTemplateCategory('USER_CREATED')).toBe('system');
    expect(getEmailTemplateCategory('ORGANIZER_ADDED')).toBe('system');
  });

  it('falls back to "other" for unknown types so they never disappear from the UI', () => {
    expect(getEmailTemplateCategory('SOME_FUTURE_TYPE')).toBe('other');
  });

  it('lists every upcoming category in the tab order', () => {
    UPCOMING_EMAIL_TEMPLATE_CATEGORIES.forEach((category) => {
      expect(EMAIL_TEMPLATE_CATEGORIES).toContain(category);
    });
  });
});

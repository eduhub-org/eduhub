/**
 * Categorization of email template types for the grouped template list on
 * the settings emails page. New trigger types (e.g. project notifications)
 * get a category here; anything unmapped falls back to 'other' so it never
 * disappears from the UI.
 */
export type EmailTemplateCategory = 'application' | 'projects' | 'sessions' | 'system' | 'other';

/** Categories shown as tabs, in display order ('other' is appended only when present). */
export const EMAIL_TEMPLATE_CATEGORIES: EmailTemplateCategory[] = [
  'application',
  'projects',
  'sessions',
  'system',
];

/** Categories that exist in the taxonomy but have no live trigger types yet. */
export const UPCOMING_EMAIL_TEMPLATE_CATEGORIES: EmailTemplateCategory[] = ['projects'];

const CATEGORY_BY_TYPE: Record<string, EmailTemplateCategory> = {
  // Application process (enrollment lifecycle)
  APPLICATION_RECEIVED: 'application',
  APPLICATION_RECEIVED_PAID: 'application',
  APPLICATION_CONFIRMED: 'application',
  INVITE: 'application',
  DECLINE: 'application',
  REGISTRATION_CONFIRMED: 'application',
  REGISTRATION_CONFIRMED_PAID: 'application',
  WAITLIST_NOTICE: 'application',
  // Session reminders
  SESSION_REMINDER: 'sessions',
  // System / account
  USER_CREATED: 'system',
  ORGANIZER_ADDED: 'system',
};

export const getEmailTemplateCategory = (type: string): EmailTemplateCategory =>
  CATEGORY_BY_TYPE[type] ?? 'other';

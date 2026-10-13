import { Course_insert_input } from '../__generated__/globalTypes';

/** Matches the limit of the description fields in the course editor. */
const DESCRIPTION_MAX_LENGTH = 10000;
/** Matches the limit of the short description (tagline) in the course editor. */
const TAGLINE_MAX_LENGTH = 500;

export type PublicEventSourceCourse = {
  title: string;
  tagline: string | null;
  coverImage: string | null;
  language: string | null;
  contentDescriptionField1: string | null;
};

export type PublicEventSourceSession = {
  id: number;
  title: string | null;
  description: string | null;
  startDateTime: Date | string;
};

/** Translated texts the draft is pre-filled with; the admin reviews them before publishing. */
export type PublicEventTexts = {
  tagline: string;
  aboutSessionHeading: string;
  aboutCourseHeading: string;
};

const joinParagraphs = (...parts: (string | null | undefined)[]) =>
  parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join('\n\n');

/** The session's calendar day in local time, as the `date` column expects. */
const localDate = (value: Date | string) => {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * The unpublished event created from a course session: the session describes
 * what happens, the course what it belongs to. Session, locations and speakers
 * are not part of the row - the database copies them from `sourceSessionId`.
 *
 * Registration stays open until the session's day; the database starts the
 * event with direct registration (org admins may not set the type), so anyone
 * can sign up without applying to the course.
 */
export const buildEventFromSession = (
  course: PublicEventSourceCourse,
  session: PublicEventSourceSession,
  programId: number,
  texts: PublicEventTexts
): Course_insert_input => ({
  programId,
  sourceSessionId: session.id,
  published: false,
  title: session.title?.trim() || course.title,
  tagline: texts.tagline.slice(0, TAGLINE_MAX_LENGTH),
  coverImage: course.coverImage,
  language: course.language,
  applicationEnd: localDate(session.startDateTime),
  maxMissedSessions: 0,
  headingDescriptionField1: session.description?.trim() ? texts.aboutSessionHeading : null,
  contentDescriptionField1: session.description?.trim().slice(0, DESCRIPTION_MAX_LENGTH) || null,
  headingDescriptionField2: texts.aboutCourseHeading,
  contentDescriptionField2:
    joinParagraphs(course.tagline, course.contentDescriptionField1).slice(0, DESCRIPTION_MAX_LENGTH) || null,
});

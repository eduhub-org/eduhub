/**
 * Course titles are unique within a program for courses and degrees. Event programs are exempt:
 * an event program is permanent and the same event runs again each year under the same title.
 * Titles compare without case and surrounding spaces.
 */

export const titlesMustBeUnique = (programType: string | null | undefined) => programType !== 'EVENTS';

export const normalizeCourseTitle = (title: string) => title.trim().toLocaleLowerCase('de-DE');

interface TitledCourse {
  id: number;
  title: string | null;
}

/** The first course (other than `exceptId`) whose title equals `title`, or undefined. */
export const findTitleClash = <T extends TitledCourse>(courses: T[], title: string, exceptId?: number) => {
  const wanted = normalizeCourseTitle(title);
  if (!wanted) return undefined;
  return courses.find((c) => c.id !== exceptId && normalizeCourseTitle(c.title ?? '') === wanted);
};

/** `base`, or `base 2`, `base 3`, … — the first one not among `takenTitles`. */
export const nextFreeTitle = (base: string, takenTitles: (string | null)[]) => {
  const taken = new Set(takenTitles.map((t) => normalizeCourseTitle(t ?? '')));
  if (!taken.has(normalizeCourseTitle(base))) return base;
  let n = 2;
  while (taken.has(normalizeCourseTitle(`${base} ${n}`))) n++;
  return `${base} ${n}`;
};

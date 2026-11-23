import { findTitleClash, nextFreeTitle, titlesMustBeUnique } from './courseTitles';

describe('course titles', () => {
  const courses = [
    { id: 1, title: 'Prototyping Days' },
    { id: 2, title: 'Einführung in Machine Learning ' },
    { id: 3, title: null },
  ];

  it('finds a clash ignoring case and surrounding spaces, but not with the course itself', () => {
    expect(findTitleClash(courses, '  einführung in machine learning')?.id).toBe(2);
    expect(findTitleClash(courses, 'Einführung in Machine Learning', 2)).toBeUndefined();
    expect(findTitleClash(courses, 'Neuer Kurs')).toBeUndefined();
    expect(findTitleClash(courses, '   ')).toBeUndefined();
  });

  it('picks the next free default title', () => {
    expect(nextFreeTitle('Unbenannter Kurs', ['Anderer Kurs'])).toBe('Unbenannter Kurs');
    expect(nextFreeTitle('Unbenannter Kurs', ['unbenannter kurs', 'Unbenannter Kurs 2'])).toBe('Unbenannter Kurs 3');
  });

  it('applies to course and degree programs, not to event programs', () => {
    expect(titlesMustBeUnique('COURSES')).toBe(true);
    expect(titlesMustBeUnique('DEGREES')).toBe(true);
    expect(titlesMustBeUnique('EVENTS')).toBe(false);
  });
});

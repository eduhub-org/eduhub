import { courseRedirectDestination } from './courseRedirect';
import { ProgramType } from '../types/enums';

const base = {
  id: 42,
  resolvedUrl: '/course/42',
  locale: 'de',
  defaultLocale: 'de',
};

describe('courseRedirectDestination', () => {
  it('stays put when the segment already matches the program type', () => {
    expect(
      courseRedirectDestination({ ...base, expectedSegment: 'course', programType: ProgramType.COURSES })
    ).toBeNull();
    expect(
      courseRedirectDestination({
        ...base,
        resolvedUrl: '/event/42',
        expectedSegment: 'event',
        programType: ProgramType.EVENTS,
      })
    ).toBeNull();
  });

  it('sends a mismatched segment to the one the program type asks for', () => {
    expect(
      courseRedirectDestination({ ...base, expectedSegment: 'course', programType: ProgramType.EVENTS })
    ).toBe('/event/42');
    expect(
      courseRedirectDestination({
        ...base,
        resolvedUrl: '/event/42',
        expectedSegment: 'event',
        programType: ProgramType.DEGREES,
      })
    ).toBe('/degree/42');
  });

  // The MOOCHub feed publishes /course/:id?source=moochub&...; dropping the
  // query on the way through would break the referrer it identifies itself with.
  it('keeps the query string', () => {
    expect(
      courseRedirectDestination({
        ...base,
        resolvedUrl: '/course/42?source=moochub&provider=opencampus-sh&feed_version=3.0.1',
        expectedSegment: 'course',
        programType: ProgramType.EVENTS,
      })
    ).toBe('/event/42?source=moochub&provider=opencampus-sh&feed_version=3.0.1');
  });

  it('keeps a prefixed locale and leaves the default locale unprefixed', () => {
    expect(
      courseRedirectDestination({
        ...base,
        locale: 'en',
        resolvedUrl: '/course/42',
        expectedSegment: 'course',
        programType: ProgramType.EVENTS,
      })
    ).toBe('/en/event/42');

    expect(
      courseRedirectDestination({ ...base, expectedSegment: 'course', programType: ProgramType.EVENTS })
    ).toBe('/event/42');
  });

  // An unknown type means "we could not tell", and the default segment is where
  // such a link already points, so there is nothing to redirect.
  it('does not redirect a course-segment request with an unknown program type', () => {
    expect(courseRedirectDestination({ ...base, expectedSegment: 'course', programType: null })).toBeNull();
  });
});

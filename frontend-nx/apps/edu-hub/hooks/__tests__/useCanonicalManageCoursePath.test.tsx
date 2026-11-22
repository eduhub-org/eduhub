import { renderHook } from '@testing-library/react';

import { useCanonicalManageCoursePath } from '../useCanonicalManageCoursePath';
import { ProgramType } from '../../types/enums';

const replace = jest.fn();
const push = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ replace, push }),
}));

const setHash = (hash: string) => {
  window.location.hash = hash;
};

describe('useCanonicalManageCoursePath', () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
    setHash('');
  });

  it('does nothing while the course is still loading', () => {
    renderHook(() => useCanonicalManageCoursePath(42, 'course', undefined));
    expect(replace).not.toHaveBeenCalled();
  });

  it('does nothing when the segment already matches', () => {
    renderHook(() => useCanonicalManageCoursePath(42, 'event', ProgramType.EVENTS));
    expect(replace).not.toHaveBeenCalled();
  });

  it('corrects a mismatched segment', () => {
    renderHook(() => useCanonicalManageCoursePath(42, 'course', ProgramType.EVENTS));
    expect(replace).toHaveBeenCalledWith('/manage/event/42');
  });

  // Back must leave the page rather than bounce into the redirect again.
  it('replaces rather than pushes, so it leaves no history entry', () => {
    renderHook(() => useCanonicalManageCoursePath(42, 'course', ProgramType.DEGREES));
    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
  });

  // Project emails to instructors and mentors deep-link to #projects.
  it('carries the hash across', () => {
    setHash('#projects');
    renderHook(() => useCanonicalManageCoursePath(42, 'course', ProgramType.EVENTS));
    expect(replace).toHaveBeenCalledWith('/manage/event/42#projects');
  });

  it('settles after one correction rather than looping', () => {
    const { rerender } = renderHook(
      ({ segment }: { segment: 'course' | 'event' }) =>
        useCanonicalManageCoursePath(42, segment, ProgramType.EVENTS),
      { initialProps: { segment: 'course' as const } }
    );
    expect(replace).toHaveBeenCalledTimes(1);

    // Re-rendered on the corrected segment, as the new route file would.
    rerender({ segment: 'event' });
    expect(replace).toHaveBeenCalledTimes(1);
  });
});

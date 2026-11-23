import { buildPageContext, readVisibleError } from '../pageContext';

describe('buildPageContext', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('sends the route, the course and session IDs and the visible error', () => {
    document.body.innerHTML = '<div role="dialog"><div id="error-dialog-description">  Course  is full </div></div>';
    expect(
      buildPageContext({
        pathname: '/manage/course/[courseId]',
        asPath: '/manage/course/12?tab=sessions#top',
        query: { courseId: '12', sessionId: ['34'] },
      })
    ).toEqual({
      path: '/manage/course/12',
      route: '/manage/course/[courseId]',
      courseId: 12,
      sessionId: 34,
      errorMessage: 'Course is full',
    });
  });

  it('leaves out IDs that are not numbers', () => {
    expect(buildPageContext({ pathname: '/course/[courseId]', asPath: '/course/abc', query: { courseId: 'abc' } })).toEqual({
      path: '/course/abc',
      route: '/course/[courseId]',
    });
  });
});

describe('readVisibleError', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('skips hidden errors (a closed, kept-mounted dialog) and the Assistant panel itself', () => {
    document.body.innerHTML =
      '<div aria-hidden="true"><div id="error-dialog-description">old error</div></div>' +
      '<div data-assistant-panel><p role="alert">assistant error</p></div>' +
      '<p role="alert">Upload failed</p>';
    expect(readVisibleError()).toBe('Upload failed');
  });

  it('returns undefined when no error is shown', () => {
    expect(readVisibleError()).toBeUndefined();
  });
});

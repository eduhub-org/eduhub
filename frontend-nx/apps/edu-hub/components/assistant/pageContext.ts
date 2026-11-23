import type { PageContext } from './api';

const toId = (value: unknown): number | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

const isHidden = (element: Element): boolean =>
  Boolean(element.closest('[aria-hidden="true"], [hidden]')) ||
  (element instanceof HTMLElement && element.style.visibility === 'hidden');

/** Selectors for error messages users see: the ErrorMessageDialog body and any ARIA alert. */
const ERROR_SELECTORS = ['#error-dialog-description', '[role="alert"]'];

/**
 * The first visible error message on the page, so the Assistant can explain it.
 * The Assistant's own panel is skipped, so its error notes are never sent back.
 */
export const readVisibleError = (root: ParentNode = document): string | undefined => {
  for (const element of Array.from(root.querySelectorAll(ERROR_SELECTORS.join(',')))) {
    if (isHidden(element) || element.closest('[data-assistant-panel]')) continue;
    const text = element.textContent?.replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, 500);
  }
  return undefined;
};

interface RouterLike {
  pathname: string;
  asPath: string;
  query: Record<string, string | string[] | undefined>;
}

/** What the widget sends about the page: route, the course or session on it, and a visible error. */
export const buildPageContext = (router: RouterLike, root?: ParentNode): PageContext => {
  const context: PageContext = {
    path: router.asPath.split(/[?#]/)[0],
    route: router.pathname,
  };
  const courseId = toId(router.query.courseId);
  const sessionId = toId(router.query.sessionId);
  const errorMessage = readVisibleError(root);
  if (courseId) context.courseId = courseId;
  if (sessionId) context.sessionId = sessionId;
  if (errorMessage) context.errorMessage = errorMessage;
  return context;
};

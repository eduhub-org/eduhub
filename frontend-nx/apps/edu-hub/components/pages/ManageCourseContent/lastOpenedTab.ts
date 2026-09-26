/**
 * Remembers which Manage Course tab a user last had open, per course and per browser, so coming back
 * to a course lands on the same tab. Storage can be unavailable (private windows, blocked site data),
 * in which case the page just opens on its default tab.
 */
const storageKey = (courseId: number) => `eduhub.manageCourse.lastTab.${courseId}`;

export const readLastOpenedTab = (courseId: number): number | null => {
  try {
    const stored = window.localStorage.getItem(storageKey(courseId));
    if (stored == null) return null;
    const tabIndex = Number(stored);
    return Number.isInteger(tabIndex) ? tabIndex : null;
  } catch {
    return null;
  }
};

export const storeLastOpenedTab = (courseId: number, tabIndex: number): void => {
  try {
    window.localStorage.setItem(storageKey(courseId), String(tabIndex));
  } catch {
    // Not remembering the tab is fine.
  }
};

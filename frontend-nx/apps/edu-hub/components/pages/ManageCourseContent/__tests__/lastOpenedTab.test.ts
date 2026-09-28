import { readLastOpenedTab, storeLastOpenedTab } from '../lastOpenedTab';

describe('lastOpenedTab', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('remembers the tab per course', () => {
    storeLastOpenedTab(7, 2);
    storeLastOpenedTab(8, 3);

    expect(readLastOpenedTab(7)).toBe(2);
    expect(readLastOpenedTab(8)).toBe(3);
    expect(readLastOpenedTab(9)).toBeNull();
  });

  it('ignores values that are not a tab index', () => {
    window.localStorage.setItem('eduhub.manageCourse.lastTab.7', 'abc');

    expect(readLastOpenedTab(7)).toBeNull();
  });

  it('falls back quietly when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => storeLastOpenedTab(7, 2)).not.toThrow();
    expect(readLastOpenedTab(7)).toBeNull();
  });
});

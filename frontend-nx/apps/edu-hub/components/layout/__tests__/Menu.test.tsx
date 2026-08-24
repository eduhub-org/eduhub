import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Menu } from '../Menu';

const logout = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/profile', asPath: '/profile' }),
}));

jest.mock('../../../hooks/authentication', () => ({
  useIsAdmin: () => false,
  useIsInstructor: () => false,
  useIsOrgAdmin: () => false,
}));

jest.mock('../../../hooks/orgAdminCapabilities', () => ({
  useOrgAdminCapabilities: () => ({ canManageCourses: false, canManageEvents: false, canManageDegrees: false }),
}));

jest.mock('../../../hooks/logout', () => ({
  __esModule: true,
  default: () => logout,
}));

const renderMenu = async () => {
  const setVisible = jest.fn();
  render(<Menu anchorElement={document.body} isVisible setVisible={setVisible} />);
  // Let MUI's Fade transition settle so its state updates stay inside act().
  await screen.findByRole('menuitem', { name: 'menu.profile' });
  return { setVisible };
};

describe('account Menu', () => {
  beforeEach(() => {
    logout.mockClear();
  });

  // Regression guard: the rows used to wrap a nested <Link> inside the MenuItem. The MenuItem took
  // focus and owned the click handler while only the nested anchor navigated, so both a click next
  // to the label and a keyboard Enter closed the menu without going anywhere.
  it('renders every route row as the focusable menuitem itself, not a nested link', async () => {
    await renderMenu();

    const profile = screen.getByRole('menuitem', { name: 'menu.profile' });

    expect(profile.tagName).toBe('A');
    expect(profile).toHaveAttribute('href', '/profile');
    expect(profile.querySelector('a')).toBeNull();
  });

  it('keeps keyboard focus on the navigating anchor', async () => {
    await renderMenu();

    // MUI autofocuses the first row when the menu opens; ArrowDown walks to the next one. Either
    // way the focused element must be the anchor that navigates, not a wrapper that only closes.
    expect((document.activeElement as HTMLElement).tagName).toBe('A');
    expect(document.activeElement).toHaveAttribute('href', '/profile');

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

    const focused = document.activeElement as HTMLElement;
    expect(focused.tagName).toBe('A');
    expect(focused).toHaveAttribute('href', '/my-certificates');
    expect(focused).toHaveAttribute('role', 'menuitem');
  });

  it('activates the logout row with Enter', async () => {
    await renderMenu();

    const logoutItem = screen.getByRole('menuitem', { name: 'menu.logout' });
    logoutItem.focus();
    fireEvent.keyDown(logoutItem, { key: 'Enter' });

    expect(logout).toHaveBeenCalled();
  });

  it('marks the current route as selected', async () => {
    await renderMenu();

    expect(screen.getByRole('menuitem', { name: 'menu.profile' })).toHaveClass('Mui-selected');
    expect(screen.getByRole('menuitem', { name: 'menu.my_certificates' })).not.toHaveClass('Mui-selected');
  });
});

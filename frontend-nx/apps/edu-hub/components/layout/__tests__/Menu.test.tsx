import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Menu } from '../Menu';

const logout = jest.fn();
let mockIsOrgAdmin = false;
let mockIsAdmin = false;
let mockIsInstructor = false;
let mockCanViewStatistics = false;
let mockCanManageCourses = false;
let mockCanManageEvents = false;
let mockCanManageDegrees = false;

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/profile', asPath: '/profile' }),
}));

jest.mock('../../../hooks/authentication', () => ({
  useIsAdmin: () => mockIsAdmin,
  useIsInstructor: () => mockIsInstructor,
  useIsOrgAdmin: () => mockIsOrgAdmin,
}));

jest.mock('../../../hooks/orgAdminCapabilities', () => ({
  useOrgAdminCapabilities: () => ({
    canManageCourses: mockCanManageCourses,
    canManageEvents: mockCanManageEvents,
    canManageDegrees: mockCanManageDegrees,
    canManageSettings: false,
    canViewStatistics: mockCanViewStatistics,
  }),
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
    mockIsOrgAdmin = false;
    mockIsAdmin = false;
    mockIsInstructor = false;
    mockCanViewStatistics = false;
    mockCanManageCourses = false;
    mockCanManageEvents = false;
    mockCanManageDegrees = false;
  });

  it('leaves an 8px gap below the avatar trigger', async () => {
    await renderMenu();

    expect(screen.getByRole('menu').closest('.MuiPaper-root')).toHaveStyle({ marginTop: '8px' });
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

  it('hides the statistics entry from org admins without canViewStatistics', async () => {
    mockIsOrgAdmin = true;
    await renderMenu();

    expect(screen.queryByRole('menuitem', { name: 'menu.statistics' })).toBeNull();
  });

  it('shows the statistics entry to org admins with canViewStatistics', async () => {
    mockIsOrgAdmin = true;
    mockCanViewStatistics = true;
    await renderMenu();

    expect(screen.getByRole('menuitem', { name: 'menu.statistics' })).toHaveAttribute('href', '/statistics');
    expect(screen.getByText('menu.section_management')).toBeInTheDocument();
  });

  it.each([
    ['admins', () => (mockIsAdmin = true)],
    [
      'org admins who manage courses',
      () => {
        mockIsOrgAdmin = true;
        mockCanManageCourses = true;
      },
    ],
    [
      'org admins who manage events',
      () => {
        mockIsOrgAdmin = true;
        mockCanManageEvents = true;
      },
    ],
  ])('links the projects overview for %s', async (_, setRole) => {
    setRole();
    await renderMenu();

    expect(screen.getByRole('menuitem', { name: 'menu.projects' })).toHaveAttribute(
      'href',
      '/manage/projects'
    );
  });

  it.each([
    [
      'org admins who manage neither courses nor events',
      () => {
        mockIsOrgAdmin = true;
        mockCanManageDegrees = true;
        mockCanViewStatistics = true;
      },
    ],
    ['instructors', () => (mockIsInstructor = true)],
    ['participants', () => undefined],
  ])('hides the projects overview from %s', async (_, setRole) => {
    setRole();
    await renderMenu();

    expect(screen.queryByRole('menuitem', { name: 'menu.projects' })).not.toBeInTheDocument();
  });

  it('hides the manual entry from participants and org admins', async () => {
    mockIsOrgAdmin = true;
    await renderMenu();

    expect(screen.queryByRole('menuitem', { name: 'menu.manual' })).not.toBeInTheDocument();
  });

  it.each([
    ['admins', () => (mockIsAdmin = true)],
    ['instructors', () => (mockIsInstructor = true)],
  ])('links the in-app manual for %s', async (_, setRole) => {
    setRole();
    await renderMenu();

    expect(screen.getByRole('menuitem', { name: 'menu.manual' })).toHaveAttribute('href', '/help');
  });
});

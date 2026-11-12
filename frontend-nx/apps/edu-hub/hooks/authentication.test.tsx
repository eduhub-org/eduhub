import { renderHook } from '@testing-library/react';

import { useCurrentRole, useIsAdmin, useIsInstructor } from './authentication';

const mockSession = { data: null as unknown };
jest.mock('next-auth/react', () => ({ useSession: () => mockSession }));

const mockViewAs = { userId: null as string | null, asPlainUser: false, asInstructor: false };
jest.mock('./viewAs', () => ({ useViewAs: () => mockViewAs }));

const sessionWithRoles = (roles: string[]) => ({
  profile: { 'https://hasura.io/jwt/claims': { 'x-hasura-allowed-roles': roles, 'x-hasura-user-id': 'admin-id' } },
});

describe('role hooks while viewing as another user', () => {
  beforeEach(() => {
    // The signed-in person is a super-admin who is not an instructor themselves.
    mockSession.data = sessionWithRoles(['user', 'admin']);
    Object.assign(mockViewAs, { userId: 'target-id', asPlainUser: true, asInstructor: false });
  });

  it('shows the instructor view of an instructor, and nothing above it', () => {
    mockViewAs.asInstructor = true;
    expect(renderHook(() => useIsInstructor()).result.current).toBe(true);
    expect(renderHook(() => useIsAdmin()).result.current).toBe(false);
    expect(renderHook(() => useCurrentRole()).result.current).toBe('instructor');
  });

  it('shows a plain participant as a plain user', () => {
    expect(renderHook(() => useIsInstructor()).result.current).toBe(false);
    expect(renderHook(() => useCurrentRole()).result.current).toBe('user');
  });

  it('does not lend the admin their own instructor role', () => {
    mockSession.data = sessionWithRoles(['user', 'instructor', 'admin']);
    expect(renderHook(() => useIsInstructor()).result.current).toBe(false);
  });

  it('answers from the session when not viewing as anyone', () => {
    Object.assign(mockViewAs, { userId: null, asPlainUser: false, asInstructor: false });
    mockSession.data = sessionWithRoles(['user', 'instructor']);
    expect(renderHook(() => useIsInstructor()).result.current).toBe(true);
  });
});

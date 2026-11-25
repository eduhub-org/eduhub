import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

import useLogout from './logout';
import { logoutMatrix } from '../lib/matrix/oauth';

jest.mock('next-auth/react', () => ({ signOut: jest.fn(), useSession: jest.fn() }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../lib/matrix/oauth', () => ({ logoutMatrix: jest.fn() }));

const mockedSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockedLogoutMatrix = logoutMatrix as jest.MockedFunction<typeof logoutMatrix>;

/** Signed in as this EduHub user (the Keycloak sub in the Hasura claims). */
const signedInAs = (userId: string) =>
  mockedUseSession.mockReturnValue({
    data: { profile: { 'https://hasura.io/jwt/claims': { 'x-hasura-user-id': userId } } },
    status: 'authenticated',
  } as unknown as ReturnType<typeof useSession>);
const originalFetch = global.fetch;
const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const LogoutButton = () => {
  const logout = useLogout();
  return <button onClick={logout}>Logout</button>;
};

describe('useLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<
      typeof useSession
    >);
    mockedLogoutMatrix.mockResolvedValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://login.example/logout' }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalLocation) Object.defineProperty(window, 'location', originalLocation);
    jest.restoreAllMocks();
  });

  it('leaves protected pages before clearing the session', async () => {
    const navigation = deferred<boolean>();
    const replace = jest.fn().mockReturnValue(navigation.promise);
    mockedUseRouter.mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    // Keep the logout pending so JSDOM never performs the final full-page navigation.
    mockedSignOut.mockReturnValue(new Promise(() => undefined));

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(mockedSignOut).not.toHaveBeenCalled();

    navigation.resolve(true);

    await waitFor(() => expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false }));
  });

  it('still clears the session when leaving the protected page fails', async () => {
    const navigationError = new Error('navigation cancelled');
    const replace = jest.fn().mockRejectedValue(navigationError);
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedUseRouter.mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    mockedSignOut.mockReturnValue(new Promise(() => undefined));

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false }));
    expect(error).toHaveBeenCalledWith('Failed to leave protected page before logout', navigationError);
  });

  it('finishes logout with a full-page redirect to Keycloak', async () => {
    const replaceLocation = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { replace: replaceLocation },
    });
    mockedUseRouter.mockReturnValue({
      replace: jest.fn().mockResolvedValue(true),
    } as unknown as ReturnType<typeof useRouter>);
    mockedSignOut.mockResolvedValue({ url: '/' });

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() =>
      expect(replaceLocation).toHaveBeenCalledWith('https://login.example/logout')
    );
  });

  it('ends the chat (Matrix) session of the signed-in user before clearing the EduHub session', async () => {
    signedInAs('user-1');
    mockedUseRouter.mockReturnValue({ replace: jest.fn().mockResolvedValue(true) } as unknown as ReturnType<
      typeof useRouter
    >);
    mockedSignOut.mockReturnValue(new Promise(() => undefined));

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(mockedSignOut).toHaveBeenCalled());
    expect(mockedLogoutMatrix).toHaveBeenCalledWith('user-1');
    expect(mockedLogoutMatrix.mock.invocationCallOrder[0]).toBeLessThan(mockedSignOut.mock.invocationCallOrder[0]);
  });

  it('does not let a homeserver that never answers block the EduHub logout', async () => {
    jest.useFakeTimers();
    try {
      signedInAs('user-1');
      mockedLogoutMatrix.mockReturnValue(new Promise(() => undefined));
      mockedUseRouter.mockReturnValue({ replace: jest.fn().mockResolvedValue(true) } as unknown as ReturnType<
        typeof useRouter
      >);
      mockedSignOut.mockReturnValue(new Promise(() => undefined));

      render(<LogoutButton />);
      fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
      expect(mockedSignOut).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false }));
    } finally {
      jest.useRealTimers();
    }
  });
});

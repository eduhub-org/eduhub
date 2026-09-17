import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

import useLogout from './logout';

jest.mock('next-auth/react', () => ({ signOut: jest.fn() }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const mockedSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const originalFetch = global.fetch;

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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://login.example/logout' }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
});

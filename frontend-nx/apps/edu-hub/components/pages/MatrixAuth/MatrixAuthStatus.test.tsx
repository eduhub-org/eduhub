import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import MatrixAuthStatus from './MatrixAuthStatus';

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

describe('MatrixAuthStatus', () => {
  it('leads back to the course the login started from', () => {
    render(
      <MatrixAuthStatus
        message="…"
        error="failed"
        retryHref="/matrix/login?returnTo=%2Fcourse%2F12"
        backHref="/course/12"
      />
    );

    expect(screen.getByRole('link', { name: 'matrixChat.back_to_course' })).toHaveAttribute('href', '/course/12');
    expect(screen.getByRole('link', { name: 'matrixChat.try_again' })).toHaveAttribute(
      'href',
      '/matrix/login?returnTo=%2Fcourse%2F12'
    );
    expect(screen.queryByRole('link', { name: 'matrixChat.back_home' })).not.toBeInTheDocument();
  });

  it('leads to the start page when it does not know where the user came from', () => {
    render(<MatrixAuthStatus message="…" error="failed" backHref={null} />);

    expect(screen.getByRole('link', { name: 'matrixChat.back_home' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'matrixChat.back_to_course' })).not.toBeInTheDocument();
  });
});

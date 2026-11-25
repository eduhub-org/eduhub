import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProposedChangeCard } from '../ProposedChangeCard';

// next-intl ships ESM only, which this Jest setup can't load. This stand-in reads
// the real en.json, so a missing translation key still fails the test.
jest.mock('next-intl', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const messages = require('../../../locales/en.json');
  const lookup = (path: string): unknown =>
    path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], messages);
  return {
    useTranslations: (namespace: string) => {
      const t = (key: string, values: Record<string, unknown> = {}) => {
        const text = lookup(`${namespace}.${key}`);
        if (typeof text !== 'string') throw new Error(`Missing translation: ${namespace}.${key}`);
        return text.replace(/\{(\w+)\}/g, (_match, name) => String(values[name]));
      };
      t.has = (key: string) => typeof lookup(`${namespace}.${key}`) === 'string';
      return t;
    },
  };
});

describe('ProposedChangeCard', () => {
  it('names the mail a mail proposal changes and shows the text changes', () => {
    render(
      <ProposedChangeCard
        state={{
          key: 'p1',
          busy: false,
          status: 'PROPOSED',
          proposal: {
            status: 'PROPOSED',
            proposedChangeId: 'signed',
            kind: 'mail_template',
            courseId: 7,
            before: { mailType: 'APPLICATION_CONFIRMED', subject: 'Confirmed', content: '<p>Hi</p>' },
            after: { mailType: 'APPLICATION_CONFIRMED', subject: 'Confirmed', content: '<p>Hi, bring a laptop</p>' },
            expiresAt: '2026-11-26T10:00:00Z',
            message: '',
          },
        }}
        onApply={jest.fn()}
        onDiscard={jest.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Proposed change: email' })).toBeInTheDocument();
    expect(screen.getByText('Application Confirmed')).toBeInTheDocument();
    expect(screen.queryByText('APPLICATION_CONFIRMED')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Changes to Text')).toHaveTextContent('bring a laptop');
  });
});

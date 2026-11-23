import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { HelpContent, HelpContentProps, manualComponents } from '..';

jest.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    // Render each rich-text tag so the version links can be checked.
    t.rich = (key: string, tags: Record<string, () => React.ReactNode>) => (
      <>
        {key}
        {Object.entries(tags).map(([name, tag]) => (
          <React.Fragment key={name}>{tag()}</React.Fragment>
        ))}
      </>
    );
    return t;
  },
}));

jest.mock('../../../layout/Page', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

// react-markdown/remark-gfm ship as ESM; render the body as plain text here.
// The heading ids and links are tested through manualComponents below.
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="markdown">{children}</div>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));

const props: HelpContentProps = {
  page: {
    slug: 'organizers/sessions',
    title: 'Sessions',
    summary: 'About Sessions.',
    audience: ['organizer', 'admin'],
    body: 'Sessions body',
  },
  sections: [
    { slug: 'participants', title: 'For participants', pages: [{ slug: 'participants/registration', title: 'Registering' }] },
    {
      slug: 'organizers',
      title: 'For Organizers',
      pages: [
        { slug: 'organizers/course-setup', title: 'Setting up a course' },
        { slug: 'organizers/sessions', title: 'Sessions' },
      ],
    },
  ],
  isFallback: false,
  version: { release: null, commit: null },
};

const SHA = '691b4b179d2a7c0f3b1c2d4e5f60718293a4b5c6';

describe('HelpContent', () => {
  const originalRulesUrl = process.env.NEXT_PUBLIC_HELP_DOCS_URL;
  afterEach(() => {
    process.env.NEXT_PUBLIC_HELP_DOCS_URL = originalRulesUrl;
  });

  it('shows the page with its audience and body', () => {
    render(<HelpContent {...props} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Sessions' })).toBeInTheDocument();
    expect(screen.getByText('audience_label: audience.organizer, audience.admin')).toBeInTheDocument();
    expect(screen.getByTestId('markdown')).toHaveTextContent('Sessions body');
  });

  it('links every section and page, and marks the current page', () => {
    render(<HelpContent {...props} />);

    // The navigation is rendered twice: collapsible on phones, sidebar on desktop.
    const navs = screen.getAllByRole('navigation', { name: 'nav_label' });
    expect(navs).toHaveLength(2);
    const nav = within(navs[1]);
    expect(nav.getByRole('link', { name: 'start' })).toHaveAttribute('href', '/help');
    expect(nav.getByRole('link', { name: 'For Organizers' })).toHaveAttribute('href', '/help/organizers');
    expect(nav.getByRole('link', { name: 'Registering' })).toHaveAttribute('href', '/help/participants/registration');
    expect(nav.getByRole('link', { name: 'Sessions' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Setting up a course' })).not.toHaveAttribute('aria-current');
  });

  it('says when the page is shown in the other language', () => {
    const { rerender } = render(<HelpContent {...props} />);
    expect(screen.queryByText('fallback_notice')).not.toBeInTheDocument();

    rerender(<HelpContent {...props} isFallback />);
    expect(screen.getByRole('note')).toHaveTextContent('fallback_notice');
  });

  it('links the organization rules only when a URL is configured', () => {
    delete process.env.NEXT_PUBLIC_HELP_DOCS_URL;
    const { unmount } = render(<HelpContent {...props} />);
    expect(screen.queryByText('org_rules_title')).not.toBeInTheDocument();
    unmount();

    process.env.NEXT_PUBLIC_HELP_DOCS_URL = 'https://rules.example.org/faq/';
    render(<HelpContent {...props} />);
    expect(screen.getByRole('link', { name: 'org_rules_link' })).toHaveAttribute('href', 'https://rules.example.org/faq/');
  });
});

describe('HelpContent version note', () => {
  it('links the release and the commit of a release build', () => {
    render(<HelpContent {...props} version={{ release: 'v2.44.0', commit: SHA }} />);

    expect(screen.getByText(/version_release/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'v2.44.0' })).toHaveAttribute(
      'href',
      'https://github.com/eduhub-org/eduhub/releases/tag/v2.44.0'
    );
    expect(screen.getByRole('link', { name: '691b4b1' })).toHaveAttribute(
      'href',
      `https://github.com/eduhub-org/eduhub/commit/${SHA}`
    );
  });

  it('shows only the commit on staging and develop builds', () => {
    render(<HelpContent {...props} version={{ release: null, commit: SHA }} />);

    expect(screen.getByText(/version_commit/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '691b4b1' })).toBeInTheDocument();
  });

  it('shows nothing when the build does not know its commit', () => {
    render(<HelpContent {...props} />);

    expect(screen.queryByText(/version_/)).not.toBeInTheDocument();
  });
});

describe('manualComponents', () => {
  const components = manualComponents('organizers/sessions');
  const H2 = components.h2 as React.FC<{ children: React.ReactNode }>;
  const H3 = components.h3 as React.FC<{ children: React.ReactNode }>;
  const A = components.a as React.FC<{ href?: string; children: React.ReactNode }>;

  it('gives headings stable ids, also with nested formatting', () => {
    render(
      <>
        <H2>Telling participants about changes</H2>
        <H3>
          Termine <strong>löschen</strong>
        </H3>
      </>
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'telling-participants-about-changes');
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('id', 'termine-loeschen');
  });

  it('turns links to other manual pages into /help links', () => {
    render(<A href="../participants/registration.md#logging-in">Registering</A>);
    expect(screen.getByRole('link', { name: 'Registering' })).toHaveAttribute(
      'href',
      '/help/participants/registration#logging-in'
    );
  });

  it('opens external links in a new tab', () => {
    render(<A href="https://example.org">Example</A>);
    const link = screen.getByRole('link', { name: 'Example' });
    expect(link).toHaveAttribute('href', 'https://example.org');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

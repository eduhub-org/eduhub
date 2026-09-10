import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import FaqSection from '../FaqSection';

const useQuery = jest.fn();

jest.mock('@apollo/client', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'de',
}));

// react-markdown/remark-gfm ship as ESM and are not part of what this test
// exercises; render the answer as plain text instead.
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));

const faq = (id: number, translations: unknown[], fallback: unknown[] = []) => ({
  id,
  FaqTranslations: translations,
  FaqTranslations_fallback: fallback,
});

const de = (question: string, answer: string) => ({ id: 1, lang: 'DE', question, answer });
const en = (question: string, answer: string) => ({ id: 2, lang: 'EN', question, answer });

const mockFaqs = (Faqs: unknown[]) =>
  useQuery.mockReturnValue({
    data: { FaqCollection: [{ id: 1, name: 'stujo', Faqs }] },
    loading: false,
    error: undefined,
  });

describe('FaqSection', () => {
  beforeEach(() => {
    useQuery.mockReset();
  });

  it('queries the requested collection in the active locale', () => {
    mockFaqs([]);
    render(<FaqSection collection="stujo" />);

    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ variables: { collection: 'stujo', lang: 'DE' } })
    );
  });

  it('renders the questions in the order the query returned them', () => {
    mockFaqs([
      faq(1, [de('Erste Frage', 'Erste Antwort')]),
      faq(2, [de('Zweite Frage', 'Zweite Antwort')]),
    ]);
    render(<FaqSection collection="stujo" />);

    const questions = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(questions).toEqual(['Erste Frage', 'Zweite Frage']);
  });

  it('falls back to the English translation when the locale one is missing', () => {
    mockFaqs([faq(1, [], [en('Only English', 'English answer')])]);
    render(<FaqSection collection="stujo" />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Only English');
  });

  it('drops entries that have no translation at all', () => {
    mockFaqs([faq(1, [de('Übersetzt', 'Antwort')]), faq(2, [])]);
    render(<FaqSection collection="stujo" />);

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  });

  it('reveals the answer when the question is clicked', () => {
    mockFaqs([faq(1, [de('Eine Frage', 'Die Antwort')])]);
    render(<FaqSection collection="stujo" />);

    const button = screen.getByRole('button', { name: /Eine Frage/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Die Antwort')).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Die Antwort')).toBeInTheDocument();
  });

  it('shows the empty state when the collection has no entries', () => {
    mockFaqs([]);
    render(<FaqSection collection="stujo" />);

    expect(screen.getByText('faq.no_faqs_available')).toBeInTheDocument();
  });
});

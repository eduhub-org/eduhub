import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssistantWidget } from '../AssistantWidget';
import type { ChatEvent, ChatRequest, ProposedChange, ReportDraft } from '../api';

// next-intl ships ESM only, which this Jest setup can't load. This stand-in reads
// the real en.json, so a missing translation key still fails the test.
jest.mock('next-intl', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const messages = require('../../../locales/en.json');
  const lookup = (path: string): unknown =>
    path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], messages);
  return {
    useLocale: () => 'en',
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

const mockRefetchQueries = jest.fn().mockResolvedValue([]);
jest.mock('@apollo/client', () => ({ useApolloClient: () => ({ refetchQueries: mockRefetchQueries }) }));

const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({ signIn: (...args: unknown[]) => mockSignIn(...args) }));

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/manage/course/[courseId]', asPath: '/manage/course/7', query: { courseId: '7' } }),
}));

let mockLoggedIn = true;
jest.mock('../../../hooks/authentication', () => ({
  useIsLoggedIn: () => mockLoggedIn,
  useIsSessionLoading: () => false,
  useCurrentUserId: () => (mockLoggedIn ? 'user-1' : null),
  useCurrentRole: () => (mockLoggedIn ? 'instructor' : 'anonymous'),
  useIsOrgAdmin: () => false,
}));

let mockImpersonationTarget: object | null = null;
jest.mock('../../../contexts/ImpersonationContext', () => ({
  useImpersonation: () => ({ target: mockImpersonationTarget, loading: false }),
}));

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <p>{children}</p>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));

// The mock backend: follows the contract in components/assistant/README.md.
const mockStreamChat = jest.fn();
const mockDecideProposal = jest.fn();
const mockSendFeedback = jest.fn();
const mockSendReport = jest.fn();
jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  sendReport: (...args: unknown[]) => mockSendReport(...args),
  streamChat: (...args: unknown[]) => mockStreamChat(...args),
  decideProposal: (...args: unknown[]) => mockDecideProposal(...args),
  sendFeedback: (...args: unknown[]) => mockSendFeedback(...args),
}));

const proposal: ProposedChange = {
  status: 'PROPOSED',
  proposedChangeId: 'signed-proposal-1',
  kind: 'course_texts',
  courseId: 7,
  before: { tagline: 'Learn Python fast', maxParticipants: 20 },
  after: { tagline: 'Learn Rust fast', maxParticipants: 25 },
  expiresAt: '2026-11-23T00:00:00Z',
  message: 'Not saved yet.',
};

/** Makes the mocked backend stream these events for the next question. */
const replyWith = (events: ChatEvent[]) =>
  mockStreamChat.mockImplementationOnce(
    async (_request: ChatRequest, _role: string, onEvent: (event: ChatEvent) => void) => {
      events.forEach(onEvent);
    }
  );

const renderWidget = () =>
  render(<AssistantWidget />);

const openPanel = () => fireEvent.click(screen.getByRole('button', { name: 'Open the AI Assistant' }));

/** Closes the panel and waits until MUI has removed it, so the page is accessible again. */
const closePanel = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
};

const ask = async (question: string) => {
  fireEvent.change(screen.getByLabelText('Your question'), { target: { value: question } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  });
};

beforeEach(() => {
  mockLoggedIn = true;
  mockImpersonationTarget = null;
  mockSignIn.mockClear();
  mockRefetchQueries.mockClear();
  mockStreamChat.mockReset();
  mockDecideProposal.mockReset();
  mockSendFeedback.mockReset().mockResolvedValue(true);
  mockSendReport.mockReset();
  window.sessionStorage.clear();
  document.body.innerHTML = '';
});

describe('AssistantWidget', () => {
  it('asks logged-out visitors to log in instead of opening the chat', () => {
    mockLoggedIn = false;
    renderWidget();
    openPanel();

    expect(screen.getByText(/Log in to ask the Assistant/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Your question')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(mockSignIn).toHaveBeenCalledWith('keycloak');
  });

  it('clears stored conversations once nobody is logged in', () => {
    window.sessionStorage.setItem('eduhub-assistant:user-1', '[]');
    window.sessionStorage.setItem('unrelated', 'kept');
    mockLoggedIn = false;
    renderWidget();

    expect(window.sessionStorage.getItem('eduhub-assistant:user-1')).toBeNull();
    expect(window.sessionStorage.getItem('unrelated')).toBe('kept');
  });

  it('always says it is an AI and links to the privacy policy', () => {
    renderWidget();
    openPanel();

    expect(screen.getByText(/AI · can make mistakes/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy#assistant');
  });

  it('is not available while an admin views the app as someone else', () => {
    mockImpersonationTarget = { id: 'someone-else' };
    renderWidget();
    openPanel();

    expect(screen.getByText(/not available while you are viewing EduHub as someone else/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Your question')).not.toBeInTheDocument();
  });

  it('sends the question with the page context, says what is sent and streams the reply', async () => {
    replyWith([
      { type: 'delta', text: 'Your course ' },
      { type: 'delta', text: 'starts on Monday.' },
      { type: 'done' },
    ]);
    renderWidget();
    openPanel();
    await ask('When does my course start?');

    const [request, role] = mockStreamChat.mock.calls[0];
    expect(role).toBe('instructor');
    expect(request).toEqual({
      locale: 'en',
      messages: [{ role: 'user', content: 'When does my course start?' }],
      pageContext: { path: '/manage/course/7', route: '/manage/course/[courseId]', courseId: 7 },
    });
    expect(await screen.findByText('Your course starts on Monday.')).toBeInTheDocument();
    expect(screen.getByText('Sent along: /manage/course/7')).toBeInTheDocument();
  });

  it('shows the backend’s localized error with a contact link when the Assistant cannot answer', async () => {
    replyWith([
      { type: 'error', error: { code: 'SPENDING_CAP_REACHED', message: 'The Assistant is paused for this month.' } },
    ]);
    renderWidget();
    openPanel();
    await ask('Hello?');

    expect(await screen.findByText(/The Assistant is paused for this month\./)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Contact the EduHub team' })[0]).toHaveAttribute(
      'href',
      'mailto:edu@opencampus.sh'
    );
  });

  it('offers questions and course tasks to start with, and sends the one picked', async () => {
    replyWith([{ type: 'delta', text: 'Here is a shorter one.' }, { type: 'done' }]);
    renderWidget();
    openPanel();

    expect(screen.getByRole('button', { name: 'What can you change in this course for me?' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Shorten the tagline' }));
    });

    expect(mockStreamChat.mock.calls[0][0].messages).toEqual([{ role: 'user', content: 'Shorten the tagline' }]);
    expect(await screen.findByText('Here is a shorter one.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Shorten the tagline' })).not.toBeInTheDocument();
  });

  it('opens with Ctrl+K and closes with Escape', async () => {
    renderWidget();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByLabelText('Your question'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open the AI Assistant' })).toBeInTheDocument();
  });

  it('does not send while Enter confirms an IME candidate', () => {
    renderWidget();
    openPanel();
    const input = screen.getByLabelText('Your question');
    fireEvent.change(input, { target: { value: 'にほんご' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(mockStreamChat).not.toHaveBeenCalled();
    expect(input).toHaveValue('にほんご');
  });

  it('translates errors that have no message from the server, such as a lost connection', async () => {
    replyWith([{ type: 'error', error: { code: 'NETWORK', message: '' } }]);
    renderWidget();
    openPanel();
    await ask('Hello?');

    expect(await screen.findByText(/The connection was lost/)).toBeInTheDocument();
  });

  it.each([
    ['no text', []],
    ['only whitespace', [{ type: 'delta', text: '  \n ' }]],
  ] as [string, ChatEvent[]][])('says so when a reply ends with %s', async (_case, events) => {
    replyWith([...events, { type: 'done' }]);
    renderWidget();
    openPanel();
    await ask('Hello?');

    expect(await screen.findByText(/No answer came back/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Helpful' })).not.toBeInTheDocument();
  });

  it('says it is looking something up while a tool runs', async () => {
    let send: (event: ChatEvent) => void = () => undefined;
    let finish: () => void = () => undefined;
    mockStreamChat.mockImplementationOnce(
      (_request: ChatRequest, _role: string, onEvent: (event: ChatEvent) => void) =>
        new Promise<void>((resolve) => {
          send = onEvent;
          finish = resolve;
        })
    );
    renderWidget();
    openPanel();
    await ask('Am I on the waitlist?');

    act(() => send({ type: 'tool', name: 'get_my_registrations', status: 'running' }));
    expect(screen.getByText('Looking it up…')).toBeInTheDocument();
    act(() => send({ type: 'tool', name: 'get_my_registrations', status: 'done' }));
    act(() => send({ type: 'delta', text: 'Yes, place 3.' }));
    expect(screen.queryByText('Looking it up…')).not.toBeInTheDocument();
    await act(async () => finish());
    expect(screen.getByText('Yes, place 3.')).toBeInTheDocument();
  });

  describe('Report card (issue #2234)', () => {
    const showReport = async (report: ReportDraft) => {
      replyWith([{ type: 'delta', text: 'Here is a draft.' }, { type: 'report', report }, { type: 'done' }]);
      renderWidget();
      openPanel();
      await ask('The CSV export is broken');
      return screen.findByTestId('report-card');
    };
    const bug: ReportDraft = { kind: 'create', type: 'BUG', title: 'CSV export broken', description: 'Exporting fails.' };

    it('sends a drafted report only on the user\'s click, once, from the page it was asked on', async () => {
      let resolveSend: (value: unknown) => void = () => undefined;
      mockSendReport.mockImplementation(() => new Promise((resolve) => (resolveSend = resolve)));
      const card = await showReport(bug);
      expect(within(card).getByText('Report: Bug')).toBeInTheDocument();
      expect(within(card).getByText('CSV export broken')).toBeInTheDocument();
      expect(within(card).getByText(/Not sent yet/)).toBeInTheDocument();
      expect(mockSendReport).not.toHaveBeenCalled();

      const send = within(card).getByRole('button', { name: 'Send' });
      fireEvent.click(send);
      fireEvent.click(send);
      await act(async () => resolveSend({ ok: true, reportId: 3 }));

      expect(mockSendReport).toHaveBeenCalledTimes(1);
      expect(mockSendReport).toHaveBeenCalledWith(bug, { role: 'instructor', locale: 'en', route: '/manage/course/[courseId]' });
      expect(within(card).getByText(/What happened to my reports\?/)).toBeInTheDocument();
      expect(within(card).queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
    });

    it('keeps a send on its way, and its outcome, across a remount, so it is never sent twice', async () => {
      let resolveSend: (value: unknown) => void = () => undefined;
      mockSendReport.mockImplementation(() => new Promise((resolve) => (resolveSend = resolve)));
      const card = await showReport(bug);
      fireEvent.click(within(card).getByRole('button', { name: 'Send' }));

      // Navigating while the send is on its way: the outcome lands in the stored conversation.
      cleanup();
      await act(async () => resolveSend({ ok: true, reportId: 3 }));
      renderWidget();
      openPanel();
      const remounted = await screen.findByTestId('report-card');
      expect(within(remounted).getByText(/What happened to my reports\?/)).toBeInTheDocument();
      expect(within(remounted).queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
      expect(mockSendReport).toHaveBeenCalledTimes(1);
    });

    it('shows a send still on its way after a remount and its outcome once it arrives', async () => {
      let resolveSend: (value: unknown) => void = () => undefined;
      mockSendReport.mockImplementation(() => new Promise((resolve) => (resolveSend = resolve)));
      const card = await showReport(bug);
      fireEvent.click(within(card).getByRole('button', { name: 'Send' }));

      cleanup();
      renderWidget();
      openPanel();
      const remounted = await screen.findByTestId('report-card');
      expect(within(remounted).getByRole('button', { name: 'Sending…' })).toBeDisabled();
      await act(async () => resolveSend({ ok: true, reportId: 3 }));
      expect(within(screen.getByTestId('report-card')).getByText(/What happened to my reports\?/)).toBeInTheDocument();
      expect(mockSendReport).toHaveBeenCalledTimes(1);
    });

    it('tells the model what the user did with the card', async () => {
      const card = await showReport({ kind: 'vote', reportId: 4, type: 'FEATURE', summary: 'Dark mode for the platform' });
      expect(within(card).getByText('Existing report: Idea')).toBeInTheDocument();
      fireEvent.click(within(card).getByRole('button', { name: 'Discard' }));
      expect(within(card).getByText('Discarded. Nothing was sent.')).toBeInTheDocument();

      replyWith([{ type: 'delta', text: 'Okay.' }, { type: 'done' }]);
      await ask('Never mind');
      const request = mockStreamChat.mock.calls[1][0] as ChatRequest;
      expect(request.messages[1].proposals).toEqual([{ kind: 'report_vote', courseId: null, status: 'DISCARDED' }]);
      expect(mockSendReport).not.toHaveBeenCalled();
    });

    it('shows why sending failed and does not offer it again when it can\'t succeed', async () => {
      mockSendReport.mockResolvedValue({ ok: false, error: { code: 'REPORT_ALREADY_VOTED', message: 'You already support this report.' } });
      const card = await showReport({ kind: 'vote', reportId: 4, type: 'BUG', summary: 'Export fails' });
      await act(async () => {
        fireEvent.click(within(card).getByRole('button', { name: 'Join' }));
      });
      expect(within(card).getByText('You already support this report.')).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: 'Join' })).toBeDisabled();
    });
  });

  describe('Proposed Change', () => {
    const showProposal = async () => {
      replyWith([{ type: 'delta', text: 'Here is my suggestion.' }, { type: 'proposal', proposal }, { type: 'done' }]);
      renderWidget();
      openPanel();
      await ask('Make the tagline about Rust');
      return screen.findByTestId('proposed-change');
    };

    it('shows before and after, with a text diff for texts', async () => {
      const card = await showProposal();

      expect(within(card).getByText('Proposed change: course texts')).toBeInTheDocument();
      expect(within(card).getByText(/Not saved yet/)).toBeInTheDocument();
      expect(within(card).getByText('Python').tagName).toBe('DEL');
      expect(within(card).getByText('Rust').tagName).toBe('INS');
      expect(within(card).getByText('Maximum participants')).toBeInTheDocument();
      expect(within(card).getByText('20')).toBeInTheDocument();
      expect(within(card).getByText('25')).toBeInTheDocument();
    });

    it('applies only on the Organizer’s click, and only once', async () => {
      let resolveApply: (value: unknown) => void = () => undefined;
      mockDecideProposal.mockImplementation(() => new Promise((resolve) => (resolveApply = resolve)));
      const card = await showProposal();
      expect(mockDecideProposal).not.toHaveBeenCalled();

      const apply = within(card).getByRole('button', { name: 'Apply' });
      fireEvent.click(apply);
      fireEvent.click(apply);
      expect(within(card).getByRole('button', { name: 'Applying…' })).toBeDisabled();
      expect(within(card).getByRole('button', { name: 'Discard' })).toBeDisabled();

      await act(async () => resolveApply({ ok: true, result: { status: 'APPLIED' } }));

      expect(mockDecideProposal).toHaveBeenCalledTimes(1);
      // The course page behind the panel reloads its data to show the saved change.
      expect(mockRefetchQueries).toHaveBeenCalledWith({ include: 'active' });
      expect(mockDecideProposal).toHaveBeenCalledWith('signed-proposal-1', 'apply', 'instructor', 'en');
      expect(within(card).getByText('Applied and saved.')).toBeInTheDocument();
      expect(within(card).queryByText(/Not saved yet/)).not.toBeInTheDocument();
      expect(within(card).queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    });

    it('keeps an apply on its way, and its outcome, when the panel is closed and reopened', async () => {
      let resolveApply: (value: unknown) => void = () => undefined;
      mockDecideProposal.mockImplementation(() => new Promise((resolve) => (resolveApply = resolve)));
      const card = await showProposal();
      fireEvent.click(within(card).getByRole('button', { name: 'Apply' }));

      await closePanel();
      openPanel();
      expect(within(await screen.findByTestId('proposed-change')).getByRole('button', { name: 'Applying…' })).toBeDisabled();

      await closePanel();
      await act(async () => resolveApply({ ok: true, result: { status: 'APPLIED' } }));
      openPanel();
      expect(within(await screen.findByTestId('proposed-change')).getByText('Applied and saved.')).toBeInTheDocument();
      expect(mockDecideProposal).toHaveBeenCalledTimes(1);
    });

    it('keeps an apply on its way across a remount (navigating to another page)', async () => {
      let resolveApply: (value: unknown) => void = () => undefined;
      mockDecideProposal.mockImplementation(() => new Promise((resolve) => (resolveApply = resolve)));
      const card = await showProposal();
      fireEvent.click(within(card).getByRole('button', { name: 'Apply' }));

      cleanup();
      renderWidget();
      openPanel();
      const remounted = await screen.findByTestId('proposed-change');
      expect(within(remounted).getByRole('button', { name: 'Applying…' })).toBeDisabled();

      await act(async () => resolveApply({ ok: true, result: { status: 'APPLIED' } }));
      expect(within(screen.getByTestId('proposed-change')).getByText('Applied and saved.')).toBeInTheDocument();
      expect(mockDecideProposal).toHaveBeenCalledTimes(1);
    });

    it('says the outcome is unknown when a reload cut off an apply', async () => {
      window.sessionStorage.setItem(
        'eduhub-assistant:user-1',
        JSON.stringify([
          { id: 'm1', role: 'assistant', content: '', proposals: [{ key: 'gone', proposal, status: 'PROPOSED', busy: true }] },
        ])
      );
      renderWidget();
      openPanel();

      const card = await screen.findByTestId('proposed-change');
      expect(within(card).getByText(/It is unknown whether the change was saved/)).toBeInTheDocument();
    });

    it.each([
      ['STALE', /The course has changed since this was proposed/],
      ['TITLE_TAKEN', /A course with this title already exists in this program/],
    ])('shows why applying failed (%s) and does not offer that proposal again', async (code, text) => {
      mockDecideProposal.mockResolvedValue({ ok: false, error: { code, message: '' } });
      const card = await showProposal();

      await act(async () => {
        fireEvent.click(within(card).getByRole('button', { name: 'Apply' }));
      });

      expect(within(card).getByText(text)).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: 'Apply' })).toBeDisabled();
      expect(within(card).getByRole('button', { name: 'Discard' })).toBeEnabled();
    });

    it('can be discarded, forgets the signed id and tells the backend what happened to it', async () => {
      mockDecideProposal.mockResolvedValue({ ok: true, result: { status: 'DISCARDED' } });
      const card = await showProposal();

      await act(async () => {
        fireEvent.click(within(card).getByRole('button', { name: 'Discard' }));
      });
      expect(within(card).getByText('Discarded. Nothing was saved.')).toBeInTheDocument();
      expect(mockDecideProposal).toHaveBeenCalledWith('signed-proposal-1', 'discard', 'instructor', 'en');

      replyWith([{ type: 'done' }]);
      await ask('Thanks');
      const [request] = mockStreamChat.mock.calls[1];
      expect(request.messages[1]).toEqual({
        role: 'assistant',
        content: 'Here is my suggestion.',
        proposals: [{ kind: 'course_texts', courseId: 7, status: 'DISCARDED' }],
      });
      // Discard doesn't revoke the proposal on the server, so its id must not linger in this tab.
      expect(window.sessionStorage.getItem('eduhub-assistant:user-1')).not.toContain('signed-proposal-1');
    });
  });

  describe('feedback', () => {
    const answerOnce = async () => {
      replyWith([{ type: 'delta', text: 'An answer.' }, { type: 'done' }]);
      renderWidget();
      openPanel();
      await ask('A question');
      await screen.findByText('An answer.');
    };

    it('sends 👍 without the conversation', async () => {
      await answerOnce();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
      });

      expect(mockSendFeedback).toHaveBeenCalledWith({ rating: 'up', consent: false, route: '/manage/course/[courseId]' }, 'instructor');
      expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument();
    });

    it('asks for consent on 👎 and keeps the conversation only with it', async () => {
      await answerOnce();
      fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));

      expect(mockSendFeedback).not.toHaveBeenCalled();
      expect(screen.getByText(/May we keep this conversation for 30 days/)).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Yes, keep it' }));
      });

      expect(mockSendFeedback).toHaveBeenCalledWith(
        {
          rating: 'down',
          consent: true,
          route: '/manage/course/[courseId]',
          messages: [
            { role: 'user', content: 'A question' },
            { role: 'assistant', content: 'An answer.' },
          ],
        },
        'instructor'
      );
    });

    it('rates one answer and keeps only the conversation up to it', async () => {
      await answerOnce();
      replyWith([{ type: 'delta', text: 'A second answer.' }, { type: 'done' }]);
      await ask('Another question');
      await screen.findByText('A second answer.');

      fireEvent.click(screen.getAllByRole('button', { name: 'Not helpful' })[0]);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Yes, keep it' }));
      });

      expect(mockSendFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'A question' },
            { role: 'assistant', content: 'An answer.' },
          ],
        }),
        'instructor'
      );
    });

    it('keeps a rating when the panel is closed and reopened, so it is sent once', async () => {
      await answerOnce();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
      });

      await closePanel();
      openPanel();

      expect(screen.getByRole('button', { name: 'Helpful' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Helpful' })).toHaveAttribute('aria-pressed', 'true');
      expect(mockSendFeedback).toHaveBeenCalledTimes(1);
    });

    it('sends only the 👎 rating when consent is refused', async () => {
      await answerOnce();
      fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "No, don't keep it" }));
      });

      expect(mockSendFeedback).toHaveBeenCalledWith({ rating: 'down', consent: false, route: '/manage/course/[courseId]' }, 'instructor');
    });

    it('sends a 👎 comment with or without the conversation (issue #2234)', async () => {
      await answerOnce();
      fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));
      fireEvent.change(screen.getByLabelText("What wasn't helpful? (optional)"), { target: { value: ' The date is wrong. ' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "No, don't keep it" }));
      });

      expect(mockSendFeedback).toHaveBeenCalledWith(
        { rating: 'down', consent: false, route: '/manage/course/[courseId]', comment: 'The date is wrong.' },
        'instructor'
      );
    });
  });

  it('keeps the conversation in sessionStorage only', async () => {
    replyWith([{ type: 'delta', text: 'Stored answer.' }, { type: 'done' }]);
    renderWidget();
    openPanel();
    await ask('Remember me');

    await waitFor(() => expect(window.sessionStorage.getItem('eduhub-assistant:user-1')).toContain('Stored answer.'));
    expect(window.localStorage.getItem('eduhub-assistant:user-1')).toBeNull();
  });
});
